import { NextResponse } from 'next/server';

/**
 * Standard API Response Helpers
 *
 * Provides consistent response shape across all API endpoints:
 * Success: { ok: true, data: { ... } }
 * Error: { ok: false, error: { code: string, message: string } }
 */

export type ApiSuccessResponse<T> = {
  ok: true;
  data: T;
};

export type ApiErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
    suggestedActions?: string[]; // M24.1: For billing errors
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard error codes for consistent frontend handling
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED: 'MISSING_REQUIRED',

  // LLM & External Services
  LLM_FAILED: 'LLM_FAILED',
  BLUEPRINT_LLM_FAILED: 'BLUEPRINT_LLM_FAILED',
  OPPORTUNITY_SCAN_FAILED: 'OPPORTUNITY_SCAN_FAILED',
  TOOL_MATCH_FAILED: 'TOOL_MATCH_FAILED',
  PROCESS_ASSISTANT_FAILED: 'PROCESS_ASSISTANT_FAILED',

  // Billing (M24.1)
  BILLING_LIMIT_REACHED: 'BILLING_LIMIT_REACHED',
  PAYG_CAP_REACHED: 'PAYG_CAP_REACHED',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Create a successful API response
 */
export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    { status: 200, ...init }
  );
}

/**
 * Create an error API response
 */
export function error(
  statusCode: number,
  code: string,
  message: string,
  suggestedActions?: string[],
  init?: ResponseInit
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...(suggestedActions && { suggestedActions }),
      },
    },
    { status: statusCode, ...init }
  );
}

/**
 * Common error responses for convenience
 */
export const CommonErrors = {
  unauthorized: (message = 'You must be logged in to access this resource') =>
    error(401, ErrorCodes.UNAUTHORIZED, message),

  forbidden: (message = 'You do not have permission to access this resource') =>
    error(403, ErrorCodes.FORBIDDEN, message),

  notFound: (resource = 'Resource', message?: string) =>
    error(404, ErrorCodes.NOT_FOUND, message || `${resource} not found`),

  invalidInput: (message = 'Invalid input provided') =>
    error(400, ErrorCodes.INVALID_INPUT, message),

  missingRequired: (field: string) =>
    error(400, ErrorCodes.MISSING_REQUIRED, `Missing required field: ${field}`),

  databaseError: (message = 'A database error occurred') =>
    error(500, ErrorCodes.DATABASE_ERROR, message),

  llmFailed: (message = 'AI processing failed. Please try again.') =>
    error(500, ErrorCodes.LLM_FAILED, message),

  internalError: (message = 'An unexpected error occurred') =>
    error(500, ErrorCodes.INTERNAL_ERROR, message),

  // M24.1: Billing error helpers
  billingLimitReached: (message: string, suggestedActions: string[]) =>
    error(429, ErrorCodes.BILLING_LIMIT_REACHED, message, suggestedActions),

  paygCapReached: (message: string, suggestedActions: string[]) =>
    error(429, ErrorCodes.PAYG_CAP_REACHED, message, suggestedActions),
};
