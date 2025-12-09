/**
 * Orchestration Router
 *
 * Main orchestration engine that analyzes user messages and routes to appropriate actions.
 * M14: Enhanced with context-aware intent classification, clarification logic, and next-step suggestions.
 */

import { openai } from '@/lib/llm';
import { db } from '@/lib/db';
import {
  OrchestrationContext,
  OrchestrationResult,
  OrchestrationDecision,
} from './types';
import { extractProcessFromChat } from './actions/process-from-chat';
import { refineProcess } from './actions/refine-process';
import { scanOpportunities } from './actions/opportunity-scan';
import { generateBlueprint } from './actions/generate-blueprint';
import { createAiUseCase } from './actions/governance-flow';
import { generateSessionSummary } from './actions/session-summary';
import {
  CONFIDENCE_MIN_FOR_ACTION,
  computeNextStepSuggestion,
  generateClarificationQuestion,
  fetchArtifactNamesForContext,
  maybeUpdateSessionTitle,
} from './m14-helpers';

/**
 * Main orchestration function
 * M14: Enhanced with clarification checks and next-step suggestions
 */
export async function orchestrate(
  context: OrchestrationContext,
  userMessage: string
): Promise<OrchestrationResult> {
  try {
    // M14: Step 1 - Get orchestration decision from LLM (with confidence)
    const decision = await getOrchestrationDecision(context, userMessage);

    // M14: Step 2 - Initialize result tracking
    const result: OrchestrationResult = {
      success: true,
      assistantMessage: decision.explanation,
      artifacts: {},
      updatedMetadata: { ...context.currentMetadata },
    };

    // M14: Step 3 - Check if clarification is needed (low confidence or ambiguous)
    const needsClarification = shouldRequestClarification(decision, context);

    if (needsClarification) {
      // Generate clarification question instead of executing actions
      const sessionContextStr = buildSessionContext(context);
      const clarificationMessage = await generateClarificationQuestion(
        userMessage,
        sessionContextStr,
        needsClarification.reason
      );

      result.assistantMessage = clarificationMessage;
      result.clarification = {
        message: clarificationMessage,
        reason: needsClarification.reason,
      };

      // Don't execute actions, but still compute next step suggestion
      const nextStep = await computeNextStepFromMetadata(context.currentMetadata);
      if (nextStep) {
        result.nextStepSuggestion = nextStep;
      }

      return result;
    }

    // M14: Step 4 - Execute actions based on decision (original behavior)
    for (const action of decision.actions) {
      try {
        await executeAction(action, decision, context, result);
      } catch (error) {
        console.error(`Error executing action ${action}:`, error);
        // Continue with other actions even if one fails
      }
    }

    // M14: Step 5 - Compute next step suggestion after actions complete
    const nextStep = await computeNextStepFromMetadata(result.updatedMetadata);
    if (nextStep) {
      result.nextStepSuggestion = nextStep;
    }

    // M14: Step 6 - Maybe auto-update session title (async, don't wait)
    maybeAutoUpdateSessionTitle(context, userMessage, result).catch((err) => {
      console.error('Failed to auto-update session title:', err);
    });

    return result;
  } catch (error) {
    console.error('Orchestration error:', error);
    return {
      success: false,
      assistantMessage: 'I encountered an error processing your request. Please try again.',
      artifacts: {},
      updatedMetadata: context.currentMetadata,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get orchestration decision from LLM
 * M14: Enhanced with artifact context and confidence scoring
 */
async function getOrchestrationDecision(
  context: OrchestrationContext,
  userMessage: string
): Promise<OrchestrationDecision> {
  // M14: Fetch artifact names for context-aware classification
  const artifacts = await fetchArtifactNamesForContext(
    context.workspaceId,
    context.currentMetadata
  );

  const systemPrompt = `You are an intelligent orchestration engine for a business process automation platform.

Your role is to:
1. Classify user intent with confidence scoring
2. Determine which actions to take
3. Extract structured data from the conversation
4. Identify references to existing artifacts
5. Provide a natural language response

INTENTS:
- process_description: User is describing a NEW business process with steps
- refine_process: User is clarifying/updating an EXISTING process
- reference_existing_artifact: User refers to "that process", "the last blueprint", etc.
- opportunity_request: User asks to scan for automation opportunities
- blueprint_request: User wants to generate an implementation blueprint
- governance_request: User wants to register an AI use case for governance
- session_summary_request: User asks for a summary of the session
- clarification_needed: You cannot confidently extract enough information (use this when unsure)
- general_question: User is asking questions or having a general conversation

ACTIONS:
- extract_process: Extract and create a NEW process with steps (use when user describes a brand new process)
- refine_process: Update/refine an EXISTING process with additional or modified steps (use when user is clarifying or adding to an existing process)
- scan_opportunities: Analyze process steps for automation opportunities
- generate_blueprint: Create an implementation blueprint for a project
- create_use_case: Register an AI use case for governance tracking
- generate_summary: Generate a session summary
- respond_only: Just provide a conversational response

CONFIDENCE SCORING:
- Return a confidence score (0.0-1.0) for your intent classification
- High confidence (0.8-1.0): Clear, detailed user message with all needed info
- Medium confidence (0.5-0.8): User intent is clear but some details missing
- Low confidence (0.0-0.5): Ambiguous, vague, or incomplete information
- If confidence < 0.65, consider using "clarification_needed" intent

CONTEXT-AWARE BEHAVIOR:
- If user says "that process" / "the last one" / etc., use reference_existing_artifact intent
- Match user references to these existing artifacts:
  Processes: ${artifacts.processes.map((p) => `"${p.name}" (ID: ${p.id})`).join(', ') || 'none'}
  Opportunities: ${artifacts.opportunities.map((o) => `"${o.title}" (ID: ${o.id})`).join(', ') || 'none'}
  Blueprints: ${artifacts.blueprints.map((b) => `"${b.title}" (ID: ${b.id})`).join(', ') || 'none'}
- If multiple matches exist and user is ambiguous, use clarification_needed

GUIDELINES:
- If user describes a NEW multi-step process with clear steps → use extract_process
- If user is adding to/clarifying/updating an EXISTING process → use refine_process with the intent refine_process
  * Examples: "Actually, add a step for...", "The approval process also includes...", "Let me add more details to that process"
  * You must identify which process to refine using processName matching or targetIds
- If user mentions "opportunities" or "automation" → scan_opportunities
- If user says "blueprint" or "implementation plan" → generate_blueprint
- If user mentions "governance" or "AI use case" → create_use_case
- If user asks for "summary" → generate_summary
- If user is vague or incomplete → clarification_needed with low confidence
- For general questions → respond_only

CHOOSING BETWEEN extract_process AND refine_process:
- extract_process: User is describing something completely new, no existing process referenced
- refine_process: User is building on or modifying something already discussed/created in this session
  * Look at existing process names to determine if user is referring to one of them
  * If user says "that process", "the X process", "add to the workflow", etc. → refine_process
  * If confidence is high that this is a refinement, use refine_process even if processName is slightly different

Return ONLY valid JSON in this exact format:
{
  "intent": "intent_type",
  "actions": ["action1", "action2"],
  "confidence": 0.85,
  "targetIds": {
    "processId": "optional_if_user_referenced_existing",
    "opportunityId": "optional",
    "blueprintId": "optional"
  },
  "explanation": "Natural language response to the user",
  "data": {
    "processName": "optional",
    "processDescription": "optional",
    "steps": [{"title": "Step 1", "description": "...", "owner": "...", "inputs": [], "outputs": [], "frequency": "...", "duration": "..."}],
    "useCaseTitle": "optional",
    "useCaseDescription": "optional"
  }
}`;

  // Build conversation context
  const conversationMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...context.conversationHistory.slice(-5), // Last 5 messages for context
    { role: 'user' as const, content: userMessage },
  ];

  // Add context about current session state
  const sessionContext = buildSessionContext(context);
  if (sessionContext) {
    conversationMessages.splice(1, 0, {
      role: 'system' as const,
      content: sessionContext,
    });
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: conversationMessages,
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error('Empty LLM response');
  }

  const decision = JSON.parse(responseText) as OrchestrationDecision;

  // Validate decision structure
  if (!decision.intent || !decision.actions || !decision.explanation) {
    throw new Error('Invalid decision structure from LLM');
  }

  return decision;
}

/**
 * Build session context summary for LLM
 */
function buildSessionContext(context: OrchestrationContext): string {
  const parts: string[] = ['CURRENT SESSION STATE:'];

  if (context.currentMetadata.processIds && context.currentMetadata.processIds.length > 0) {
    parts.push(`- ${context.currentMetadata.processIds.length} process(es) created`);
  }

  if (context.currentMetadata.opportunityIds && context.currentMetadata.opportunityIds.length > 0) {
    parts.push(`- ${context.currentMetadata.opportunityIds.length} automation opportunity(ies) identified`);
  }

  if (context.currentMetadata.blueprintIds && context.currentMetadata.blueprintIds.length > 0) {
    parts.push(`- ${context.currentMetadata.blueprintIds.length} blueprint(s) generated`);
  }

  if (context.currentMetadata.aiUseCaseIds && context.currentMetadata.aiUseCaseIds.length > 0) {
    parts.push(`- ${context.currentMetadata.aiUseCaseIds.length} AI use case(s) registered`);
  }

  if (parts.length === 1) {
    return ''; // No context to add
  }

  return parts.join('\n');
}

/**
 * Execute a specific action
 */
async function executeAction(
  action: string,
  decision: OrchestrationDecision,
  context: OrchestrationContext,
  result: OrchestrationResult
): Promise<void> {
  switch (action) {
    case 'extract_process':
      await handleExtractProcess(decision, context, result);
      break;

    case 'refine_process':
      await handleRefineProcess(decision, context, result);
      break;

    case 'scan_opportunities':
      await handleScanOpportunities(decision, context, result);
      break;

    case 'generate_blueprint':
      await handleGenerateBlueprint(decision, context, result);
      break;

    case 'create_use_case':
      await handleCreateUseCase(decision, context, result);
      break;

    case 'generate_summary':
      await handleGenerateSummary(context, result);
      break;

    case 'respond_only':
      // No action needed, just use the explanation
      break;

    default:
      console.warn(`Unknown action: ${action}`);
  }
}

/**
 * Handle process extraction
 * M15.1: Now returns full process data with steps and links for UI rendering
 */
async function handleExtractProcess(
  decision: OrchestrationDecision,
  context: OrchestrationContext,
  result: OrchestrationResult
): Promise<void> {
  if (!decision.data?.processName || !decision.data?.steps) {
    throw new Error('Missing process data');
  }

  // M15.1: Validate we have at least 2 steps before attempting extraction
  if (decision.data.steps.length < 2) {
    throw new Error('Process must have at least 2 steps');
  }

  const { process, steps, links } = await extractProcessFromChat({
    processName: decision.data.processName,
    processDescription: decision.data.processDescription,
    steps: decision.data.steps,
    workspaceId: context.workspaceId,
  });

  // M15.1: Fetch full process data with steps and links for frontend
  const fullProcess = await db.process.findUnique({
    where: { id: process.id },
    include: {
      steps: {
        select: {
          id: true,
          title: true,
          description: true,
          owner: true,
          positionX: true,
          positionY: true,
          frequency: true,
          duration: true,
          inputs: true,
          outputs: true,
        },
      },
      links: {
        select: {
          id: true,
          fromStepId: true,
          toStepId: true,
          label: true,
        },
      },
      _count: {
        select: { steps: true },
      },
    },
  });

  // Update result with full structured process data
  result.artifacts.createdProcesses = [
    ...(result.artifacts.createdProcesses || []),
    {
      id: process.id,
      name: process.name,
      stepCount: fullProcess?._count?.steps || steps.length,
      steps: fullProcess?.steps || steps,
      links: fullProcess?.links || links,
    },
  ];

  result.artifacts.createdSteps = [
    ...(result.artifacts.createdSteps || []),
    ...steps.map((s) => ({ id: s.id, title: s.title, processId: process.id })),
  ];

  // M15.1: Add UI hint to scroll to the newly created process
  result.ui = {
    scrollTo: 'processes',
    highlightId: process.id,
  };

  // Update metadata
  result.updatedMetadata.processIds = [
    ...(result.updatedMetadata.processIds || []),
    process.id,
  ];
}

/**
 * Handle process refinement
 * M14: Updates existing process instead of creating a new one
 */
async function handleRefineProcess(
  decision: OrchestrationDecision,
  context: OrchestrationContext,
  result: OrchestrationResult
): Promise<void> {
  // Build parameters for refinement
  const recentProcessIds = (context.currentMetadata.processIds || []) as string[];

  const { process, steps, links, wasUpdated } = await refineProcess({
    workspaceId: context.workspaceId,
    processId: decision.targetIds?.processId || decision.data?.processId,
    processName: decision.data?.processName,
    processDescription: decision.data?.processDescription,
    steps: decision.data?.steps,
    recentProcessIds,
  });

  if (wasUpdated) {
    // Fetch full process data with counts for UI
    const fullProcess = await db.process.findUnique({
      where: { id: process.id },
      include: {
        steps: {
          select: {
            id: true,
            title: true,
            description: true,
            owner: true,
            positionX: true,
            positionY: true,
            frequency: true,
            duration: true,
            inputs: true,
            outputs: true,
          },
        },
        links: {
          select: {
            id: true,
            fromStepId: true,
            toStepId: true,
            label: true,
          },
        },
        _count: {
          select: { steps: true },
        },
      },
    });

    // Update result with refined process data
    result.artifacts.createdProcesses = [
      ...(result.artifacts.createdProcesses || []),
      {
        id: process.id,
        name: process.name,
        stepCount: fullProcess?._count?.steps || steps.length,
        steps: fullProcess?.steps || steps,
        links: fullProcess?.links || links,
      },
    ];

    // Add UI hint to scroll to the updated process
    result.ui = {
      scrollTo: 'processes',
      highlightId: process.id,
    };

    // Ensure process ID is in metadata (it should already be there)
    if (!result.updatedMetadata.processIds?.includes(process.id)) {
      result.updatedMetadata.processIds = [
        ...(result.updatedMetadata.processIds || []),
        process.id,
      ];
    }
  }
}

/**
 * Handle opportunity scanning
 */
async function handleScanOpportunities(
  decision: OrchestrationDecision,
  context: OrchestrationContext,
  result: OrchestrationResult
): Promise<void> {
  // Determine which process to scan
  let processId = decision.data?.processId;

  // If no specific process ID, use the most recently created one
  if (!processId && result.artifacts.createdProcesses && result.artifacts.createdProcesses.length > 0) {
    processId = result.artifacts.createdProcesses[result.artifacts.createdProcesses.length - 1].id;
  }

  // If still no process ID, use from context metadata
  if (!processId && context.currentMetadata.processIds && context.currentMetadata.processIds.length > 0) {
    const processIds = context.currentMetadata.processIds as string[];
    processId = processIds[processIds.length - 1];
  }

  if (!processId) {
    throw new Error('No process available to scan for opportunities');
  }

  const opportunityIds = await scanOpportunities({
    processId,
    workspaceId: context.workspaceId,
  });

  // Fetch opportunity details for result
  const opportunities = await db.opportunity.findMany({
    where: { id: { in: opportunityIds } },
    select: { id: true, title: true },
  });

  result.artifacts.createdOpportunities = [
    ...(result.artifacts.createdOpportunities || []),
    ...opportunities.map((o) => ({ id: o.id, title: o.title })),
  ];

  result.updatedMetadata.opportunityIds = [
    ...(result.updatedMetadata.opportunityIds || []),
    ...opportunityIds,
  ];
}

/**
 * Handle blueprint generation
 */
async function handleGenerateBlueprint(
  decision: OrchestrationDecision,
  context: OrchestrationContext,
  result: OrchestrationResult
): Promise<void> {
  // Use workspaceId and optionally filter by specific processes
  const processIds = result.updatedMetadata.processIds || context.currentMetadata.processIds;

  if (!processIds || processIds.length === 0) {
    throw new Error('No processes available to generate blueprint');
  }

  const blueprintId = await generateBlueprint({
    workspaceId: context.workspaceId,
    processIds: processIds as string[],
    title: decision.data?.processName,
  });

  // Fetch blueprint details
  const blueprint = await db.blueprint.findUnique({
    where: { id: blueprintId },
    select: { id: true, title: true },
  });

  if (blueprint) {
    result.artifacts.createdBlueprints = [
      ...(result.artifacts.createdBlueprints || []),
      { id: blueprint.id, title: blueprint.title },
    ];

    result.updatedMetadata.blueprintIds = [
      ...(result.updatedMetadata.blueprintIds || []),
      blueprintId,
    ];
  }
}

/**
 * Handle AI use case creation
 */
async function handleCreateUseCase(
  decision: OrchestrationDecision,
  context: OrchestrationContext,
  result: OrchestrationResult
): Promise<void> {
  if (!decision.data?.useCaseTitle || !decision.data?.useCaseDescription) {
    throw new Error('Missing use case data');
  }

  const { useCaseId } = await createAiUseCase(
    {
      workspaceId: context.workspaceId,
      title: decision.data.useCaseTitle,
      description: decision.data.useCaseDescription,
      linkedProcessIds: result.updatedMetadata.processIds,
      linkedOpportunityIds: result.updatedMetadata.opportunityIds,
    },
    {
      draftRiskAssessment: true,
    }
  );

  // Fetch use case details
  const useCase = await db.aiUseCase.findUnique({
    where: { id: useCaseId },
    select: { id: true, title: true },
  });

  if (useCase) {
    result.artifacts.createdUseCases = [
      ...(result.artifacts.createdUseCases || []),
      { id: useCase.id, title: useCase.title },
    ];

    result.updatedMetadata.aiUseCaseIds = [
      ...(result.updatedMetadata.aiUseCaseIds || []),
      useCaseId,
    ];
  }
}

/**
 * Handle session summary generation
 */
async function handleGenerateSummary(
  context: OrchestrationContext,
  result: OrchestrationResult
): Promise<void> {
  const summary = await generateSessionSummary({
    sessionId: context.sessionId,
    workspaceId: context.workspaceId,
  });

  result.artifacts.updatedSummary = summary;
}

/**
 * M14: Check if clarification is needed based on decision confidence
 */
function shouldRequestClarification(
  decision: OrchestrationDecision,
  context: OrchestrationContext
): { reason: 'low_intent_confidence' | 'low_extraction_confidence' | 'ambiguous_reference' } | null {
  // Intent explicitly says clarification needed
  if (decision.intent === 'clarification_needed') {
    return { reason: 'low_intent_confidence' };
  }

  // Low confidence score for actionable intents
  const actionableIntents = [
    'process_description',
    'refine_process',
    'opportunity_request',
    'blueprint_request',
    'governance_request',
  ];

  if (
    actionableIntents.includes(decision.intent) &&
    decision.confidence !== undefined &&
    decision.confidence < CONFIDENCE_MIN_FOR_ACTION
  ) {
    return { reason: 'low_intent_confidence' };
  }

  // Reference existing artifact but unclear which one
  if (decision.intent === 'reference_existing_artifact') {
    // Check if targetIds are ambiguous or missing
    const hasTarget =
      decision.targetIds?.processId ||
      decision.targetIds?.opportunityId ||
      decision.targetIds?.blueprintId;

    if (!hasTarget) {
      return { reason: 'ambiguous_reference' };
    }
  }

  // Process extraction with missing critical data
  if (
    decision.intent === 'process_description' &&
    (!decision.data?.processName || !decision.data?.steps || decision.data.steps.length < 2)
  ) {
    return { reason: 'low_extraction_confidence' };
  }

  return null;
}

/**
 * M14: Compute next step suggestion from metadata counts (heuristic, non-LLM)
 * M15.1: Enhanced to fetch actual step counts from database
 */
async function computeNextStepFromMetadata(metadata: {
  processIds?: string[];
  opportunityIds?: string[];
  blueprintIds?: string[];
  aiUseCaseIds?: string[];
}) {
  // M15.1: If we have processes, query database to get actual step counts
  let totalStepCount = undefined;

  if (metadata.processIds && metadata.processIds.length > 0) {
    try {
      const processes = await db.process.findMany({
        where: {
          id: { in: metadata.processIds },
        },
        include: {
          _count: {
            select: { steps: true },
          },
        },
      });

      // Sum up all step counts across all processes
      totalStepCount = processes.reduce((sum, p) => sum + (p._count?.steps || 0), 0);
    } catch (error) {
      console.error('Error fetching step counts:', error);
      // If query fails, leave totalStepCount as undefined
    }
  }

  return computeNextStepSuggestion({
    processCount: metadata.processIds?.length || 0,
    totalStepCount,
    opportunityCount: metadata.opportunityIds?.length || 0,
    blueprintCount: metadata.blueprintIds?.length || 0,
    aiUseCaseCount: metadata.aiUseCaseIds?.length || 0,
  });
}

/**
 * M14: Auto-update session title if appropriate (async, non-blocking)
 */
async function maybeAutoUpdateSessionTitle(
  context: OrchestrationContext,
  userMessage: string,
  result: OrchestrationResult
): Promise<void> {
  try {
    // Fetch current session to check title
    const session = await db.assistantSession.findUnique({
      where: { id: context.sessionId },
      select: { title: true },
    });

    if (!session) {
      return;
    }

    // Get first few user messages from history (simplified - in production would be from DB)
    const firstMessages = context.conversationHistory
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .slice(0, 3);

    // Add current message
    firstMessages.push(userMessage);

    // Get process names from newly created processes
    const processNames =
      result.artifacts.createdProcesses?.map((p) => p.name) || [];

    // Try to update title
    await maybeUpdateSessionTitle(
      context.sessionId,
      session.title,
      firstMessages,
      processNames
    );
  } catch (error) {
    console.error('Error in auto-update session title:', error);
    // Don't throw - this is non-critical
  }
}
