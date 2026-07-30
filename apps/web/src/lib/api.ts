import {
  apiErrorSchema,
  deploymentCapabilitiesSchema,
  profileSchema,
  type DeploymentCapabilities,
  type Profile,
  type UpdateProfileRequest,
} from '@goal-tracker/contracts';

import type { AuthSession } from './auth';

export interface GoalTrackerApi {
  getCapabilities(): Promise<DeploymentCapabilities>;
  getProfile(session: AuthSession): Promise<Profile>;
  updateProfile(session: AuthSession, input: UpdateProfileRequest): Promise<Profile>;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function responseError(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status})`;
  try {
    const body = apiErrorSchema.safeParse(await response.json());
    return body.success ? body.data.error.message : fallback;
  } catch {
    return fallback;
  }
}

export function createGoalTrackerApi(baseUrl: string): GoalTrackerApi {
  const request = async (path: string, init?: RequestInit) => {
    const response = await fetch(`${baseUrl}${path}`, init);
    if (!response.ok) throw new ApiRequestError(await responseError(response), response.status);
    return (await response.json()) as unknown;
  };

  const authenticatedHeaders = (session: AuthSession) => ({
    Authorization: `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json',
  });

  return {
    async getCapabilities() {
      return deploymentCapabilitiesSchema.parse(await request('/api/v1/capabilities'));
    },
    async getProfile(session) {
      return profileSchema.parse(
        await request('/api/v1/profile', { headers: authenticatedHeaders(session) }),
      );
    },
    async updateProfile(session, input) {
      return profileSchema.parse(
        await request('/api/v1/profile', {
          method: 'PUT',
          headers: authenticatedHeaders(session),
          body: JSON.stringify(input),
        }),
      );
    },
  };
}
