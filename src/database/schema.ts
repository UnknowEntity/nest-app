import * as p from 'drizzle-orm/pg-core';
import { casbinRulePostgres } from 'drizzle-adapter';
import { sql } from 'drizzle-orm';

const metaColumn = {
  createdAt: p.timestamp('created_at').defaultNow(),
  updatedAt: p
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
};

export const seed_metadata = p.pgTable('seed_metadata', {
  id: p.serial().primaryKey(),
  name: p.text().notNull().unique(),
  executedAt: p.timestamp('executed_at').defaultNow(),
});

export const roles = p.pgTable('roles', {
  id: p.varchar('id', { length: 255 }).primaryKey(),
  name: p.text().notNull(),
  description: p.text().notNull(),
  ...metaColumn,
});

export const users = p.pgTable('users', {
  id: p.serial().primaryKey(),
  name: p.text().notNull(),
  email: p.text().unique().notNull(),
  password: p.text().notNull(),
  role: p
    .varchar('role', { length: 255 })
    .notNull()
    .references(() => roles.id),
  lockoutUntil: p.integer('lockout_until'),
  signInAttempts: p.integer('sign_in_attempts').default(0),
  ...metaColumn,
});

// Reexport casbinRulePostgres as casbinTable to create migration for it
export const casbinTable = casbinRulePostgres;

export const refreshTokens = p.pgTable(
  'refresh_tokens',
  {
    id: p.serial().primaryKey(),
    userId: p
      .integer('user_id')
      .notNull()
      .references(() => users.id),
    token: p.text().notNull(),
    familyId: p.uuid('family_id').notNull(),
    // Store as UNIX timestamp (in seconds) for easier comparison in queries
    maxExpiresAt: p.integer('max_expires_at').notNull(),
    ...metaColumn,
  },
  (table) => {
    return {
      userIdFamilyIdIdx: p
        .index('user_id_family_id_idx')
        .on(table.userId, table.familyId, sql`${table.createdAt} DESC`),
    };
  },
);

export const passwordResetTokens = p.pgTable('password_reset_tokens', {
  id: p.serial().primaryKey(),
  userId: p
    .integer('user_id')
    .notNull()
    .references(() => users.id),
  hashToken: p.text().notNull(),
  expiresAt: p.integer('expires_at').notNull(),
  usedAt: p.integer('used_at'),
  ...metaColumn,
});

export type SelectUser = typeof users.$inferSelect;
export type RequestUser = Omit<
  SelectUser,
  'password' | 'lockoutUntil' | 'signInAttempts'
>;
export type SelectRefreshToken = typeof refreshTokens.$inferSelect;
export type RequestRefreshToken = Omit<SelectRefreshToken, 'token'>;
