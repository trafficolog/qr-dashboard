import { createHash, randomBytes } from 'node:crypto'
import pg from 'pg'
import { expect, type BrowserContext } from '@playwright/test'

type AuthRole = 'viewer' | 'admin'

type AuthCookieOptions = {
  role?: AuthRole
}

const DEFAULT_BASE_URL = 'http://127.0.0.1:3001'
const E2E_EMAILS: Record<AuthRole, string> = {
  viewer: 'e2e-viewer@splat.local',
  admin: 'e2e-admin@splat.local',
}

const tokenCache = new Map<AuthRole, Promise<string>>()

function getBaseUrl() {
  return process.env.PLAYWRIGHT_BASE_URL || DEFAULT_BASE_URL
}

function getCookieDomain() {
  return new URL(getBaseUrl()).hostname
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function createCsrfToken() {
  return createHash('sha256').update(randomBytes(32).toString('hex')).digest('hex')
}

function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim()
}

export function isAuthBootstrapAvailable(): boolean {
  return Boolean(process.env.PLAYWRIGHT_AUTH_COOKIE || getDatabaseUrl())
}

async function createSessionCookie(role: AuthRole): Promise<string> {
  const databaseUrl = getDatabaseUrl()
  expect(databaseUrl, 'Set PLAYWRIGHT_AUTH_COOKIE or DATABASE_URL for authenticated e2e scenarios').toBeTruthy()

  const client = new pg.Client({ connectionString: databaseUrl })

  try {
    await client.connect()

    const email = E2E_EMAILS[role]
    const userResult = await client.query<{ id: string }>(
      `
      INSERT INTO users (email, role, created_at, updated_at)
      VALUES ($1, $2::user_role, now(), now())
      ON CONFLICT (email)
      DO UPDATE SET role = EXCLUDED.role, updated_at = now()
      RETURNING id
      `,
      [email, role],
    )

    const userId = userResult.rows[0]?.id
    expect(userId, `Failed to provision ${role} e2e user`).toBeTruthy()

    const plainToken = randomBytes(32).toString('hex')
    const tokenHash = hashToken(plainToken)
    const csrfToken = createCsrfToken()

    await client.query(
      `
      INSERT INTO sessions (user_id, token, csrf_token, expires_at, created_at)
      VALUES ($1, $2, $3, now() + interval '30 day', now())
      `,
      [userId, tokenHash, csrfToken],
    )

    return plainToken
  }
  finally {
    await client.end()
  }
}

export async function getAuthCookie(options: AuthCookieOptions = {}): Promise<string> {
  const role = options.role ?? 'viewer'

  if (role === 'viewer' && process.env.PLAYWRIGHT_AUTH_COOKIE) {
    return process.env.PLAYWRIGHT_AUTH_COOKIE
  }

  if (role === 'admin' && process.env.PLAYWRIGHT_ADMIN_AUTH_COOKIE) {
    return process.env.PLAYWRIGHT_ADMIN_AUTH_COOKIE
  }

  const cached = tokenCache.get(role)
  if (cached) {
    return cached
  }

  const tokenPromise = createSessionCookie(role)
  tokenCache.set(role, tokenPromise)
  return tokenPromise
}

export async function applyAuthCookie(context: BrowserContext, options: AuthCookieOptions = {}) {
  const sessionCookie = await getAuthCookie(options)

  await context.addCookies([
    {
      name: 'session_token',
      value: sessionCookie,
      domain: getCookieDomain(),
      path: '/',
    },
  ])
}
