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
import { departments } from './departments'
import { userDepartments } from './user-departments'
import { auditLog } from './audit-log'
import { authEmailLocks } from './auth-email-locks'

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
export * from './departments'
export * from './user-departments'
export * from './audit-log'
export * from './auth-email-locks'
export * from './rate-limit-counters'

// --- Relations ---
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  qrCodes: many(qrCodes),
  apiKeys: many(apiKeys),
  departments: many(userDepartments),
  auditLogs: many(auditLog),
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
  department: one(departments, {
    fields: [qrCodes.departmentId],
    references: [departments.id],
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

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  head: one(users, {
    fields: [departments.headUserId],
    references: [users.id],
  }),
  memberships: many(userDepartments),
  qrCodes: many(qrCodes),
}))

export const userDepartmentsRelations = relations(userDepartments, ({ one }) => ({
  user: one(users, {
    fields: [userDepartments.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [userDepartments.departmentId],
    references: [departments.id],
  }),
}))

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}))
export const scanDailyStatsRelations = relations(scanDailyStats, ({ one }) => ({
  qrCode: one(qrCodes, {
    fields: [scanDailyStats.qrCodeId],
    references: [qrCodes.id],
  }),
}))

export const authEmailLocksRelations = relations(authEmailLocks, () => ({}))
