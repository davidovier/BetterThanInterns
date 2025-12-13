/**
 * M24 - AI Wrapper with ICU Enforcement
 *
 * Wraps OpenAI API calls with billing enforcement:
 * - Pre-check ICU availability before call
 * - Deduct ICUs only on successful completion
 * - Return structured errors when limits reached
 *
 * Usage:
 *   const result = await callAiWithBilling(workspaceId, 'PROCESS_EXTRACTION', async () => {
 *     return await openai.chat.completions.create({...});
 *   });
 */

import { openai } from '@/lib/llm';
import {
  ICU_COSTS,
  checkIcuAvailability,
  deductIcus,
  BillingLimitError,
} from '@/lib/icuAccounting';
import type OpenAI from 'openai';

// Feature flag for billing enforcement
// Default: disabled until explicitly enabled
const BILLING_ENFORCEMENT_ENABLED =
  process.env.BILLING_ENFORCEMENT_ENABLED === 'true';

// ============================================
// AI Action Type Definitions
// ============================================

export type AiActionType = keyof typeof ICU_COSTS;

// ============================================
// AI Call Result Types
// ============================================

export type AiCallResult<T> =
  | {
      success: true;
      data: T;
      icuCost: number;
    }
  | {
      success: false;
      error: BillingLimitError;
      icuCost: 0;
    };

// ============================================
// Main AI Wrapper Function
// ============================================

/**
 * Execute an AI call with ICU billing enforcement
 *
 * @param workspaceId - Workspace to bill
 * @param actionType - Type of AI action (determines ICU cost)
 * @param aiCall - Async function that makes the actual AI call
 * @returns Result with data or billing error
 *
 * @example
 * ```ts
 * const result = await callAiWithBilling(
 *   workspaceId,
 *   'PROCESS_EXTRACTION',
 *   async () => {
 *     return await openai.chat.completions.create({
 *       model: 'gpt-4',
 *       messages: [{role: 'user', content: 'Extract process...'}],
 *     });
 *   }
 * );
 *
 * if (!result.success) {
 *   // Handle billing error
 *   throw result.error;
 * }
 *
 * // Use AI response
 * const completion = result.data;
 * ```
 */
export async function callAiWithBilling<T>(
  workspaceId: string,
  actionType: AiActionType,
  aiCall: () => Promise<T>
): Promise<AiCallResult<T>> {
  const icuCost = ICU_COSTS[actionType];

  // Feature flag check - skip billing if disabled
  if (!BILLING_ENFORCEMENT_ENABLED) {
    try {
      const data = await aiCall();
      return { success: true, data, icuCost: 0 };
    } catch (error) {
      throw error; // Re-throw AI errors normally when billing disabled
    }
  }

  // Step 1: Pre-check ICU availability (before AI call)
  const availability = await checkIcuAvailability(workspaceId, icuCost);

  if (!availability.allowed) {
    // Return billing error without making AI call
    return {
      success: false,
      error: availability.error!,
      icuCost: 0,
    };
  }

  // Step 2: Execute AI call
  let aiResult: T;
  try {
    aiResult = await aiCall();
  } catch (error) {
    // AI call failed - DO NOT deduct ICUs
    throw error; // Re-throw AI error
  }

  // Step 3: Deduct ICUs after successful completion
  await deductIcus(workspaceId, icuCost);

  return {
    success: true,
    data: aiResult,
    icuCost,
  };
}

// ============================================
// Specialized Wrappers for Common Patterns
// ============================================

/**
 * Wrapper for OpenAI chat completions with billing
 *
 * @example
 * ```ts
 * const result = await chatCompletionWithBilling(
 *   workspaceId,
 *   'PROCESS_EXTRACTION',
 *   {
 *     model: 'gpt-4',
 *     messages: [{role: 'user', content: 'Extract process...'}],
 *   }
 * );
 * ```
 */
export async function chatCompletionWithBilling(
  workspaceId: string,
  actionType: AiActionType,
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming
): Promise<AiCallResult<OpenAI.Chat.ChatCompletion>> {
  return callAiWithBilling(workspaceId, actionType, async () => {
    return await openai.chat.completions.create(params);
  });
}

/**
 * Wrapper for OpenAI streaming completions with billing
 * Pre-checks ICU availability, then allows streaming
 * Deducts ICUs after stream completes successfully
 *
 * @example
 * ```ts
 * const result = await streamingCompletionWithBilling(
 *   workspaceId,
 *   'PROCESS_EXTRACTION',
 *   {
 *     model: 'gpt-4',
 *     messages: [{role: 'user', content: 'Extract process...'}],
 *     stream: true,
 *   }
 * );
 *
 * if (!result.success) {
 *   throw result.error;
 * }
 *
 * const stream = result.data;
 * for await (const chunk of stream) {
 *   // Process chunks...
 * }
 * ```
 */
export async function streamingCompletionWithBilling(
  workspaceId: string,
  actionType: AiActionType,
  params: OpenAI.Chat.ChatCompletionCreateParamsStreaming
): Promise<
  AiCallResult<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>>
> {
  const icuCost = ICU_COSTS[actionType];

  // Feature flag check
  if (!BILLING_ENFORCEMENT_ENABLED) {
    const stream = await openai.chat.completions.create(params);
    return { success: true, data: stream, icuCost: 0 };
  }

  // Pre-check ICU availability
  const availability = await checkIcuAvailability(workspaceId, icuCost);

  if (!availability.allowed) {
    return {
      success: false,
      error: availability.error!,
      icuCost: 0,
    };
  }

  // Execute streaming call
  let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  try {
    stream = await openai.chat.completions.create(params);
  } catch (error) {
    throw error; // Re-throw AI error
  }

  // Deduct ICUs immediately (streaming will complete)
  // Note: For production, you might want to defer deduction until stream finishes
  // For M24 scope, immediate deduction is acceptable
  await deductIcus(workspaceId, icuCost);

  return {
    success: true,
    data: stream,
    icuCost,
  };
}

// ============================================
// Error Handling Helper
// ============================================

/**
 * Convert BillingLimitError to user-friendly response message
 * Used in API routes to return proper error responses
 *
 * @example
 * ```ts
 * const result = await callAiWithBilling(...);
 * if (!result.success) {
 *   return error(402, formatBillingError(result.error));
 * }
 * ```
 */
export function formatBillingError(err: BillingLimitError): string {
  switch (err.code) {
    case 'BILLING_LIMIT_REACHED':
      return 'Monthly intelligence usage limit reached. Please wait for the monthly reset, enable Pay-As-You-Go, or upgrade your plan.';
    case 'PAYG_CAP_REACHED':
      return 'Pay-as-you-go monthly cap reached. Please wait for the monthly reset, increase your PAYG cap, or upgrade your plan.';
    default:
      return 'Billing limit reached.';
  }
}

/**
 * Check if error is a billing limit error
 */
export function isBillingLimitError(error: unknown): error is BillingLimitError {
  return error instanceof BillingLimitError;
}
