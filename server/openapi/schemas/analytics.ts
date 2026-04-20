import { z } from 'zod'
import { openApiRegistry } from '../registry'
import { errorSchema } from './common'

const analyticsOverviewItemSchema = openApiRegistry.register(
  'AnalyticsOverviewItem',
  z.object({
    date: z.string(),
    scans: z.number().int().nonnegative(),
    uniqueScans: z.number().int().nonnegative(),
  }),
)

const analyticsOverviewResponseSchema = openApiRegistry.register(
  'AnalyticsOverviewResponse',
  z.object({
    success: z.literal(true),
    data: z.array(analyticsOverviewItemSchema),
  }),
)

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/analytics/overview',
  tags: ['Analytics'],
  security: [{ ApiKeyAuth: ['qr:stats:read'] }],
  request: {
    query: z.object({
      range: z.enum(['7d', '30d', '90d', '1y']).default('30d').optional(),
      qrId: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Analytics overview timeseries',
      content: {
        'application/json': {
          schema: analyticsOverviewResponseSchema,
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
