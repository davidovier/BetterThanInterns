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
}> {
  try {
    // Determine project ID
    let projectId = params.projectId;

    // If no projectId provided, create a new project
    if (!projectId) {
      const newProject = await db.project.create({
        data: {
          workspaceId: params.workspaceId,
          name: params.processName,
          description: params.processDescription || `Project for ${params.processName}`,
          status: 'draft',
        },
      });
      projectId = newProject.id;
    }

    // Create the process
    const process = await db.process.create({
      data: {
        projectId: projectId,
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

    return {
      process,
      steps: createdSteps,
    };
  } catch (error) {
    console.error('Error extracting process from chat:', error);
    throw new Error('Failed to extract process from chat');
  }
}
