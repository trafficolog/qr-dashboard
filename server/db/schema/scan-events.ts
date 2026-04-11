import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  doublePrecision,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { qrCodes } from './qr-codes'
import { qrDestinations } from './qr-destinations'

export const scanEvents = pgTable(
  'scan_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    qrCodeId: uuid('qr_code_id')
      .notNull()
      .references(() => qrCodes.id, { onDelete: 'cascade' }),
    destinationId: uuid('destination_id').references(() => qrDestinations.id),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    referer: text('referer'),
    country: varchar('country', { length: 2 }),
    city: varchar('city', { length: 100 }),
    region: varchar('region', { length: 100 }),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    deviceType: varchar('device_type', { length: 20 }),
    os: varchar('os', { length: 50 }),
    browser: varchar('browser', { length: 50 }),
    isUnique: boolean('is_unique').notNull().default(false),
    scannedAt: timestamp('scanned_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('scan_qr_code_idx').on(table.qrCodeId),
    index('scan_scanned_at_idx').on(table.scannedAt),
    index('scan_country_idx').on(table.country),
    index('scan_qr_time_idx').on(table.qrCodeId, table.scannedAt),
  ],
)
