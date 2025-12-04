/**
 * Orchestration Types
 *
 * M12: Defines types for the intelligent orchestration engine that
 * automatically creates processes, opportunities, blueprints, and governance
 * artifacts from natural language conversations.
 */

/**
 * Intent categories for classifying user messages
 */
export type OrchestrationIntent =
  | 'process_description'
  | 'process_update'
  | 'opportunity_request'
  | 'blueprint_request'
  | 'governance_request'
  | 'general_question'
  | 'session_summary_request'
  | 'unknown';

/**
 * Actions that can be taken by the orchestration engine
 */
export type OrchestrationAction =
  | 'extract_process'
  | 'update_process'
  | 'scan_opportunities'
  | 'generate_blueprint'
  | 'create_use_case'
  | 'draft_risk_assessment'
  | 'suggest_policies'
  | 'generate_summary'
  | 'respond_only';

/**
 * LLM response format for orchestration decisions
 */
export type OrchestrationDecision = {
  intent: OrchestrationIntent;
  actions: OrchestrationAction[];
  explanation: string; // Natural language explanation for the user
  data?: {
    // For process extraction
    processName?: string;
    processDescription?: string;
    steps?: Array<{
      title: string;
      description?: string;
      owner?: string;
      inputs?: string[];
      outputs?: string[];
      frequency?: string;
      duration?: string;
    }>;

    // For process updates
    stepUpdates?: Array<{
      stepId: string;
      changes: Record<string, any>;
    }>;

    // For governance
    useCaseTitle?: string;
    useCaseDescription?: string;

    // For summary
    summaryText?: string;

    // Target IDs for operations
    processId?: string;
    projectId?: string;
  };
};

/**
 * Result of executing orchestration actions
 */
export type OrchestrationResult = {
  success: boolean;
  assistantMessage: string;
  artifacts: {
    createdProcesses?: Array<{ id: string; name: string }>;
    createdSteps?: Array<{ id: string; title: string; processId: string }>;
    createdOpportunities?: Array<{ id: string; title: string }>;
    createdBlueprints?: Array<{ id: string; title: string }>;
    createdUseCases?: Array<{ id: string; title: string }>;
    updatedSummary?: string;
  };
  updatedMetadata: {
    projectId?: string;
    processIds?: string[];
    opportunityIds?: string[];
    blueprintIds?: string[];
    aiUseCaseIds?: string[];
  };
  error?: string;
};

/**
 * Context provided to orchestration functions
 */
export type OrchestrationContext = {
  sessionId: string;
  workspaceId: string;
  userId: string;
  currentMetadata: {
    projectId?: string;
    processIds?: string[];
    opportunityIds?: string[];
    blueprintIds?: string[];
    aiUseCaseIds?: string[];
    [key: string]: any;
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
};

/**
 * Parameters for process extraction action
 */
export type ExtractProcessParams = {
  processName: string;
  processDescription?: string;
  steps: Array<{
    title: string;
    description?: string;
    owner?: string;
    inputs?: string[];
    outputs?: string[];
    frequency?: string;
    duration?: string;
  }>;
  projectId?: string; // If null, create new project
  workspaceId: string;
};

/**
 * Parameters for opportunity scanning
 */
export type ScanOpportunitiesParams = {
  processId: string;
  workspaceId: string;
};

/**
 * Parameters for blueprint generation
 */
export type GenerateBlueprintParams = {
  projectId: string;
  workspaceId: string;
  title?: string;
};

/**
 * Parameters for creating AI use case
 */
export type CreateUseCaseParams = {
  workspaceId: string;
  projectId: string;
  title: string;
  description: string;
  linkedProcessIds?: string[];
  linkedOpportunityIds?: string[];
};

/**
 * Parameters for session summary generation
 */
export type GenerateSummaryParams = {
  sessionId: string;
  workspaceId: string;
};
