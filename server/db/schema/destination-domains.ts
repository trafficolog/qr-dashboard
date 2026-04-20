import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const destinationDomains = pgTable('destination_domains', {
  id: uuid('id').defaultRandom().primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
