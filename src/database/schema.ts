import * as p from 'drizzle-orm/pg-core';

export const users = p.pgTable('users', {
  id: p.serial().primaryKey(),
  name: p.text().notNull(),
  email: p.text().unique().notNull(),
  password: p.text().notNull(),
  createdAt: p.timestamp('created_at').defaultNow(),
  updatedAt: p
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
});

export const refreshTokens = p.pgTable('refresh_tokens', {
  id: p.serial().primaryKey(),
  userId: p
    .integer('user_id')
    .notNull()
    .references(() => users.id),
  token: p.text().notNull(),
  familyId: p.text().notNull(),
  // Store as UNIX timestamp (in seconds) for easier comparison in queries
  maxExpiresAt: p.integer('max_expires_at').notNull(),
  createdAt: p.timestamp('created_at').defaultNow(),
  updatedAt: p
    .timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
});

export type SelectUser = typeof users.$inferSelect;
export type RequestUser = Omit<SelectUser, 'password'>;
export type SelectRefreshToken = typeof refreshTokens.$inferSelect;
export type RequestRefreshToken = Omit<SelectRefreshToken, 'token'>;
