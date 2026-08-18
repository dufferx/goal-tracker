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

/** Flatten Zod issues into the stable field-errors envelope. */
export function zodFieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(
      (entry): entry is [string, string[]] => entry[1] !== undefined,
    ),
  );
}
