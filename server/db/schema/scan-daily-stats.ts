import {
  pgTable,
  uuid,
  date,
  integer,
  jsonb,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core'
import { qrCodes } from './qr-codes'

export const scanDailyStats = pgTable(
  'scan_daily_stats',
  {
    date: date('date').notNull(),
    qrCodeId: uuid('qr_code_id')
      .notNull()
      .references(() => qrCodes.id, { onDelete: 'cascade' }),
    totalScans: integer('total_scans').notNull().default(0),
    uniqueScans: integer('unique_scans').notNull().default(0),
    /** { "US": 120, "RU": 45, ... } */
    countryBreakdown: jsonb('country_breakdown').$type<Record<string, number>>().default({}),
    /** { "mobile": 100, "desktop": 60, "tablet": 5 } */
    deviceBreakdown: jsonb('device_breakdown').$type<Record<string, number>>().default({}),
  },
  table => [
    primaryKey({ columns: [table.date, table.qrCodeId] }),
    index('sds_qr_code_idx').on(table.qrCodeId),
    index('sds_date_idx').on(table.date),
  ],
)
