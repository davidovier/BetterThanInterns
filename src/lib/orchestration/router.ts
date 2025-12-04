/**
 * Orchestration Router
 *
 * Main orchestration engine that analyzes user messages and routes to appropriate actions.
 */

import { openai } from '@/lib/llm';
import { db } from '@/lib/db';
import {
  OrchestrationContext,
  OrchestrationResult,
  OrchestrationDecision,
} from './types';
import { extractProcessFromChat } from './actions/process-from-chat';
import { scanOpportunities } from './actions/opportunity-scan';
import { generateBlueprint } from './actions/generate-blueprint';
import { createAiUseCase } from './actions/governance-flow';
import { generateSessionSummary } from './actions/session-summary';

/**
 * Main orchestration function
 */
export async function orchestrate(
  context: OrchestrationContext,
  userMessage: string
): Promise<OrchestrationResult> {
  try {
    // Step 1: Get orchestration decision from LLM
    const decision = await getOrchestrationDecision(context, userMessage);

    // Step 2: Initialize result tracking
    const result: OrchestrationResult = {
      success: true,
      assistantMessage: decision.explanation,
      artifacts: {},
      updatedMetadata: { ...context.currentMetadata },
    };

    // Step 3: Execute actions based on decision
    for (const action of decision.actions) {
      try {
        await executeAction(action, decision, context, result);
      } catch (error) {
        console.error(`Error executing action ${action}:`, error);
        // Continue with other actions even if one fails
      }
    }

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
 */
async function getOrchestrationDecision(
  context: OrchestrationContext,
  userMessage: string
): Promise<OrchestrationDecision> {
  const systemPrompt = `You are an intelligent orchestration engine for a business process automation platform.

Your role is to:
1. Classify user intent
2. Determine which actions to take
3. Extract structured data from the conversation
4. Provide a natural language response

INTENTS:
- process_description: User is describing a business process with steps
- process_update: User wants to modify an existing process
- opportunity_request: User asks to scan for automation opportunities
- blueprint_request: User wants to generate an implementation blueprint
- governance_request: User wants to register an AI use case for governance
- session_summary_request: User asks for a summary of the session
- general_question: User is asking questions or having a general conversation

ACTIONS:
- extract_process: Extract and create a new process with steps
- scan_opportunities: Analyze process steps for automation opportunities
- generate_blueprint: Create an implementation blueprint for a project
- create_use_case: Register an AI use case for governance tracking
- generate_summary: Generate a session summary
- respond_only: Just provide a conversational response

GUIDELINES:
- If user describes a multi-step process, extract it (use extract_process)
- If user mentions "opportunities" or "automation", scan for opportunities
- If user says "blueprint" or "implementation plan", generate blueprint
- If user mentions "governance" or "AI use case", create use case
- If user asks for "summary", generate summary
- For general questions, use respond_only

Return ONLY valid JSON in this exact format:
{
  "intent": "intent_type",
  "actions": ["action1", "action2"],
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

  if (context.currentMetadata.projectId) {
    parts.push(`- Linked to Project ID: ${context.currentMetadata.projectId}`);
  }

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
 */
async function handleExtractProcess(
  decision: OrchestrationDecision,
  context: OrchestrationContext,
  result: OrchestrationResult
): Promise<void> {
  if (!decision.data?.processName || !decision.data?.steps) {
    throw new Error('Missing process data');
  }

  const { process, steps } = await extractProcessFromChat({
    processName: decision.data.processName,
    processDescription: decision.data.processDescription,
    steps: decision.data.steps,
    projectId: context.currentMetadata.projectId,
    workspaceId: context.workspaceId,
  });

  // Update result
  result.artifacts.createdProcesses = [
    ...(result.artifacts.createdProcesses || []),
    { id: process.id, name: process.name },
  ];

  result.artifacts.createdSteps = [
    ...(result.artifacts.createdSteps || []),
    ...steps.map((s) => ({ id: s.id, title: s.title, processId: process.id })),
  ];

  // Update metadata
  if (!result.updatedMetadata.projectId) {
    result.updatedMetadata.projectId = process.projectId;
  }

  result.updatedMetadata.processIds = [
    ...(result.updatedMetadata.processIds || []),
    process.id,
  ];
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
  // Determine which project to generate blueprint for
  let projectId = decision.data?.projectId || result.updatedMetadata.projectId;

  if (!projectId) {
    throw new Error('No project available to generate blueprint');
  }

  const blueprintId = await generateBlueprint({
    projectId,
    workspaceId: context.workspaceId,
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

  let projectId = result.updatedMetadata.projectId;

  if (!projectId) {
    throw new Error('No project available to create use case');
  }

  const { useCaseId } = await createAiUseCase(
    {
      workspaceId: context.workspaceId,
      projectId,
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
