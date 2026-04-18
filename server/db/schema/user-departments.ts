import { pgTable, uuid, timestamp, pgEnum, primaryKey } from 'drizzle-orm/pg-core'
import { users } from './users'
import { departments } from './departments'

export const departmentRoleEnum = pgEnum('department_role', ['member', 'head'])

export const userDepartments = pgTable(
  'user_departments',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id').notNull().references(() => departments.id, { onDelete: 'cascade' }),
    role: departmentRoleEnum('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    primaryKey({
      name: 'user_departments_pkey',
      columns: [table.userId, table.departmentId],
    }),
  ],
)
