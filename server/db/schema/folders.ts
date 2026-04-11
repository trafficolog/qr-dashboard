import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const folders = pgTable('folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  parentId: uuid('parent_id'),
  color: varchar('color', { length: 7 }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
