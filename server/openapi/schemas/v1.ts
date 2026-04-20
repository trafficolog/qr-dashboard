import { z } from 'zod'
import { openApiRegistry } from '../registry'

const uuidParam = z.object({ id: z.string().uuid() })

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/v1/folders',
  tags: ['V1'],
  security: [{ ApiKeyAuth: ['qr:read'] }],
  responses: { 200: { description: 'List folders' } },
})

openApiRegistry.registerPath({
  method: 'post',
  path: '/api/v1/folders',
  tags: ['V1'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  responses: { 201: { description: 'Create folder' } },
})

openApiRegistry.registerPath({
  method: 'put',
  path: '/api/v1/folders/{id}',
  tags: ['V1'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  request: { params: uuidParam },
  responses: { 200: { description: 'Update folder' } },
})

openApiRegistry.registerPath({
  method: 'delete',
  path: '/api/v1/folders/{id}',
  tags: ['V1'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  request: { params: uuidParam },
  responses: { 200: { description: 'Delete folder' } },
})

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/v1/tags',
  tags: ['V1'],
  security: [{ ApiKeyAuth: ['qr:read'] }],
  responses: { 200: { description: 'List tags' } },
})

openApiRegistry.registerPath({
  method: 'post',
  path: '/api/v1/tags',
  tags: ['V1'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  responses: { 200: { description: 'Create tag' } },
})

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/v1/analytics/overview',
  tags: ['V1'],
  security: [{ ApiKeyAuth: ['qr:stats:read'] }],
  responses: { 200: { description: 'Analytics overview' } },
})

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/v1/analytics/scans',
  tags: ['V1'],
  security: [{ ApiKeyAuth: ['qr:stats:read'] }],
  responses: { 200: { description: 'Analytics scans' } },
})

const qrDestinationParams = z.object({
  id: z.string().uuid(),
})

const qrDestinationDetailParams = z.object({
  id: z.string().uuid(),
  destid: z.string().uuid(),
})

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/v1/qr/{id}/destinations',
  tags: ['V1'],
  security: [{ ApiKeyAuth: ['qr:read'] }],
  request: { params: qrDestinationParams },
  responses: { 200: { description: 'List destinations' } },
})

openApiRegistry.registerPath({
  method: 'post',
  path: '/api/v1/qr/{id}/destinations',
  tags: ['V1'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  request: { params: qrDestinationParams },
  responses: { 200: { description: 'Create destination' } },
})

openApiRegistry.registerPath({
  method: 'put',
  path: '/api/v1/qr/{id}/destinations/{destid}',
  tags: ['V1'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  request: { params: qrDestinationDetailParams },
  responses: { 200: { description: 'Update destination' } },
})

openApiRegistry.registerPath({
  method: 'delete',
  path: '/api/v1/qr/{id}/destinations/{destid}',
  tags: ['V1'],
  security: [{ ApiKeyAuth: ['qr:write'] }],
  request: { params: qrDestinationDetailParams },
  responses: { 200: { description: 'Delete destination' } },
})
