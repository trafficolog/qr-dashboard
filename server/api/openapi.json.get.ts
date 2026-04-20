import { buildOpenApiPayload } from '../openapi/registry'
import '../openapi/schemas'

export default defineEventHandler((event) => {
  const { document, etag } = buildOpenApiPayload()

  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=300, stale-while-revalidate=86400')
  setHeader(event, 'ETag', `"${etag}"`)

  return document
})
