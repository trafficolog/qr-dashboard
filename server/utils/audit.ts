import { db } from '../db'
import { auditLog } from '../db/schema'
import type { auditActionEnum } from '../db/schema'
import { recordSecuritySignal } from './security-observability'

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

const auditWriteCounters = {
  success: 0,
  failure: 0,
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
    .then(() => {
      auditWriteCounters.success += 1
    })
    .catch((error) => {
      auditWriteCounters.failure += 1
      recordSecuritySignal('audit.failure')
      console.error('[audit.write_failed]', {
        eventCode: 'SEC_AUDIT_WRITE_FAILED',
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId ?? null,
        auditWriteSuccessCount: auditWriteCounters.success,
        auditWriteFailureCount: auditWriteCounters.failure,
        errorMessage: error instanceof Error ? error.message : String(error),
      })
    })
}
