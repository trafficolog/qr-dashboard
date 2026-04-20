import { z } from 'zod'
import { openApiRegistry } from '../registry'

export const errorSchema = openApiRegistry.register(
  'ErrorResponse',
  z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
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
