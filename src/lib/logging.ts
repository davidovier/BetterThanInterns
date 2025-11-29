/**
 * Logging Helpers
 *
 * Centralized logging for errors, LLM calls, and debugging.
 * Future: Can be extended to integrate with Sentry, LogRocket, etc.
 */

export type LlmLogEntry = {
  function: string;
  model: string;
  context: {
    projectId?: string;
    processId?: string;
    opportunityId?: string;
    sessionId?: string;
    [key: string]: string | undefined;
  };
  error?: unknown;
  timestamp: Date;
};

/**
 * Log an LLM error for debugging and monitoring
 */
export function logLlmError(entry: LlmLogEntry): void {
  const logData = {
    type: 'LLM_ERROR',
    function: entry.function,
    model: entry.model,
    context: entry.context,
    error: entry.error instanceof Error ? entry.error.message : String(entry.error),
    timestamp: entry.timestamp.toISOString(),
  };

  // For now, log to console
  // Future: Send to external logging service
  console.error('[LLM Error]', JSON.stringify(logData, null, 2));

  // Future integrations:
  // - Sentry.captureException(entry.error, { contexts: { llm: logData } });
  // - sendToDatadog(logData);
  // - etc.
}

/**
 * Log successful LLM calls (optional, for analytics)
 */
export function logLlmSuccess(entry: Omit<LlmLogEntry, 'error'>): void {
  const logData = {
    type: 'LLM_SUCCESS',
    function: entry.function,
    model: entry.model,
    context: entry.context,
    timestamp: entry.timestamp.toISOString(),
  };

  // Only log in development for now
  if (process.env.NODE_ENV === 'development') {
    console.log('[LLM Success]', JSON.stringify(logData, null, 2));
  }
}

/**
 * General error logger
 */
export function logError(
  context: string,
  error: unknown,
  additionalData?: Record<string, unknown>
): void {
  const logData = {
    type: 'ERROR',
    context,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    additionalData,
    timestamp: new Date().toISOString(),
  };

  console.error(`[Error: ${context}]`, JSON.stringify(logData, null, 2));

  // Future: Send to error tracking service
}

/**
 * Log API request/response for debugging
 */
export function logApiCall(
  method: string,
  path: string,
  status: number,
  duration?: number
): void {
  const logData = {
    type: 'API_CALL',
    method,
    path,
    status,
    duration,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[API Call]', JSON.stringify(logData, null, 2));
  }
}
