import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core'

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
