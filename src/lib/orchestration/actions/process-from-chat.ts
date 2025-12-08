/**
 * Process Extraction Action Handler
 *
 * Creates processes and steps from conversational extraction.
 */

import { db } from '@/lib/db';
import { ExtractProcessParams } from '../types';

export async function extractProcessFromChat(
  params: ExtractProcessParams
): Promise<{
  process: any;
  steps: any[];
  links: any[];
}> {
  try {
    // M15.1: Validate that we have at least 2 steps
    if (!params.steps || params.steps.length < 2) {
      throw new Error('Process extraction requires at least 2 steps');
    }

    // Create the process directly in the workspace (no project needed)
    const process = await db.process.create({
      data: {
        workspaceId: params.workspaceId,
        name: params.processName,
        description: params.processDescription || '',
      },
    });

    // Create all steps with proper positioning
    const createdSteps = [];
    for (let i = 0; i < params.steps.length; i++) {
      const stepData = params.steps[i];

      const step = await db.processStep.create({
        data: {
          processId: process.id,
          title: stepData.title,
          description: stepData.description || '',
          owner: stepData.owner || null,
          frequency: stepData.frequency || null,
          duration: stepData.duration || null,
          inputs: stepData.inputs || [],
          outputs: stepData.outputs || [],
          positionX: i * 200, // Sequential positioning
          positionY: 100
        },
      });

      createdSteps.push(step);
    }

    // M15.1: Create sequential links between steps (CRITICAL FIX)
    const createdLinks = [];
    for (let i = 0; i < createdSteps.length - 1; i++) {
      const fromStep = createdSteps[i];
      const toStep = createdSteps[i + 1];

      const link = await db.processLink.create({
        data: {
          processId: process.id,
          fromStepId: fromStep.id,
          toStepId: toStep.id,
          label: null, // No label for sequential flow
        },
      });

      createdLinks.push(link);
    }

    return {
      process,
      steps: createdSteps,
      links: createdLinks,
    };
  } catch (error) {
    console.error('Error extracting process from chat:', error);
    throw new Error('Failed to extract process from chat');
  }
}
