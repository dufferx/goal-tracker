import {
  apiErrorSchema,
  convertPercentResponseSchema,
  deploymentCapabilitiesSchema,
  goalDetailSchema,
  goalItemSchema,
  goalListSchema,
  planningPreviewResponseSchema,
  profileSchema,
  type ConvertPercentRequest,
  type CreateGoalItemRequest,
  type CreateGoalRequest,
  type DeleteGoalRequest,
  type DeploymentCapabilities,
  type GoalDetail,
  type GoalItem,
  type GoalList,
  type PlanningPreviewRequest,
  type PlanningPreviewResponse,
  type Profile,
  type ReorderGoalItemsRequest,
  type UpdateGoalItemRequest,
  type UpdateGoalRequest,
  type UpdateProfileRequest,
} from '@goal-tracker/contracts';

import type { AuthSession } from './auth';

export interface GoalTrackerApi {
  getCapabilities(): Promise<DeploymentCapabilities>;
  getProfile(session: AuthSession): Promise<Profile>;
  updateProfile(session: AuthSession, input: UpdateProfileRequest): Promise<Profile>;
  listGoals(session: AuthSession): Promise<GoalList>;
  getGoal(session: AuthSession, goalId: string): Promise<GoalDetail>;
  createGoal(session: AuthSession, input: CreateGoalRequest): Promise<GoalDetail>;
  updateGoal(session: AuthSession, goalId: string, input: UpdateGoalRequest): Promise<GoalDetail>;
  previewPlanning(
    session: AuthSession,
    goalId: string,
    input: PlanningPreviewRequest,
  ): Promise<PlanningPreviewResponse>;
  archiveGoal(session: AuthSession, goalId: string): Promise<GoalDetail>;
  restoreGoal(session: AuthSession, goalId: string): Promise<GoalDetail>;
  deleteGoal(session: AuthSession, goalId: string, input: DeleteGoalRequest): Promise<void>;
  createItem(
    session: AuthSession,
    goalId: string,
    input: CreateGoalItemRequest,
  ): Promise<GoalDetail>;
  updateItem(
    session: AuthSession,
    goalId: string,
    itemId: string,
    input: UpdateGoalItemRequest,
  ): Promise<GoalDetail>;
  deleteItem(session: AuthSession, goalId: string, itemId: string): Promise<GoalDetail>;
  reorderItems(
    session: AuthSession,
    goalId: string,
    input: ReorderGoalItemsRequest,
  ): Promise<GoalItem[]>;
  convertPercent(
    session: AuthSession,
    input: ConvertPercentRequest,
  ): Promise<{ expectedPrice: string }>;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function responseError(response: Response): Promise<ApiRequestError> {
  const fallback = `Request failed (${response.status})`;
  try {
    const body = apiErrorSchema.safeParse(await response.json());
    if (!body.success) {
      return new ApiRequestError(fallback, response.status);
    }
    return new ApiRequestError(
      body.data.error.message,
      response.status,
      body.data.error.code,
      body.data.error.fieldErrors,
    );
  } catch {
    return new ApiRequestError(fallback, response.status);
  }
}

export function createGoalTrackerApi(baseUrl: string): GoalTrackerApi {
  const request = async (path: string, init?: RequestInit) => {
    const response = await fetch(`${baseUrl}${path}`, init);
    if (!response.ok) throw await responseError(response);
    if (response.status === 204) return undefined;
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
    async listGoals(session) {
      return goalListSchema.parse(
        await request('/api/v1/goals', { headers: authenticatedHeaders(session) }),
      );
    },
    async getGoal(session, goalId) {
      return goalDetailSchema.parse(
        await request(`/api/v1/goals/${goalId}`, { headers: authenticatedHeaders(session) }),
      );
    },
    async createGoal(session, input) {
      return goalDetailSchema.parse(
        await request('/api/v1/goals', {
          method: 'POST',
          headers: authenticatedHeaders(session),
          body: JSON.stringify(input),
        }),
      );
    },
    async updateGoal(session, goalId, input) {
      return goalDetailSchema.parse(
        await request(`/api/v1/goals/${goalId}`, {
          method: 'PATCH',
          headers: authenticatedHeaders(session),
          body: JSON.stringify(input),
        }),
      );
    },
    async previewPlanning(session, goalId, input) {
      return planningPreviewResponseSchema.parse(
        await request(`/api/v1/goals/${goalId}/planning-preview`, {
          method: 'POST',
          headers: authenticatedHeaders(session),
          body: JSON.stringify(input),
        }),
      );
    },
    async archiveGoal(session, goalId) {
      return goalDetailSchema.parse(
        await request(`/api/v1/goals/${goalId}/archive`, {
          method: 'POST',
          headers: authenticatedHeaders(session),
        }),
      );
    },
    async restoreGoal(session, goalId) {
      return goalDetailSchema.parse(
        await request(`/api/v1/goals/${goalId}/restore`, {
          method: 'POST',
          headers: authenticatedHeaders(session),
        }),
      );
    },
    async deleteGoal(session, goalId, input) {
      await request(`/api/v1/goals/${goalId}`, {
        method: 'DELETE',
        headers: authenticatedHeaders(session),
        body: JSON.stringify(input),
      });
    },
    async createItem(session, goalId, input) {
      return goalDetailSchema.parse(
        await request(`/api/v1/goals/${goalId}/items`, {
          method: 'POST',
          headers: authenticatedHeaders(session),
          body: JSON.stringify(input),
        }),
      );
    },
    async updateItem(session, goalId, itemId, input) {
      return goalDetailSchema.parse(
        await request(`/api/v1/goals/${goalId}/items/${itemId}`, {
          method: 'PATCH',
          headers: authenticatedHeaders(session),
          body: JSON.stringify(input),
        }),
      );
    },
    async deleteItem(session, goalId, itemId) {
      return goalDetailSchema.parse(
        await request(`/api/v1/goals/${goalId}/items/${itemId}`, {
          method: 'DELETE',
          headers: authenticatedHeaders(session),
        }),
      );
    },
    async reorderItems(session, goalId, input) {
      const body = await request(`/api/v1/goals/${goalId}/items/order`, {
        method: 'PUT',
        headers: authenticatedHeaders(session),
        body: JSON.stringify(input),
      });
      return goalItemSchema.array().parse(body);
    },
    async convertPercent(session, input) {
      return convertPercentResponseSchema.parse(
        await request('/api/v1/money/convert-percent', {
          method: 'POST',
          headers: authenticatedHeaders(session),
          body: JSON.stringify(input),
        }),
      );
    },
  };
}
