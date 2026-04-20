import { z } from 'zod'
import { openApiRegistry } from '../registry'

export const errorSchema = openApiRegistry.register(
  'ErrorResponse',
  z.object({
    data: z.null().optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.unknown()).nullable().optional(),
      retryAfter: z.number().int().positive().optional(),
    }),
  }),
)

export const paginationMetaSchema = openApiRegistry.register(
  'PaginationMeta',
  z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  }),
)

export const uuidParamSchema = openApiRegistry.register(
  'UuidPathParam',
  z.object({
    id: z.string().uuid().openapi({
      example: '9cf6259f-3034-4f96-af0f-c8bcfd847f52',
      description: 'Resource UUID',
    }),
  }),
)

export const v1ScopeQuerySchema = openApiRegistry.register(
  'V1ScopeQuery',
  z.object({
    scope: z.enum(['mine', 'department', 'public', 'company']).optional().openapi({
      example: 'company',
      description: 'Analytics scope',
    }),
    department_id: z.string().uuid().optional().openapi({
      example: '499fee8b-cfc7-4eb9-b919-19f8351949f0',
    }),
  }),
)

export const standardErrorResponses = {
  400: {
    description: 'Bad request',
    content: {
      'application/json': {
        schema: errorSchema,
        example: {
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid request payload',
            details: { field: 'name' },
          },
        },
      },
    },
  },
  401: {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: errorSchema,
        example: {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            details: null,
          },
        },
      },
    },
  },
  403: {
    description: 'Forbidden',
    content: {
      'application/json': {
        schema: errorSchema,
        example: {
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            details: null,
          },
        },
      },
    },
  },
  404: {
    description: 'Not found',
    content: {
      'application/json': {
        schema: errorSchema,
        example: {
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
            details: null,
          },
        },
      },
    },
  },
  422: {
    description: 'Validation error',
    content: {
      'application/json': {
        schema: errorSchema,
        example: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: { issues: [{ path: 'name', message: 'Required' }] },
          },
        },
      },
    },
  },
  429: {
    description: 'Rate limited',
    content: {
      'application/json': {
        schema: errorSchema,
        example: {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            retryAfter: 60,
            details: null,
          },
        },
      },
    },
  },
} as const
