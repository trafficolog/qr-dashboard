import { pgTable, uuid, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

export const userDepartmentRoleEnum = pgEnum('user_department_role', ['member', 'head'])

export const userDepartments = pgTable(
  'user_departments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id').notNull(),
    role: userDepartmentRoleEnum('role').notNull().default('member'),
  },
  table => [
    uniqueIndex('user_department_user_department_unique').on(table.userId, table.departmentId),
    index('user_department_user_id_idx').on(table.userId),
    index('user_department_department_id_idx').on(table.departmentId),
  ],
)
