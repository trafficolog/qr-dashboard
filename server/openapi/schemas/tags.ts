import { z } from 'zod'
import { openApiRegistry } from '../registry'
import { standardErrorResponses } from './common'

const tagSchema = openApiRegistry.register(
  'V1Tag',
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).nullable(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }).optional(),
    qr_count: z.number().int().nonnegative().optional(),
  }),
)

const tagListResponseSchema = openApiRegistry.register(
  'V1TagListResponse',
  z.object({
    data: z.array(tagSchema),
  }),
)

const tagMutationResponseSchema = openApiRegistry.register(
  'V1TagMutationResponse',
  z.object({
    data: tagSchema,
  }),
)

const createTagBodySchema = openApiRegistry.register(
  'V1CreateTagRequest',
  z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  }),
)

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/v1/tags',
  summary: 'List tags',
  description: 'Returns all available tags.',
  tags: ['V1', 'Tags'],
  security: [{ ApiKeyAuth: ['qr:read'] }],
  responses: {
    200: {
      description: 'Tag list',
      content: {
        'application/json': {
          schema: tagListResponseSchema,
          example: {
            data: [
              {
                id: 'f9272a45-26c0-4cf2-9c62-2c356808d0d0',
                name: 'Summer',
                color: '#f97316',
                created_at: '2026-04-20T09:00:00.000Z',
                qr_count: 7,
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
  path: '/api/v1/tags',
  summary: 'Create tag',
  description: 'Creates a new tag.',
  tags: ['V1', 'Tags'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: createTagBodySchema,
          example: {
            name: 'Partner campaign',
            color: '#f59e0b',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Tag created',
      content: {
        'application/json': {
          schema: tagMutationResponseSchema,
          example: {
            data: {
              id: 'f9272a45-26c0-4cf2-9c62-2c356808d0d0',
              name: 'Partner campaign',
              color: '#f59e0b',
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
