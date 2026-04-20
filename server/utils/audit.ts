import { db } from '../db'
import { auditLog } from '../db/schema'
import type { auditActionEnum } from '../db/schema'

export type AuditAction = typeof auditActionEnum.enumValues[number]

interface AuditEvent {
  userId?: string | null
  action: AuditAction
  entityType: string
  entityId?: string | null
}

interface RecordAuditParams {
  details?: Record<string, unknown>
}

export function recordAudit(event: AuditEvent, params: RecordAuditParams = {}) {
  void db
    .insert(auditLog)
    .values({
      userId: event.userId ?? null,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId ?? null,
      details: params.details ?? {},
    })
    .catch((error) => {
      console.error('[audit] Failed to write audit log', {
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId ?? null,
        error,
      })
    })
}
