import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  color: varchar('color', { length: 7 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
