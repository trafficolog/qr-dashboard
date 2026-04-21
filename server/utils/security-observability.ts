import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import { getClientIp } from './ip'

type SecuritySignalName
  = | 'http.403'
    | 'http.429'
    | 'auth.lockout'
    | 'audit.failure'

interface SecurityLogContext {
  reason?: string
  method?: string
  path?: string
  ipHash?: string
  apiKeyId?: string
  requiredPermission?: string
  lockoutMinutes?: number
}

interface SecurityLogOptions {
  event?: H3Event
  eventCode: string
  statusCode: 401 | 403 | 429
  reason: string
  context?: Omit<SecurityLogContext, 'method' | 'path' | 'ipHash'>
}

interface SignalThreshold {
  threshold: number
  windowMs: number
  alertCode: string
  severity: 'warning' | 'critical'
}

const signalThresholds: Record<SecuritySignalName, SignalThreshold> = {
  'http.403': {
    threshold: 25,
    windowMs: 5 * 60 * 1000,
    alertCode: 'SEC_ALERT_403_RATE',
    severity: 'warning',
  },
  'http.429': {
    threshold: 20,
    windowMs: 5 * 60 * 1000,
    alertCode: 'SEC_ALERT_429_RATE',
    severity: 'warning',
  },
  'auth.lockout': {
    threshold: 10,
    windowMs: 10 * 60 * 1000,
    alertCode: 'SEC_ALERT_LOCKOUT_SPIKE',
    severity: 'critical',
  },
  'audit.failure': {
    threshold: 5,
    windowMs: 10 * 60 * 1000,
    alertCode: 'SEC_ALERT_AUDIT_FAILURE_GROWTH',
    severity: 'critical',
  },
}

const signalOccurrences = new Map<SecuritySignalName, number[]>()
const alertCooldownMs = 5 * 60 * 1000
const alertLastEmittedAt = new Map<string, number>()

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 12)
}

function trimSignalWindow(signal: SecuritySignalName, nowMs: number) {
  const threshold = signalThresholds[signal]
  const existing = signalOccurrences.get(signal) ?? []
  const lowerBound = nowMs - threshold.windowMs
  const trimmed = existing.filter(ts => ts >= lowerBound)
  signalOccurrences.set(signal, trimmed)
  return trimmed
}

function emitSignalAlert(signal: SecuritySignalName, currentCount: number, nowMs: number) {
  const threshold = signalThresholds[signal]
  if (currentCount < threshold.threshold) return

  const lastEmittedAt = alertLastEmittedAt.get(threshold.alertCode) ?? 0
  if ((nowMs - lastEmittedAt) < alertCooldownMs) return

  alertLastEmittedAt.set(threshold.alertCode, nowMs)
  console.warn('[security.alert]', {
    eventCode: threshold.alertCode,
    severity: threshold.severity,
    signal,
    count: currentCount,
    threshold: threshold.threshold,
    windowMs: threshold.windowMs,
    emittedAt: new Date(nowMs).toISOString(),
  })
}

export function recordSecuritySignal(signal: SecuritySignalName) {
  const nowMs = Date.now()
  const occurrences = trimSignalWindow(signal, nowMs)
  occurrences.push(nowMs)
  signalOccurrences.set(signal, occurrences)
  emitSignalAlert(signal, occurrences.length, nowMs)
}

export function logSecurityRejection(options: SecurityLogOptions) {
  const path = options.event ? getRequestURL(options.event).pathname : undefined
  const method = options.event ? getMethod(options.event) : undefined
  const ip = options.event ? getClientIp(options.event) : undefined

  console.warn('[security.reject]', {
    eventCode: options.eventCode,
    statusCode: options.statusCode,
    reason: options.reason,
    method,
    path,
    ipHash: ip ? hashIp(ip) : undefined,
    ...options.context,
  })

  if (options.statusCode === 403) {
    recordSecuritySignal('http.403')
  }
  if (options.statusCode === 429) {
    recordSecuritySignal('http.429')
  }
}
