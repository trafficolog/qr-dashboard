import { createHash } from 'node:crypto'
import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi as extendZodWithOpenApiFactory,
} from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

export function extendZodWithOpenApi(zodInstance: typeof z) {
  extendZodWithOpenApiFactory(zodInstance)
}

extendZodWithOpenApi(z)

export const openApiRegistry = new OpenAPIRegistry()

const bearerDescription = 'API key via Authorization: Bearer sqr_live_<64_hex>'
const apiTags = [
  {
    name: 'QR codes',
    description: 'QR code catalog and lifecycle operations.',
  },
  {
    name: 'Analytics',
    description: 'Scan statistics, timeseries and KPI endpoints.',
  },
  {
    name: 'Folders',
    description: 'Folder hierarchy for organizing QR codes.',
  },
  {
    name: 'Tags',
    description: 'Reusable labels for QR code filtering and grouping.',
  },
  {
    name: 'Destinations',
    description: 'Dynamic QR destination variants and routing targets.',
  },
]

openApiRegistry.registerComponent('securitySchemes', 'ApiKeyAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'sqr_live_<64_hex>',
  description: bearerDescription,
})

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(openApiRegistry.definitions)

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'SPLAT QR Dashboard API',
      version: '1.0.0',
      description: 'Internal and public API surface for QR Dashboard.',
    },
    servers: [{ url: '/' }],
    security: [{ ApiKeyAuth: [] }],
    tags: apiTags,
  })
}

export function buildOpenApiPayload() {
  const document = buildOpenApiDocument()
  const json = JSON.stringify(document, null, 2)
  const etag = createHash('sha256').update(json).digest('hex')

  return { document, json, etag }
}
