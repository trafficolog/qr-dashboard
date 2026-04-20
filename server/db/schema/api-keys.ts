import { sql } from 'drizzle-orm'
import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core'
import { users } from './users'

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 64 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 8 }).notNull(),
  permissions: text('permissions').array().notNull().default(sql`ARRAY['qr:read','qr:write','qr:stats:read','mcp:access']::text[]`),
  allowedIps: text('allowed_ips').array().notNull().default(sql`ARRAY[]::text[]`),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull().default(sql`now() + interval '90 days'`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
