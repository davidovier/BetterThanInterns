/**
 * Orchestration Router
 *
 * Main orchestration engine that analyzes user messages and routes to appropriate actions.
 * M14: Enhanced with context-aware intent classification, clarification logic, and next-step suggestions.
 */

import { openai } from '@/lib/llm';
import { db } from '@/lib/db';
import { chatCompletionWithBilling } from '@/lib/aiWrapper';
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
import { generateSessionOverview } from './actions/session-overview';
import {
  CONFIDENCE_THRESHOLDS,
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
      const sessionContextStr = await buildSessionContext(context);
      const clarificationMessage = await generateClarificationQuestion(
        context.workspaceId,
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

CRITICAL - CONVERSATION CONTEXT AND MULTI-PROCESS HANDLING:
You MUST read the conversation history to understand references. Here's how to handle common scenarios:

SCENARIO 1 - User mentions multiple processes then confirms:
User: "We have employee onboarding and customer onboarding"
You: "Should I map both?"
User: "both processes" or "yes" or "map both"
→ ACTION: Use extract_process with processes=[{employee onboarding steps}, {customer onboarding steps}]
→ NEVER ask "which processes?" - they were mentioned 2 messages ago!

SCENARIO 2 - User mentions multiple processes implicitly:
User: "We onboard employees and we also handle customer onboarding"
→ ACTION: Detect TWO processes mentioned, use extract_process with processes array
→ Create BOTH processes immediately

SCENARIO 3 - User references "both" or "them":
User: "both" / "both processes" / "those two" / "the ones I mentioned"
→ ACTION: Look back 2-5 messages to find what they're referring to
→ Extract structured data from those earlier messages

KEY RULES:
- If user says "both" after you asked about multiple processes → extract ALL processes from context
- Never ask "what two processes?" if processes were mentioned in last 5 messages
- Always scan previous messages for process names when user says "both" or "them"

INTENTS:
- process_description: User is describing a NEW business process with steps
- refine_process: User is clarifying/updating an EXISTING process
- reference_existing_artifact: User refers to "that process", "the last blueprint", etc.
- opportunity_request: User asks to scan for automation opportunities
- blueprint_request: User wants to generate an implementation blueprint
- governance_request: User wants to register an AI use case for governance
- session_summary_request: User asks for a summary of the session
- session_overview_request: User asks for an overview of all artifacts (processes, opportunities, blueprints, governance)
- clarification_needed: You cannot confidently extract enough information (use this when unsure)
- general_question: User is asking questions or having a general conversation

ACTIONS:
- extract_process: Extract and create a NEW process with steps (use when user describes a brand new process)
- refine_process: Update/refine an EXISTING process with additional or modified steps (use when user is clarifying or adding to an existing process)
- scan_opportunities: Analyze process steps for automation opportunities
- generate_blueprint: Create an implementation blueprint for a project
- create_use_case: Register an AI use case for governance tracking
- generate_summary: Generate a session summary
- generate_overview: Generate a structured overview of all session artifacts with counts and details
- respond_only: Just provide a conversational response

CONFIDENCE SCORING (M14 Enhanced - Separate Intent vs Extraction):
You must return TWO separate confidence scores:

1. intentConfidence (0.0-1.0): How sure are you about what the user WANTS to do?
   - High (0.8-1.0): Clear user intent, unambiguous request
   - Medium (0.5-0.8): Intent is reasonably clear but could be interpreted multiple ways
   - Low (0.0-0.5): Very ambiguous, multiple possible interpretations

2. extractionConfidence (0.0-1.0): How complete is the EXTRACTED DATA?
   - High (0.8-1.0): All critical fields extracted with high quality data
   - Medium (0.5-0.8): Most fields extracted but some are incomplete or uncertain
   - Low (0.0-0.5): Missing critical fields or very poor data quality

IMPORTANT: These are independent scores!
- User might clearly want to create a process (high intent) but only mention 1 step (low extraction)
- User might vaguely say "do something" (low intent) but describe 5 detailed steps (high extraction)

SPECIAL RULE FOR MULTI-PROCESS EXTRACTION:
When user clearly describes MULTIPLE processes with steps, set extractionConfidence >= 0.7 even if details are minimal.
The goal is to capture all processes mentioned, not to get perfect detail on each one.

CONTEXT-AWARE BEHAVIOR:
- If user says "that process" / "the last one" / etc., use reference_existing_artifact intent
- Match user references to these existing artifacts:
  Processes: ${artifacts.processes.map((p) => `"${p.name}" (ID: ${p.id})`).join(', ') || 'none'}
  Opportunities: ${artifacts.opportunities.map((o) => `"${o.title}" (ID: ${o.id})`).join(', ') || 'none'}
  Blueprints: ${artifacts.blueprints.map((b) => `"${b.title}" (ID: ${b.id})`).join(', ') || 'none'}
- If multiple matches exist and user is ambiguous, use clarification_needed

GUIDELINES:
- If user describes a NEW multi-step process with clear steps → use extract_process
- **MULTI-PROCESS DETECTION - CRITICAL**: If user describes MULTIPLE DISTINCT PROCESSES in one message → ALWAYS use extract_process with the "processes" array
  * Example: "We onboard employees and we also handle customer onboarding" = 2 processes
  * Example: "Our sales process involves X, Y, Z and our support process has A, B, C" = 2 processes
  * Example: "Our inventory management: A, B, C. Our order fulfillment: X, Y, Z. Our quality control: M, N, O" = 3 processes
  * Each process MUST have at least 2 steps
  * Use the "processes" array in data (not single "processName"/"steps")
  * DO NOT ask "which process?" - extract ALL of them immediately
  * High extraction confidence is NOT required when multiple processes are clearly mentioned with steps
- If user is adding to/clarifying/updating an EXISTING process → use refine_process with the intent refine_process
  * Examples: "Actually, add a step for...", "The approval process also includes...", "Let me add more details to that process"
  * You must identify which process to refine using processName matching or targetIds
- If user mentions "opportunities" or "automation" → scan_opportunities
  * IMPORTANT: DO NOT include processId in data OR targetIds - we will scan ALL processes in the session automatically
  * Leave both data empty {} and targetIds empty {} (or omit targetIds entirely) for scan_opportunities action
- If user says "blueprint" or "implementation plan" → generate_blueprint
- If user mentions "governance" or "AI use case" → create_use_case
- If user asks for "summary" → generate_summary
- If user asks for "overview" or "what have we created" or "show me everything" → generate_overview
- If user is vague or incomplete → clarification_needed with low confidence
- For general questions → respond_only

CHOOSING BETWEEN extract_process AND refine_process:
- extract_process: User is describing something completely new, no existing process referenced
- refine_process: User is building on or modifying something already discussed/created in this session
  * Look at existing process names to determine if user is referring to one of them
  * If user says "that process", "the X process", "add to the workflow", etc. → refine_process
  * If confidence is high that this is a refinement, use refine_process even if processName is slightly different

ANSWERING QUESTIONS ABOUT EXISTING PROCESSES:
- When user asks "how many steps?" or "what processes?" → use respond_only and reference the PROCESSES IN THIS SESSION data
- You have full context about process names, step counts, and links in the session state
- Answer questions directly using this information - no need for clarification if the data is available
- Example: "The employee onboarding process has 6 steps" (from session state data)

Return ONLY valid JSON in this exact format:
{
  "intent": "intent_type",
  "actions": ["action1", "action2"],
  "intentConfidence": 0.85,
  "extractionConfidence": 0.90,
  "targetIds": {
    "processId": "optional_if_user_referenced_existing",
    "opportunityId": "optional",
    "blueprintId": "optional"
  },
  "explanation": "Natural language response to the user",
  "data": {
    // FOR SINGLE PROCESS (legacy):
    "processName": "optional",
    "processDescription": "optional",
    "steps": [{"title": "Step 1", "description": "...", "owner": "...", "inputs": [], "outputs": [], "frequency": "...", "duration": "..."}],

    // FOR MULTIPLE PROCESSES (use this when user describes 2+ distinct workflows):
    "processes": [
      {
        "processName": "Employee Onboarding",
        "processDescription": "optional",
        "steps": [{"title": "Step 1", "description": "...", "owner": "...", "inputs": [], "outputs": [], "frequency": "...", "duration": "..."}]
      },
      {
        "processName": "Customer Onboarding",
        "processDescription": "optional",
        "steps": [{"title": "Step 1", "description": "..."}]
      }
    ],

    "useCaseTitle": "optional",
    "useCaseDescription": "optional",

    // FOR SCAN_OPPORTUNITIES: Leave data AND targetIds empty, we scan ALL session processes automatically
    // Example:
    // User: "Scan for opportunities"
    // Response: {
    //   "intent": "opportunity_request",
    //   "actions": ["scan_opportunities"],
    //   "intentConfidence": 0.95,
    //   "extractionConfidence": 0.95,
    //   "explanation": "I'll scan all processes in this session for automation opportunities.",
    //   "targetIds": {},  // MUST be empty - do NOT include processId
    //   "data": {}        // MUST be empty - do NOT include processId
    // }
  }
}`;

  // Build conversation context
  const conversationMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...context.conversationHistory.slice(-25), // Last 25 messages for context (fetched from DB)
    { role: 'user' as const, content: userMessage },
  ];

  // Add context about current session state
  const sessionContext = await buildSessionContext(context);
  if (sessionContext) {
    conversationMessages.splice(1, 0, {
      role: 'system' as const,
      content: sessionContext,
    });
  }

  const result = await chatCompletionWithBilling(
    context.workspaceId,
    'LIGHT_CLARIFICATION',
    {
      model: 'gpt-4o',
      messages: conversationMessages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    }
  );

  if (!result.success) {
    throw result.error;
  }

  const completion = result.data;
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
 * M14: Enhanced with detailed process information for better context awareness
 */
async function buildSessionContext(context: OrchestrationContext): Promise<string> {
  const parts: string[] = ['CURRENT SESSION STATE:'];

  // Fetch detailed process information if available
  if (context.currentMetadata.processIds && context.currentMetadata.processIds.length > 0) {
    try {
      const processes = await db.process.findMany({
        where: {
          id: { in: context.currentMetadata.processIds as string[] },
        },
        include: {
          _count: {
            select: { steps: true, links: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (processes.length > 0) {
        parts.push(`\nPROCESSES IN THIS SESSION:`);
        processes.forEach((proc) => {
          parts.push(
            `- "${proc.name}": ${proc._count.steps} steps, ${proc._count.links} links (ID: ${proc.id})`
          );
        });
      }
    } catch (error) {
      console.error('Error fetching process details for context:', error);
      // Fallback to simple count
      parts.push(`- ${context.currentMetadata.processIds.length} process(es) created`);
    }
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

    case 'generate_overview':
      await handleGenerateOverview(context, result);
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
 * M16: Enhanced to support multi-process extraction from a single message
 */
async function handleExtractProcess(
  decision: OrchestrationDecision,
  context: OrchestrationContext,
  result: OrchestrationResult
): Promise<void> {
  // M16: Check if we have multiple processes or a single process
  const hasMultipleProcesses = decision.data?.processes && decision.data.processes.length > 0;

  if (hasMultipleProcesses) {
    // M16: Handle multiple processes extraction
    const processes = decision.data!.processes!;

    // Validate each process has at least 2 steps
    for (const proc of processes) {
      if (!proc.steps || proc.steps.length < 2) {
        throw new Error(`Process "${proc.processName}" must have at least 2 steps`);
      }
    }

    // Extract each process
    const createdProcesses = [];
    for (const processData of processes) {
      const { process, steps, links } = await extractProcessFromChat({
        processName: processData.processName,
        processDescription: processData.processDescription,
        steps: processData.steps,
        workspaceId: context.workspaceId,
      });

      // Fetch full process data with steps and links for frontend
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

      createdProcesses.push({
        id: process.id,
        name: process.name,
        stepCount: fullProcess?._count?.steps || steps.length,
        steps: fullProcess?.steps || steps,
        links: fullProcess?.links || links,
        createdSteps: steps,
      });

      // Update metadata with new process ID
      result.updatedMetadata.processIds = [
        ...(result.updatedMetadata.processIds || []),
        process.id,
      ];
    }

    // Update result with all created processes
    result.artifacts.createdProcesses = [
      ...(result.artifacts.createdProcesses || []),
      ...createdProcesses.map(p => ({
        id: p.id,
        name: p.name,
        stepCount: p.stepCount,
        steps: p.steps,
        links: p.links,
      })),
    ];

    result.artifacts.createdSteps = [
      ...(result.artifacts.createdSteps || []),
      ...createdProcesses.flatMap(p =>
        p.createdSteps.map((s: any) => ({ id: s.id, title: s.title, processId: p.id }))
      ),
    ];

    // M16: UI hint to scroll to processes section (highlight first one)
    result.ui = {
      scrollTo: 'processes',
      highlightId: createdProcesses[0]?.id,
    };
  } else {
    // Legacy: Handle single process extraction
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
  // Collect all process IDs to scan
  let processIdsToScan: string[] = [];

  console.log('[SCAN DEBUG] decision.data:', JSON.stringify(decision.data, null, 2));
  console.log('[SCAN DEBUG] decision.targetIds:', JSON.stringify(decision.targetIds, null, 2));
  console.log('[SCAN DEBUG] context.currentMetadata.processIds:', context.currentMetadata.processIds);

  // Check if a specific process ID is provided (in either data or targetIds)
  const specificProcessId = decision.data?.processId || decision.targetIds?.processId;

  // If specific process ID provided, use only that one
  if (specificProcessId) {
    console.log('[SCAN DEBUG] Using specific processId:', specificProcessId, 'from', decision.data?.processId ? 'decision.data' : 'decision.targetIds');
    processIdsToScan = [specificProcessId];
  }
  // Otherwise, scan all processes in the session
  else {
    console.log('[SCAN DEBUG] No processId specified, scanning all session processes');
    // Include newly created processes from this orchestration
    if (result.artifacts.createdProcesses && result.artifacts.createdProcesses.length > 0) {
      processIdsToScan.push(...result.artifacts.createdProcesses.map(p => p.id));
    }

    // Include existing processes from context metadata
    if (context.currentMetadata.processIds && context.currentMetadata.processIds.length > 0) {
      const existingIds = context.currentMetadata.processIds as string[];
      // Avoid duplicates
      existingIds.forEach(id => {
        if (!processIdsToScan.includes(id)) {
          processIdsToScan.push(id);
        }
      });
    }
  }

  console.log('[SCAN DEBUG] Process IDs to scan:', processIdsToScan);

  if (processIdsToScan.length === 0) {
    throw new Error('No processes available to scan for opportunities');
  }

  // Scan all processes in parallel
  const allOpportunityIds: string[] = [];
  await Promise.all(
    processIdsToScan.map(async (processId) => {
      const opportunityIds = await scanOpportunities({
        processId,
        workspaceId: context.workspaceId,
      });
      allOpportunityIds.push(...opportunityIds);
    })
  );

  // Fetch opportunity details for result
  const opportunities = await db.opportunity.findMany({
    where: { id: { in: allOpportunityIds } },
    select: { id: true, title: true },
  });

  result.artifacts.createdOpportunities = [
    ...(result.artifacts.createdOpportunities || []),
    ...opportunities.map((o) => ({ id: o.id, title: o.title })),
  ];

  result.updatedMetadata.opportunityIds = [
    ...(result.updatedMetadata.opportunityIds || []),
    ...allOpportunityIds,
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
 * Handle session overview generation
 * Returns structured overview with all artifacts and sets UI to highlight all sections
 */
async function handleGenerateOverview(
  context: OrchestrationContext,
  result: OrchestrationResult
): Promise<void> {
  const overview = await generateSessionOverview({
    sessionId: context.sessionId,
    workspaceId: context.workspaceId,
  });

  // Build formatted response message
  const messageParts: string[] = [overview.overview];

  if (overview.processes.length > 0) {
    messageParts.push('\n### Processes:');
    overview.processes.forEach((p) => {
      messageParts.push(`- **${p.name}**: ${p.stepCount} steps, ${p.linkCount} connections`);
    });
  }

  if (overview.opportunities.length > 0) {
    messageParts.push('\n### AI Opportunities:');
    overview.opportunities.forEach((o) => {
      messageParts.push(
        `- **${o.title}** (${o.impactLevel} impact) - Impact: ${o.impactScore}, Feasibility: ${o.feasibilityScore}`
      );
    });
  }

  if (overview.blueprints.length > 0) {
    messageParts.push('\n### Blueprints:');
    overview.blueprints.forEach((b) => {
      messageParts.push(`- **${b.title}**`);
    });
  }

  if (overview.aiUseCases.length > 0) {
    messageParts.push('\n### AI Governance:');
    overview.aiUseCases.forEach((u) => {
      messageParts.push(`- **${u.title}** (${u.status})`);
    });
  }

  // Update result with formatted message
  result.assistantMessage = messageParts.join('\n');

  // Set UI hint to expand all sections (handled by client)
  result.ui = {
    scrollTo: 'processes', // Scroll to top of workspace
    highlightId: 'all', // Special value to expand all categories
  };
}

/**
 * M14: Check if clarification is needed based on decision confidence
 * M14 Enhanced: Separate intent vs extraction confidence with dynamic thresholds
 */
function shouldRequestClarification(
  decision: OrchestrationDecision,
  context: OrchestrationContext
): { reason: 'low_intent_confidence' | 'low_extraction_confidence' | 'ambiguous_reference' } | null {
  // Intent explicitly says clarification needed
  if (decision.intent === 'clarification_needed') {
    return { reason: 'low_intent_confidence' };
  }

  // Calculate process count for dynamic thresholds
  const processCount = context.currentMetadata.processIds?.length || 0;
  const intentThreshold = CONFIDENCE_THRESHOLDS.getIntentThreshold(processCount);
  const extractionThreshold = CONFIDENCE_THRESHOLDS.getExtractionThreshold(processCount);

  // Actionable intents that require good data
  const actionableIntents = [
    'process_description',
    'refine_process',
    'opportunity_request',
    'blueprint_request',
    'governance_request',
  ];

  if (actionableIntents.includes(decision.intent)) {
    // Get confidence scores (backwards compatible with old 'confidence' field)
    const intentConf = decision.intentConfidence ?? decision.confidence ?? 1.0;
    const extractionConf = decision.extractionConfidence ?? decision.confidence ?? 1.0;

    // HIGH INTENT + LOW EXTRACTION: User clearly wants something but missing data
    // → Trigger clarification to get complete data
    if (intentConf >= intentThreshold && extractionConf < extractionThreshold) {
      return { reason: 'low_extraction_confidence' };
    }

    // LOW INTENT + HIGH EXTRACTION: User provided good data but intent unclear
    // → Favor extraction, proceed with action (no clarification)
    if (intentConf < intentThreshold && extractionConf >= extractionThreshold) {
      // Proceed with extraction - good data trumps ambiguous intent
      return null;
    }

    // LOW INTENT + LOW EXTRACTION: Both are problematic
    // → Trigger clarification
    if (intentConf < intentThreshold && extractionConf < extractionThreshold) {
      return { reason: 'low_intent_confidence' };
    }

    // HIGH INTENT + HIGH EXTRACTION: All good, proceed
    // (implicitly handled by returning null at the end)
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

  // Process extraction with missing critical data (safety check)
  // M16: Support both single process (processName/steps) and multi-process (processes array)
  if (decision.intent === 'process_description') {
    const hasMultiProcess = decision.data?.processes && decision.data.processes.length > 0;
    const hasSingleProcess = decision.data?.processName && decision.data?.steps && decision.data.steps.length >= 2;

    // Must have either multi-process or single-process format
    if (!hasMultiProcess && !hasSingleProcess) {
      return { reason: 'low_extraction_confidence' };
    }
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
      context.workspaceId,
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
