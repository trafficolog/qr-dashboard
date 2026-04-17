import { relations } from 'drizzle-orm'
import { users } from './users'
import { sessions } from './sessions'
import { qrCodes } from './qr-codes'
import { qrDestinations } from './qr-destinations'
import { scanEvents } from './scan-events'
import { folders } from './folders'
import { tags } from './tags'
import { qrTags } from './qr-tags'
import { apiKeys } from './api-keys'
import { scanDailyStats } from './scan-daily-stats'

// --- Re-exports ---
export * from './users'
export * from './sessions'
export * from './otp-codes'
export * from './qr-codes'
export * from './qr-destinations'
export * from './scan-events'
export * from './folders'
export * from './tags'
export * from './qr-tags'
export * from './allowed-domains'
export * from './api-keys'
export * from './scan-daily-stats'

// --- Relations ---
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  qrCodes: many(qrCodes),
  apiKeys: many(apiKeys),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const qrCodesRelations = relations(qrCodes, ({ one, many }) => ({
  folder: one(folders, {
    fields: [qrCodes.folderId],
    references: [folders.id],
  }),
  creator: one(users, {
    fields: [qrCodes.createdBy],
    references: [users.id],
  }),
  destinations: many(qrDestinations),
  scanEvents: many(scanEvents),
  qrTags: many(qrTags),
}))

export const qrDestinationsRelations = relations(qrDestinations, ({ one }) => ({
  qrCode: one(qrCodes, {
    fields: [qrDestinations.qrCodeId],
    references: [qrCodes.id],
  }),
}))

export const scanEventsRelations = relations(scanEvents, ({ one }) => ({
  qrCode: one(qrCodes, {
    fields: [scanEvents.qrCodeId],
    references: [qrCodes.id],
  }),
  destination: one(qrDestinations, {
    fields: [scanEvents.destinationId],
    references: [qrDestinations.id],
  }),
}))

export const foldersRelations = relations(folders, ({ one, many }) => ({
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: 'parentChild',
  }),
  children: many(folders, {
    relationName: 'parentChild',
  }),
  creator: one(users, {
    fields: [folders.createdBy],
    references: [users.id],
  }),
  qrCodes: many(qrCodes),
}))

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  qrTags: many(qrTags),
}))

export const qrTagsRelations = relations(qrTags, ({ one }) => ({
  qrCode: one(qrCodes, {
    fields: [qrTags.qrCodeId],
    references: [qrCodes.id],
  }),
  tag: one(tags, {
    fields: [qrTags.tagId],
    references: [tags.id],
  }),
}))

export const scanDailyStatsRelations = relations(scanDailyStats, ({ one }) => ({
  qrCode: one(qrCodes, {
    fields: [scanDailyStats.qrCodeId],
    references: [qrCodes.id],
  }),
}))
