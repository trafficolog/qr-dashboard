import { pgTable, varchar, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const rateLimitCounters = pgTable('rate_limit_counters', {
  id: varchar('id', { length: 160 }).primaryKey(),
  scope: varchar('scope', { length: 32 }).notNull(),
  key: varchar('key', { length: 128 }).notNull(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
  count: integer('count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  scopeKeyWindowUnique: uniqueIndex('rate_limit_scope_key_window_uidx').on(
    table.scope,
    table.key,
    table.windowStart,
  ),
}))
