import { eq } from 'drizzle-orm';

import type { UpdateProfileRequest } from '@goal-tracker/contracts';

import type { Database } from './index.js';
import { profiles } from './schema.js';

export interface ProfileRecord {
  id: string;
  displayName: string | null;
  defaultCurrency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileRepository {
  findByOwnerId(ownerId: string): Promise<ProfileRecord | undefined>;
  updateByOwnerId(
    ownerId: string,
    update: UpdateProfileRequest,
  ): Promise<ProfileRecord | undefined>;
}

export function createProfileRepository(db: Database): ProfileRepository {
  return {
    async findByOwnerId(ownerId) {
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, ownerId)).limit(1);

      return profile;
    },

    async updateByOwnerId(ownerId, update) {
      const [profile] = await db
        .update(profiles)
        .set({
          displayName: update.displayName,
          defaultCurrency: update.defaultCurrency,
        })
        .where(eq(profiles.id, ownerId))
        .returning();

      return profile;
    },
  };
}
