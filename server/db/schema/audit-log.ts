import { pgTable, uuid, varchar, timestamp, pgEnum, index, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'

export const auditActionEnum = pgEnum('audit_action', [
  'auth.verify',
  'auth.logout',
  'qr.create',
  'qr.update',
  'qr.update_visibility',
  'qr.delete',
  'team.invite',
  'team.update_role',
  'team.role_change',
  'team.delete_user',
  'folder.create',
  'folder.update',
  'folder.delete',
  'api_key.create',
  'api_key.delete',
  'api_key.scope_denied',
])

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: auditActionEnum('action').notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: varchar('entity_id', { length: 64 }),
    details: jsonb('details').$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('audit_log_user_id_idx').on(table.userId),
    index('audit_log_action_idx').on(table.action),
    index('audit_log_entity_idx').on(table.entityType, table.entityId),
    index('audit_log_created_at_idx').on(table.createdAt),
  ],
)
