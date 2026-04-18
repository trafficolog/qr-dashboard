import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }),
  headUserId: uuid('head_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('departments_slug_idx').on(table.slug),
  index('departments_head_user_idx').on(table.headUserId),
])
