import { z } from 'zod'
import { openApiRegistry } from '../registry'
import { standardErrorResponses, uuidParamSchema } from './common'

const qrDestinationDetailParamsSchema = openApiRegistry.register(
  'V1QrDestinationDetailParams',
  uuidParamSchema.extend({
    destid: z.string().uuid(),
  }),
)

const destinationSchema = openApiRegistry.register(
  'V1QrDestination',
  z.object({
    id: z.string().uuid(),
    qr_code_id: z.string().uuid(),
    url: z.string().url(),
    label: z.string().nullable(),
    weight: z.number().int().min(1).max(100),
    is_active: z.boolean(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  }),
)

const destinationListResponseSchema = openApiRegistry.register(
  'V1DestinationListResponse',
  z.object({
    data: z.array(destinationSchema),
  }),
)

const destinationMutationResponseSchema = openApiRegistry.register(
  'V1DestinationMutationResponse',
  z.object({
    data: destinationSchema,
  }),
)

const destinationDeleteResponseSchema = openApiRegistry.register(
  'V1DestinationDeleteResponse',
  z.object({
    data: z.object({
      success: z.literal(true),
    }),
  }),
)

const createDestinationBodySchema = openApiRegistry.register(
  'V1CreateDestinationRequest',
  z.object({
    url: z.string().url(),
    label: z.string().max(100).optional(),
    weight: z.number().int().min(1).max(100),
  }),
)

const updateDestinationBodySchema = openApiRegistry.register(
  'V1UpdateDestinationRequest',
  z.object({
    url: z.string().url().optional(),
    label: z.string().max(100).nullable().optional(),
    weight: z.number().int().min(1).max(100).optional(),
    is_active: z.boolean().optional(),
  }),
)

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/v1/qr/{id}/destinations',
  summary: 'List destinations',
  description: 'Returns destinations for a QR code.',
  tags: ['V1', 'Destinations'],
  security: [{ ApiKeyAuth: ['qr:read'] }],
  request: { params: uuidParamSchema },
  responses: {
    200: {
      description: 'Destination list',
      content: {
        'application/json': {
          schema: destinationListResponseSchema,
          example: {
            data: [
              {
                id: '7d35f2fc-8ce5-4f8f-8a39-958f9e7fc65f',
                qr_code_id: '9cf6259f-3034-4f96-af0f-c8bcfd847f52',
                url: 'https://example.com/landing',
                label: 'Primary',
                weight: 100,
                is_active: true,
                created_at: '2026-04-20T09:00:00.000Z',
                updated_at: '2026-04-20T09:00:00.000Z',
              },
            ],
          },
        },
      },
    },
    ...standardErrorResponses,
  },
})

openApiRegistry.registerPath({
  method: 'post',
  path: '/api/v1/qr/{id}/destinations',
  summary: 'Create destination',
  description: 'Adds a destination for a QR code.',
  tags: ['V1', 'Destinations'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  request: {
    params: uuidParamSchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: createDestinationBodySchema,
          example: {
            url: 'https://example.com/fr',
            label: 'French locale',
            weight: 20,
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Destination created',
      content: {
        'application/json': {
          schema: destinationMutationResponseSchema,
          example: {
            data: {
              id: '7d35f2fc-8ce5-4f8f-8a39-958f9e7fc65f',
              qr_code_id: '9cf6259f-3034-4f96-af0f-c8bcfd847f52',
              url: 'https://example.com/fr',
              label: 'French locale',
              weight: 20,
              is_active: true,
              created_at: '2026-04-20T09:00:00.000Z',
              updated_at: '2026-04-20T09:00:00.000Z',
            },
          },
        },
      },
    },
    ...standardErrorResponses,
  },
})

openApiRegistry.registerPath({
  method: 'put',
  path: '/api/v1/qr/{id}/destinations/{destid}',
  summary: 'Update destination',
  description: 'Updates an existing destination.',
  tags: ['V1', 'Destinations'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  request: {
    params: qrDestinationDetailParamsSchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: updateDestinationBodySchema,
          example: {
            label: 'French locale (A/B)',
            is_active: true,
            weight: 25,
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Destination updated',
      content: {
        'application/json': {
          schema: destinationMutationResponseSchema,
          example: {
            data: {
              id: '7d35f2fc-8ce5-4f8f-8a39-958f9e7fc65f',
              qr_code_id: '9cf6259f-3034-4f96-af0f-c8bcfd847f52',
              url: 'https://example.com/fr',
              label: 'French locale (A/B)',
              weight: 25,
              is_active: true,
              created_at: '2026-04-20T09:00:00.000Z',
              updated_at: '2026-04-20T10:00:00.000Z',
            },
          },
        },
      },
    },
    ...standardErrorResponses,
  },
})

openApiRegistry.registerPath({
  method: 'delete',
  path: '/api/v1/qr/{id}/destinations/{destid}',
  summary: 'Delete destination',
  description: 'Deletes a destination from a QR code.',
  tags: ['V1', 'Destinations'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  request: { params: qrDestinationDetailParamsSchema },
  responses: {
    200: {
      description: 'Destination deleted',
      content: {
        'application/json': {
          schema: destinationDeleteResponseSchema,
          example: {
            data: {
              success: true,
            },
          },
        },
      },
    },
    ...standardErrorResponses,
  },
})
