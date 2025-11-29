/**
 * Frontend API Client
 *
 * Centralized fetch wrapper that:
 * - Handles the standard { ok, data, error } response shape
 * - Throws typed errors for easy error handling
 * - Provides consistent error messages
 */

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiSuccessResponse<T> = {
  ok: true;
  data: T;
};

type ApiErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Typed fetch wrapper for API calls
 *
 * @throws {ApiError} When the API returns an error or the request fails
 */
export async function apiFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(input, init);

    // Handle non-JSON responses (shouldn't happen with our APIs)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new ApiError(
        'INVALID_RESPONSE',
        'Server returned non-JSON response',
        response.status
      );
    }

    const json: ApiResponse<T> = await response.json();

    // Handle API error responses
    if (!json.ok) {
      throw new ApiError(
        json.error.code,
        json.error.message,
        response.status
      );
    }

    // Handle HTTP errors that somehow didn't set ok: false
    if (!response.ok) {
      throw new ApiError(
        'HTTP_ERROR',
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    return json.data;
  } catch (err) {
    // Re-throw ApiErrors as-is
    if (err instanceof ApiError) {
      throw err;
    }

    // Handle network errors
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new ApiError(
        'NETWORK_ERROR',
        'Network error. Please check your connection and try again.'
      );
    }

    // Handle other errors
    throw new ApiError(
      'UNKNOWN_ERROR',
      err instanceof Error ? err.message : 'An unexpected error occurred'
    );
  }
}

/**
 * Helper for displaying error messages to users
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Helper for checking if an error is a specific code
 */
export function isErrorCode(error: unknown, code: string): boolean {
  return error instanceof ApiError && error.code === code;
}
