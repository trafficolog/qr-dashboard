import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { folders } from './folders'
import { departments } from './departments'

export const qrStatusEnum = pgEnum('qr_status', ['active', 'paused', 'expired', 'archived'])
export const qrTypeEnum = pgEnum('qr_type', ['dynamic', 'static'])
export const qrVisibilityEnum = pgEnum('qr_visibility', ['private', 'department', 'public'])

export const qrCodes = pgTable(
  'qr_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shortCode: varchar('short_code', { length: 20 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    type: qrTypeEnum('type').notNull().default('dynamic'),
    status: qrStatusEnum('status').notNull().default('active'),
    visibility: qrVisibilityEnum('visibility').notNull().default('private'),
    destinationUrl: text('destination_url').notNull(),
    style: jsonb('style').default('{}'),
    utmParams: jsonb('utm_params'),
    folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
    departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    totalScans: integer('total_scans').notNull().default(0),
    uniqueScans: integer('unique_scans').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex('qr_short_code_idx').on(table.shortCode),
    index('qr_status_idx').on(table.status),
    index('qr_visibility_idx').on(table.visibility),
    index('qr_folder_idx').on(table.folderId),
    index('qr_department_idx').on(table.departmentId),
    index('qr_created_by_idx').on(table.createdBy),
    index('qr_created_at_idx').on(table.createdAt),
  ],
)
