/**
 * Orchestration Types
 *
 * M12: Defines types for the intelligent orchestration engine that
 * automatically creates processes, opportunities, blueprints, and governance
 * artifacts from natural language conversations.
 */

/**
 * Intent categories for classifying user messages
 * M14: Enhanced with context-aware and clarification intents
 */
export type OrchestrationIntent =
  | 'process_description'
  | 'process_update'
  | 'refine_process' // M14: User is clarifying/updating an existing process
  | 'reference_existing_artifact' // M14: User refers to "that process" / "the last blueprint"
  | 'opportunity_request'
  | 'blueprint_request'
  | 'governance_request'
  | 'general_question'
  | 'session_summary_request'
  | 'clarification_needed' // M14: Internal - LLM can't confidently extract structure
  | 'unknown';

/**
 * Actions that can be taken by the orchestration engine
 */
export type OrchestrationAction =
  | 'extract_process'
  | 'update_process'
  | 'refine_process' // M14: Update existing process with new/refined steps
  | 'scan_opportunities'
  | 'generate_blueprint'
  | 'create_use_case'
  | 'draft_risk_assessment'
  | 'suggest_policies'
  | 'generate_summary'
  | 'respond_only';

/**
 * LLM response format for orchestration decisions
 * M14: Enhanced with confidence scoring and target IDs
 */
export type OrchestrationDecision = {
  intent: OrchestrationIntent;
  actions: OrchestrationAction[];
  explanation: string; // Natural language explanation for the user
  confidence?: number; // M14: 0-1 confidence score for intent classification (DEPRECATED - use intentConfidence)
  intentConfidence?: number; // M14: 0-1 confidence score for intent classification
  extractionConfidence?: number; // M14: 0-1 confidence score for data extraction quality
  targetIds?: { // M14: Referenced artifact IDs when user mentions existing items
    processId?: string;
    opportunityId?: string;
    blueprintId?: string;
    aiUseCaseId?: string;
  };
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
  };
};

/**
 * M14: Clarification request when LLM needs more info
 */
export type ClarificationRequest = {
  message: string;
  reason: 'low_intent_confidence' | 'low_extraction_confidence' | 'ambiguous_reference';
};

/**
 * M14: Next step suggestion (heuristic, non-LLM)
 * M15.1: Added 'extract_steps' action type for processes with 0 steps
 */
export type NextStepSuggestion = {
  label: string;
  actionType: 'describe_process' | 'extract_steps' | 'scan_opportunities' | 'generate_blueprint' | 'create_governance';
};

/**
 * Result of executing orchestration actions
 * M14: Enhanced with clarification and next step suggestions
 * M15: Added UI hints for scroll and highlight behavior
 * M15.1: Enhanced createdProcesses to include stepCount, steps, and links
 */
export type OrchestrationResult = {
  success: boolean;
  assistantMessage: string;
  artifacts: {
    createdProcesses?: Array<{
      id: string;
      name: string;
      stepCount?: number; // M15.1: Added for UI display
      steps?: any[];       // M15.1: Added for mini-map rendering
      links?: any[];       // M15.1: Added for mini-map rendering
    }>;
    createdSteps?: Array<{ id: string; title: string; processId: string }>;
    createdOpportunities?: Array<{ id: string; title: string }>;
    createdBlueprints?: Array<{ id: string; title: string }>;
    createdUseCases?: Array<{ id: string; title: string }>;
    updatedSummary?: string;
  };
  updatedMetadata: {
    processIds?: string[];
    opportunityIds?: string[];
    blueprintIds?: string[];
    aiUseCaseIds?: string[];
  };
  clarification?: ClarificationRequest; // M14: When assistant needs more info
  nextStepSuggestion?: NextStepSuggestion; // M14: Suggested next action
  ui?: { // M15: UI hints for workspace view
    scrollTo?: 'processes' | 'opportunities' | 'blueprints' | 'governance' | 'summary';
    highlightId?: string;
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
  workspaceId: string;
  processIds?: string[]; // Optional: specific processes to include in blueprint
  title?: string;
};

/**
 * Parameters for creating AI use case
 */
export type CreateUseCaseParams = {
  workspaceId: string;
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

/**
 * Parameters for process refinement action
 * M14: Used when updating/refining an existing process
 */
export type RefineProcessParams = {
  workspaceId: string;
  processId?: string; // Optional: explicit target process
  processName?: string; // Used for name similarity matching
  processDescription?: string; // Optional: update description
  steps?: Array<{
    title: string;
    description?: string;
    owner?: string;
    inputs?: string[];
    outputs?: string[];
    frequency?: string;
    duration?: string;
  }>;
  recentProcessIds?: string[]; // From session metadata for fallback identification
};
