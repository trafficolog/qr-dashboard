import { z } from 'zod'
import { openApiRegistry } from '../registry'
import { standardErrorResponses, v1ScopeQuerySchema } from './common'

const analyticsOverviewQuerySchema = openApiRegistry.register(
  'V1AnalyticsOverviewQuery',
  v1ScopeQuerySchema.extend({
    date_from: z.string().datetime({ offset: true }).optional(),
    date_to: z.string().datetime({ offset: true }).optional(),
  }),
)

const analyticsScansQuerySchema = openApiRegistry.register(
  'V1AnalyticsScansQuery',
  v1ScopeQuerySchema.extend({
    qr_code_id: z.string().uuid().optional(),
    date_from: z.string().datetime({ offset: true }).optional(),
    date_to: z.string().datetime({ offset: true }).optional(),
    compare_previous: z.coerce.boolean().optional(),
  }),
)

const analyticsOverviewDataSchema = openApiRegistry.register(
  'V1AnalyticsOverviewData',
  z.object({
    total_qr_codes: z.number().int().nonnegative(),
    total_scans: z.number().int().nonnegative(),
    unique_scans: z.number().int().nonnegative(),
    scans_today: z.number().int().nonnegative(),
    total_qr_codes_change: z.number(),
    total_scans_change: z.number(),
    unique_scans_change: z.number(),
    scans_today_change: z.number(),
  }),
)

const analyticsOverviewResponseSchema = openApiRegistry.register(
  'V1AnalyticsOverviewResponse',
  z.object({
    data: analyticsOverviewDataSchema,
  }),
)

const analyticsScanPointSchema = openApiRegistry.register(
  'V1AnalyticsScanPoint',
  z.object({
    date: z.string(),
    total_scans: z.number().int().nonnegative(),
    unique_scans: z.number().int().nonnegative(),
  }),
)

const analyticsScansResponseSchema = openApiRegistry.register(
  'V1AnalyticsScansResponse',
  z.object({
    data: z.union([
      z.array(analyticsScanPointSchema),
      z.object({
        current: z.array(analyticsScanPointSchema),
        previous: z.array(analyticsScanPointSchema),
      }),
    ]),
  }),
)

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/v1/analytics/overview',
  summary: 'Get analytics overview',
  description: 'Returns aggregate KPI values for the selected period.',
  tags: ['Analytics'],
  security: [{ ApiKeyAuth: ['qr:stats:read'] }],
  request: {
    query: analyticsOverviewQuerySchema,
  },
  responses: {
    200: {
      description: 'Analytics overview',
      content: {
        'application/json': {
          schema: analyticsOverviewResponseSchema,
          example: {
            data: {
              total_qr_codes: 102,
              total_scans: 5821,
              unique_scans: 4112,
              scans_today: 97,
              total_qr_codes_change: 7.9,
              total_scans_change: 13.4,
              unique_scans_change: 11.1,
              scans_today_change: -2.2,
            },
          },
        },
      },
    },
    ...standardErrorResponses,
  },
})

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/v1/analytics/scans',
  summary: 'Get scans timeseries',
  description: 'Returns scans timeline, optionally with previous-period comparison.',
  tags: ['Analytics'],
  security: [{ ApiKeyAuth: ['qr:stats:read'] }],
  request: {
    query: analyticsScansQuerySchema,
  },
  responses: {
    200: {
      description: 'Scans timeseries',
      content: {
        'application/json': {
          schema: analyticsScansResponseSchema,
          examples: {
            simple: {
              value: {
                data: [
                  {
                    date: '2026-04-19',
                    total_scans: 103,
                    unique_scans: 74,
                  },
                ],
              },
            },
            compared: {
              value: {
                data: {
                  current: [
                    {
                      date: '2026-04-19',
                      total_scans: 103,
                      unique_scans: 74,
                    },
                  ],
                  previous: [
                    {
                      date: '2026-03-20',
                      total_scans: 92,
                      unique_scans: 61,
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    ...standardErrorResponses,
  },
})
