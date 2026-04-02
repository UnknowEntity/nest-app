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

export type SelectUser = typeof users.$inferSelect;
export type RequestUser = Omit<SelectUser, 'password'>;
