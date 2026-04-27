import { z } from 'zod'
import { openApiRegistry } from '../registry'
import { errorSchema, paginationMetaSchema } from './common'

const qrStatusSchema = openApiRegistry.register(
  'QrStatus',
  z.enum(['active', 'paused', 'expired', 'archived']),
)

const qrVisibilitySchema = openApiRegistry.register(
  'QrVisibility',
  z.enum(['private', 'department', 'public']),
)

const qrItemSchema = openApiRegistry.register(
  'QrItem',
  z.object({
    id: z.string().uuid(),
    title: z.string(),
    shortCode: z.string(),
    status: qrStatusSchema,
    visibility: qrVisibilitySchema,
    totalScans: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
)

const qrListResponseSchema = openApiRegistry.register(
  'QrListResponse',
  z.object({
    success: z.literal(true),
    data: z.array(qrItemSchema),
    meta: paginationMetaSchema,
  }),
)

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/qr',
  tags: ['QR codes'],
  security: [{ ApiKeyAuth: ['qr:read'] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      sortBy: z.enum(['createdAt', 'title', 'totalScans']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
      search: z.string().optional(),
      status: qrStatusSchema.optional(),
      visibility: qrVisibilitySchema.optional(),
    }),
  },
  responses: {
    200: {
      description: 'Paginated list of QR codes',
      content: {
        'application/json': {
          schema: qrListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
    },
  },
})
