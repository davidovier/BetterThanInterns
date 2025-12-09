/**
 * Process Refinement Action Handler
 *
 * Updates existing processes with refined steps and links instead of creating duplicates.
 * Uses name similarity and conversation context to identify the target process.
 */

import { db } from '@/lib/db';
import { RefineProcessParams } from '../types';

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a score between 0 (completely different) and 1 (identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1.0;

  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }

  // Levenshtein distance calculation
  const matrix: number[][] = [];
  const len1 = s1.length;
  const len2 = s2.length;

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (s1.charAt(i - 1) === s2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  return 1 - distance / maxLength;
}

/**
 * Identify the target process for refinement
 * Uses multiple strategies:
 * 1. Explicit process ID from decision
 * 2. Name similarity with existing processes
 * 3. Most recently referenced/created process
 */
async function identifyTargetProcess(params: {
  explicitProcessId?: string;
  processName?: string;
  workspaceId: string;
  recentProcessIds: string[];
}): Promise<string | null> {
  const { explicitProcessId, processName, workspaceId, recentProcessIds } = params;

  // Strategy 1: Explicit ID from LLM decision
  if (explicitProcessId) {
    const exists = await db.process.findUnique({
      where: { id: explicitProcessId },
      select: { id: true },
    });
    if (exists) return explicitProcessId;
  }

  // Strategy 2: Name similarity matching
  if (processName && processName.length > 0) {
    const existingProcesses = await db.process.findMany({
      where: {
        workspaceId,
        id: { in: recentProcessIds.length > 0 ? recentProcessIds : undefined },
      },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
      take: 10, // Check last 10 processes
    });

    if (existingProcesses.length > 0) {
      // Calculate similarity scores
      const matches = existingProcesses.map((p) => ({
        id: p.id,
        name: p.name,
        similarity: calculateSimilarity(processName, p.name),
      }));

      // Sort by similarity
      matches.sort((a, b) => b.similarity - a.similarity);

      // Return best match if similarity > 0.6 (configurable threshold)
      if (matches[0].similarity > 0.6) {
        console.log(`Process identified by name similarity: "${matches[0].name}" (${matches[0].similarity.toFixed(2)})`);
        return matches[0].id;
      }
    }
  }

  // Strategy 3: Most recently referenced process (last in metadata)
  if (recentProcessIds.length > 0) {
    const mostRecent = recentProcessIds[recentProcessIds.length - 1];
    const exists = await db.process.findUnique({
      where: { id: mostRecent },
      select: { id: true },
    });
    if (exists) {
      console.log('Using most recently referenced process');
      return mostRecent;
    }
  }

  return null;
}

/**
 * Refine an existing process with updated steps and links
 */
export async function refineProcess(
  params: RefineProcessParams
): Promise<{
  process: any;
  steps: any[];
  links: any[];
  wasUpdated: boolean;
}> {
  try {
    // Identify target process
    const targetProcessId = await identifyTargetProcess({
      explicitProcessId: params.processId,
      processName: params.processName,
      workspaceId: params.workspaceId,
      recentProcessIds: params.recentProcessIds || [],
    });

    if (!targetProcessId) {
      throw new Error('Could not identify target process for refinement. Please be more specific.');
    }

    // Fetch existing process with steps and links
    const existingProcess = await db.process.findUnique({
      where: { id: targetProcessId },
      include: {
        steps: {
          orderBy: { createdAt: 'asc' },
        },
        links: true,
      },
    });

    if (!existingProcess) {
      throw new Error('Target process not found');
    }

    // Update process metadata if provided
    let process = existingProcess;
    if (params.processDescription !== undefined || params.processName !== undefined) {
      process = await db.process.update({
        where: { id: targetProcessId },
        data: {
          ...(params.processName && { name: params.processName }),
          ...(params.processDescription !== undefined && { description: params.processDescription }),
        },
        include: {
          steps: {
            orderBy: { createdAt: 'asc' },
          },
          links: true,
        },
      });
    }

    let updatedSteps = process.steps;
    let updatedLinks = process.links;

    // Handle step updates/additions if provided
    if (params.steps && params.steps.length > 0) {
      // Strategy: Match steps by title similarity, update existing, create new ones
      const stepMatches = new Map<number, string>(); // input index -> existing step ID

      for (let i = 0; i < params.steps.length; i++) {
        const inputStep = params.steps[i];
        let bestMatch: { id: string; similarity: number } | null = null;

        // Try to match with existing steps
        for (const existingStep of existingProcess.steps) {
          const similarity = calculateSimilarity(inputStep.title, existingStep.title);
          if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
            bestMatch = { id: existingStep.id, similarity };
          }
        }

        if (bestMatch) {
          stepMatches.set(i, bestMatch.id);
        }
      }

      // Update matched steps and create new ones
      const finalSteps = [];
      for (let i = 0; i < params.steps.length; i++) {
        const stepData = params.steps[i];
        const matchedStepId = stepMatches.get(i);

        if (matchedStepId) {
          // Update existing step
          const updated = await db.processStep.update({
            where: { id: matchedStepId },
            data: {
              title: stepData.title,
              description: stepData.description || '',
              owner: stepData.owner || null,
              frequency: stepData.frequency || null,
              duration: stepData.duration || null,
              inputs: stepData.inputs || [],
              outputs: stepData.outputs || [],
              positionX: i * 200,
              positionY: 100,
            },
          });
          finalSteps.push(updated);
        } else {
          // Create new step
          const created = await db.processStep.create({
            data: {
              processId: targetProcessId,
              title: stepData.title,
              description: stepData.description || '',
              owner: stepData.owner || null,
              frequency: stepData.frequency || null,
              duration: stepData.duration || null,
              inputs: stepData.inputs || [],
              outputs: stepData.outputs || [],
              positionX: i * 200,
              positionY: 100,
            },
          });
          finalSteps.push(created);
        }
      }

      // Delete orphaned steps (steps that weren't matched or updated)
      const finalStepIds = new Set(finalSteps.map((s) => s.id));
      const orphanedStepIds = existingProcess.steps
        .filter((s) => !finalStepIds.has(s.id))
        .map((s) => s.id);

      if (orphanedStepIds.length > 0) {
        await db.processStep.deleteMany({
          where: { id: { in: orphanedStepIds } },
        });
      }

      updatedSteps = finalSteps;

      // Recreate links sequentially
      await db.processLink.deleteMany({
        where: { processId: targetProcessId },
      });

      const newLinks = [];
      for (let i = 0; i < finalSteps.length - 1; i++) {
        const link = await db.processLink.create({
          data: {
            processId: targetProcessId,
            fromStepId: finalSteps[i].id,
            toStepId: finalSteps[i + 1].id,
            label: null,
          },
        });
        newLinks.push(link);
      }

      updatedLinks = newLinks;
    }

    return {
      process,
      steps: updatedSteps,
      links: updatedLinks,
      wasUpdated: true,
    };
  } catch (error) {
    console.error('Error refining process:', error);
    throw error;
  }
}
