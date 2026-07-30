import { sql } from 'drizzle-orm';
import {
  bigint,
  char,
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const goalTargetModeEnum = pgEnum('goal_target_mode', ['fixed', 'items']);
export const goalStatusEnum = pgEnum('goal_status', ['active', 'archived']);

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    displayName: text('display_name'),
    defaultCurrency: char('default_currency', { length: 3 }).notNull().default('USD'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'profiles_display_name_trimmed_bounded_check',
      sql`${table.displayName} is null or (${table.displayName} = btrim(${table.displayName}) and char_length(${table.displayName}) between 1 and 100)`,
    ),
    check('profiles_default_currency_format_check', sql`${table.defaultCurrency} ~ '^[A-Z]{3}$'`),
  ],
);

export const goals = pgTable(
  'goals',
  {
    id: uuid('id').primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    currency: char('currency', { length: 3 }).notNull(),
    targetMode: goalTargetModeEnum('target_mode').notNull(),
    fixedTargetMinor: bigint('fixed_target_minor', { mode: 'bigint' }),
    startMonth: date('start_month', { mode: 'string' }).notNull(),
    finalMonth: date('final_month', { mode: 'string' }),
    contributionsPerMonth: smallint('contributions_per_month').notNull(),
    preferredContributionMinor: bigint('preferred_contribution_minor', { mode: 'bigint' }),
    status: goalStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'goals_name_trimmed_bounded_check',
      sql`${table.name} = btrim(${table.name}) and char_length(${table.name}) between 1 and 120`,
    ),
    check(
      'goals_description_trimmed_bounded_check',
      sql`${table.description} is null or (${table.description} = btrim(${table.description}) and char_length(${table.description}) between 1 and 2000)`,
    ),
    check('goals_currency_format_check', sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check(
      'goals_fixed_target_mode_check',
      sql`(${table.targetMode} = 'fixed' and ${table.fixedTargetMinor} is not null and ${table.fixedTargetMinor} > 0) or (${table.targetMode} = 'items' and ${table.fixedTargetMinor} is null)`,
    ),
    check('goals_contributions_per_month_check', sql`${table.contributionsPerMonth} in (1, 2)`),
    check(
      'goals_preferred_contribution_positive_check',
      sql`${table.preferredContributionMinor} is null or ${table.preferredContributionMinor} > 0`,
    ),
  ],
);

export const goalItems = pgTable(
  'goal_items',
  {
    id: uuid('id').primaryKey(),
    ownerId: uuid('owner_id').notNull(),
    goalId: uuid('goal_id').notNull(),
    name: text('name').notNull(),
    expectedPriceMinor: bigint('expected_price_minor', { mode: 'bigint' }).notNull(),
    dueMonth: date('due_month', { mode: 'string' }),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'goal_items_name_trimmed_bounded_check',
      sql`${table.name} = btrim(${table.name}) and char_length(${table.name}) between 1 and 120`,
    ),
    check('goal_items_expected_price_positive_check', sql`${table.expectedPriceMinor} > 0`),
    check('goal_items_position_nonnegative_check', sql`${table.position} >= 0`),
  ],
);
