import { pgTable, uuid, text, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
import { qrCodes } from './qr-codes'

export const qrDestinations = pgTable('qr_destinations', {
  id: uuid('id').defaultRandom().primaryKey(),
  qrCodeId: uuid('qr_code_id').notNull().references(() => qrCodes.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  weight: integer('weight').notNull().default(100),
  label: varchar('label', { length: 100 }),
  clicks: integer('clicks').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
