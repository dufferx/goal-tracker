import type { ApiError } from '@goal-tracker/contracts';

export function apiError(
  requestId: string,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
): ApiError {
  return {
    error: {
      code,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
      requestId,
    },
  };
}
