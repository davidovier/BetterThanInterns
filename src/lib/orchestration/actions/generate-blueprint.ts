/**
 * Blueprint Generation Action Handler
 *
 * Generates implementation blueprints using existing blueprint generator.
 */

import { generateBlueprintForWorkspace } from '@/lib/blueprint-generator';
import { GenerateBlueprintParams } from '../types';

export async function generateBlueprint(
  params: GenerateBlueprintParams
): Promise<string> {
  try {
    // Use existing blueprint generator
    const { blueprint } = await generateBlueprintForWorkspace(
      params.workspaceId,
      params.processIds
    );

    // Return blueprint ID
    return blueprint.id;
  } catch (error) {
    console.error('Error generating blueprint:', error);
    throw new Error('Failed to generate blueprint');
  }
}
