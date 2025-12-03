/**
 * Session Metadata Helper Functions
 *
 * M11: Helper functions for managing AssistantSession metadata
 * Provides utilities to link processes, blueprints, and AI use cases to sessions
 */

type SessionMetadata = {
  processIds?: string[];
  blueprintIds?: string[];
  aiUseCaseIds?: string[];
  opportunityIds?: string[];
  [key: string]: any;
};

/**
 * Add a process ID to session metadata
 */
export function addLinkedProcessId(
  currentMetadata: SessionMetadata,
  processId: string
): SessionMetadata {
  const processIds = currentMetadata.processIds || [];
  if (!processIds.includes(processId)) {
    processIds.push(processId);
  }
  return {
    ...currentMetadata,
    processIds,
  };
}

/**
 * Add a blueprint ID to session metadata
 */
export function addLinkedBlueprintId(
  currentMetadata: SessionMetadata,
  blueprintId: string
): SessionMetadata {
  const blueprintIds = currentMetadata.blueprintIds || [];
  if (!blueprintIds.includes(blueprintId)) {
    blueprintIds.push(blueprintId);
  }
  return {
    ...currentMetadata,
    blueprintIds,
  };
}

/**
 * Add an AI use case ID to session metadata
 */
export function addLinkedAiUseCaseId(
  currentMetadata: SessionMetadata,
  aiUseCaseId: string
): SessionMetadata {
  const aiUseCaseIds = currentMetadata.aiUseCaseIds || [];
  if (!aiUseCaseIds.includes(aiUseCaseId)) {
    aiUseCaseIds.push(aiUseCaseId);
  }
  return {
    ...currentMetadata,
    aiUseCaseIds,
  };
}

/**
 * Add an opportunity ID to session metadata
 */
export function addLinkedOpportunityId(
  currentMetadata: SessionMetadata,
  opportunityId: string
): SessionMetadata {
  const opportunityIds = currentMetadata.opportunityIds || [];
  if (!opportunityIds.includes(opportunityId)) {
    opportunityIds.push(opportunityId);
  }
  return {
    ...currentMetadata,
    opportunityIds,
  };
}

/**
 * Get all linked IDs from session metadata
 */
export function getLinkedIds(metadata: SessionMetadata) {
  return {
    processIds: metadata.processIds || [],
    blueprintIds: metadata.blueprintIds || [],
    aiUseCaseIds: metadata.aiUseCaseIds || [],
    opportunityIds: metadata.opportunityIds || [],
  };
}

/**
 * Initialize empty session metadata
 */
export function initializeSessionMetadata(): SessionMetadata {
  return {
    processIds: [],
    blueprintIds: [],
    aiUseCaseIds: [],
    opportunityIds: [],
  };
}
