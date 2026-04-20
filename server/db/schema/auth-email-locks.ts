import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core'

export const authEmailLocks = pgTable('auth_email_locks', {
  email: varchar('email', { length: 255 }).primaryKey(),
  lockedUntil: timestamp('locked_until', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
