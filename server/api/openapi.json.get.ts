import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineEventHandler((event) => {
  const json = readFileSync(resolve(process.cwd(), 'public/openapi.json'), 'utf8')
  const etag = createHash('sha256').update(json).digest('hex')

  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(
    event,
    'Cache-Control',
    process.env.NODE_ENV === 'production'
      ? 'public, max-age=300, stale-while-revalidate=86400'
      : 'no-store',
  )
  setHeader(event, 'ETag', `"${etag}"`)

  return JSON.parse(json)
})
