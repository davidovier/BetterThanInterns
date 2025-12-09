/**
 * M14 Session Intelligence Helpers
 *
 * Utilities for context-aware orchestration, clarification, and next-step suggestions.
 */

import { openai } from '@/lib/llm';
import { db } from '@/lib/db';
import type {
  NextStepSuggestion,
  ClarificationRequest,
  OrchestrationContext,
} from './types';

/**
 * Confidence thresholds for M14 orchestration
 * Separate thresholds for intent classification vs data extraction
 */
export const CONFIDENCE_THRESHOLDS = {
  // Intent confidence: How sure are we about what the user wants to do?
  INTENT_MIN: 0.6, // Lower threshold - favor action over clarification

  // Extraction confidence: How complete is the extracted data?
  EXTRACTION_MIN: 0.7, // Higher threshold - need good data to execute

  // Dynamic adjustment based on session complexity
  getIntentThreshold: (processCount: number): number => {
    // When >5 processes exist, harder to disambiguate, require higher confidence
    if (processCount > 5) return 0.7;
    if (processCount > 3) return 0.65;
    return 0.6; // Default for simple sessions
  },

  getExtractionThreshold: (processCount: number): number => {
    // Extraction requirements stay consistent regardless of complexity
    return 0.7;
  },
};

/**
 * @deprecated Use CONFIDENCE_THRESHOLDS instead
 */
export const CONFIDENCE_MIN_FOR_ACTION = CONFIDENCE_THRESHOLDS.INTENT_MIN;

/**
 * Compute next step suggestion based on session state (heuristic, no LLM)
 * M14: Provides proactive guidance based on what exists in the session
 * M15.1: Enhanced to check if processes have actual steps before suggesting opportunities
 */
export function computeNextStepSuggestion(sessionContext: {
  processCount: number;
  totalStepCount?: number; // M15.1: Added to check if processes have steps
  opportunityCount: number;
  blueprintCount: number;
  aiUseCaseCount: number;
}): NextStepSuggestion | null {
  const { processCount, totalStepCount, opportunityCount, blueprintCount, aiUseCaseCount } = sessionContext;

  if (processCount === 0) {
    return {
      label: "Describe one messy process and I'll map it for you.",
      actionType: 'describe_process',
    };
  }

  // M15.1: Check if process exists but has no steps
  if (processCount > 0 && (totalStepCount === undefined || totalStepCount === 0)) {
    return {
      label: "Want me to extract the steps from this process?",
      actionType: 'extract_steps',
    };
  }

  // M15.1: Only suggest scanning opportunities if process has steps
  if (processCount > 0 && totalStepCount && totalStepCount > 0 && opportunityCount === 0) {
    return {
      label: "We can scan your mapped processes for AI opportunities next.",
      actionType: 'scan_opportunities',
    };
  }

  if (opportunityCount > 0 && blueprintCount === 0) {
    return {
      label: "Based on these opportunities, I can generate a blueprint implementation plan.",
      actionType: 'generate_blueprint',
    };
  }

  if (blueprintCount > 0 && aiUseCaseCount === 0) {
    return {
      label: "We can register this as an AI use case and start governance tracking.",
      actionType: 'create_governance',
    };
  }

  // All major steps complete, no suggestion
  return null;
}

/**
 * Generate a clarification question using LLM
 * M14: Called when confidence is low or extraction is incomplete
 */
export async function generateClarificationQuestion(
  userMessage: string,
  sessionContext: string,
  reason: 'low_intent_confidence' | 'low_extraction_confidence' | 'ambiguous_reference'
): Promise<string> {
  const systemPrompt = `You are a helpful AI assistant who asks clarifying questions when you need more information.

Your role:
- User said something ambiguous or incomplete
- Generate a single, focused follow-up question to clarify
- Keep it conversational and helpful
- Reference what they said and what you need to know

Reason for clarification: ${reason}

Session context:
${sessionContext || 'No prior context'}

Examples of good clarification questions:
- "You mentioned an invoice process. Can you outline the key steps from start to finish?"
- "When you say 'that approval step', do you mean manager approval before payment, or something else?"
- "I want to help map this process. What happens first?"
- "Which process would you like me to scan for opportunities? We have 'Invoice Approval' and 'Customer Onboarding' in this session."

Generate a single clarification question (max 2 sentences):`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 150,
  });

  const question = completion.choices[0]?.message?.content?.trim();

  if (!question) {
    // Fallback if LLM fails
    return "Could you provide more details about what you'd like to do?";
  }

  return question;
}

