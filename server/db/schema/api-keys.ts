import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 64 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 8 }).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
