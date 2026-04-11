import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core'

export const allowedDomains = pgTable('allowed_domains', {
  id: uuid('id').defaultRandom().primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
