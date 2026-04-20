import { z } from 'zod'
import { openApiRegistry } from '../registry'
import { standardErrorResponses, uuidParamSchema } from './common'

const folderSchema = openApiRegistry.register(
  'V1Folder',
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    parent_id: z.string().uuid().nullable(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).nullable(),
    created_by: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }).optional(),
    qr_count: z.number().int().nonnegative().optional(),
  }),
)

const folderListResponseSchema = openApiRegistry.register(
  'V1FolderListResponse',
  z.object({
    data: z.array(folderSchema),
  }),
)

const folderMutationResponseSchema = openApiRegistry.register(
  'V1FolderMutationResponse',
  z.object({
    data: folderSchema,
  }),
)

const folderDeleteResponseSchema = openApiRegistry.register(
  'V1FolderDeleteResponse',
  z.object({
    data: z.object({
      success: z.literal(true),
    }),
  }),
)

const createFolderBodySchema = openApiRegistry.register(
  'V1CreateFolderRequest',
  z.object({
    name: z.string().trim().min(1).max(100),
    parent_id: z.string().uuid().nullable().optional(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).nullable().optional(),
  }),
)

const updateFolderBodySchema = openApiRegistry.register(
  'V1UpdateFolderRequest',
  z.object({
    name: z.string().min(1).max(100).optional(),
    parent_id: z.string().uuid().nullable().optional(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).nullable().optional(),
  }),
)

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/v1/folders',
  summary: 'List folders',
  description: 'Returns folders available for the authenticated user.',
  tags: ['V1', 'Folders'],
  security: [{ ApiKeyAuth: ['qr:read'] }],
  responses: {
    200: {
      description: 'Folder list',
      content: {
        'application/json': {
          schema: folderListResponseSchema,
          example: {
            data: [
              {
                id: '9cf6259f-3034-4f96-af0f-c8bcfd847f52',
                name: 'Product campaigns',
                parent_id: null,
                color: '#4f46e5',
                created_by: '29fdf297-3f12-4fab-a7da-20367a8e8cc5',
                created_at: '2026-04-19T09:00:00.000Z',
                qr_count: 12,
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
  path: '/api/v1/folders',
  summary: 'Create folder',
  description: 'Creates a new folder.',
  tags: ['V1', 'Folders'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: createFolderBodySchema,
          example: {
            name: 'Spring launch',
            parent_id: null,
            color: '#0ea5e9',
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Folder created',
      content: {
        'application/json': {
          schema: folderMutationResponseSchema,
          example: {
            data: {
              id: '9cf6259f-3034-4f96-af0f-c8bcfd847f52',
              name: 'Spring launch',
              parent_id: null,
              color: '#0ea5e9',
              created_by: '29fdf297-3f12-4fab-a7da-20367a8e8cc5',
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
  path: '/api/v1/folders/{id}',
  summary: 'Update folder',
  description: 'Updates folder fields by id.',
  tags: ['V1', 'Folders'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  request: {
    params: uuidParamSchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: updateFolderBodySchema,
          example: {
            name: 'Updated folder',
            color: '#16a34a',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Folder updated',
      content: {
        'application/json': {
          schema: folderMutationResponseSchema,
          example: {
            data: {
              id: '9cf6259f-3034-4f96-af0f-c8bcfd847f52',
              name: 'Updated folder',
              parent_id: null,
              color: '#16a34a',
              created_by: '29fdf297-3f12-4fab-a7da-20367a8e8cc5',
              created_at: '2026-04-20T09:00:00.000Z',
              updated_at: '2026-04-20T12:00:00.000Z',
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
  path: '/api/v1/folders/{id}',
  summary: 'Delete folder',
  description: 'Deletes folder by id.',
  tags: ['V1', 'Folders'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  request: { params: uuidParamSchema },
  responses: {
    200: {
      description: 'Folder deleted',
      content: {
        'application/json': {
          schema: folderDeleteResponseSchema,
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
