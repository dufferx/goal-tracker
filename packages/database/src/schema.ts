import { sql } from 'drizzle-orm';
import { char, check, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