/**
 * Fetch artifact names from session metadata for context-aware classification
 * M14: Provides LLM with actual artifact names to identify references
 */
export async function fetchArtifactNamesForContext(
  workspaceId: string,
  metadata: {
    processIds?: string[];
    opportunityIds?: string[];
    blueprintIds?: string[];
    aiUseCaseIds?: string[];
  }
): Promise<{
  processes: Array<{ id: string; name: string }>;
  opportunities: Array<{ id: string; title: string }>;
  blueprints: Array<{ id: string; title: string }>;
  aiUseCases: Array<{ id: string; title: string }>;
}> {
  const result = {
    processes: [] as Array<{ id: string; name: string }>,
    opportunities: [] as Array<{ id: string; title: string }>,
    blueprints: [] as Array<{ id: string; title: string }>,
    aiUseCases: [] as Array<{ id: string; title: string }>,
  };

  // Fetch process names
  if (metadata.processIds && metadata.processIds.length > 0) {
    const processes = await db.process.findMany({
      where: {
        id: { in: metadata.processIds },
      },
      select: { id: true, name: true },
    });
    result.processes = processes;
  }

  // Fetch opportunity titles
  if (metadata.opportunityIds && metadata.opportunityIds.length > 0) {
    const opportunities = await db.opportunity.findMany({
      where: {
        id: { in: metadata.opportunityIds },
      },
      select: { id: true, title: true },
    });
    result.opportunities = opportunities;
  }

  // Fetch blueprint titles
  if (metadata.blueprintIds && metadata.blueprintIds.length > 0) {
    const blueprints = await db.blueprint.findMany({
      where: {
        id: { in: metadata.blueprintIds },
      },
      select: { id: true, title: true },
    });
    result.blueprints = blueprints;
  }

  // Fetch AI use case titles
  if (metadata.aiUseCaseIds && metadata.aiUseCaseIds.length > 0) {
    const aiUseCases = await db.aiUseCase.findMany({
      where: {
        id: { in: metadata.aiUseCaseIds },
      },
      select: { id: true, title: true },
    });
    result.aiUseCases = aiUseCases;
  }

  return result;
}

/**
 * Auto-generate session title based on first messages and created processes
 * M14: Replaces generic "New session" with descriptive titles
 */
export async function maybeUpdateSessionTitle(
  sessionId: string,
  sessionTitle: string,
  firstUserMessages: string[],
  processNames: string[]
): Promise<string | null> {
  // Only update if title is generic/placeholder
  const isGenericTitle =
    !sessionTitle ||
    sessionTitle.toLowerCase().includes('new session') ||
    sessionTitle.toLowerCase().includes('untitled') ||
    sessionTitle.trim() === '';

  if (!isGenericTitle) {
    return null; // Already has a good title
  }

  // Need at least some content to generate title
  if (firstUserMessages.length === 0 && processNames.length === 0) {
    return null;
  }

  // Build context for title generation
  const contextParts: string[] = [];

  if (firstUserMessages.length > 0) {
    const messageContext = firstUserMessages.slice(0, 3).join(' ');
    contextParts.push(`User messages: "${messageContext.slice(0, 300)}"`);
  }

  if (processNames.length > 0) {
    contextParts.push(`Processes created: ${processNames.slice(0, 2).join(', ')}`);
  }

  const context = contextParts.join('\n');

  const systemPrompt = `You create short, descriptive titles (max 60 characters) for consulting sessions about business processes and automation.

The title should be specific to the process or domain discussed.

Examples of good titles:
- "Invoice Approval in Finance"
- "Customer Support Triage Workflow"
- "HR Onboarding Automations"
- "Order Fulfillment Process Mapping"
- "IT Service Desk Ticket Routing"

Respond with ONLY valid JSON in this format:
{ "title": "Your Title Here" }`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 100,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return null;
    }

    const parsed = JSON.parse(responseText);
    const newTitle = parsed.title;

    // Validate title
    if (!newTitle || newTitle.length === 0 || newTitle.length > 80) {
      return null;
    }

    // Update session in database
    await db.assistantSession.update({
      where: { id: sessionId },
      data: { title: newTitle },
    });

    return newTitle;
  } catch (error) {
    console.error('Failed to generate session title:', error);
    return null;
  }
}
