import { ZodFirstPartyTypeKind, type ZodTypeAny } from 'zod'

type JsonSchema = Record<string, unknown>

function unwrap(schema: ZodTypeAny): { schema: ZodTypeAny, optional: boolean, nullable: boolean, defaultValue?: unknown } {
  let current = schema
  let optional = false
  let nullable = false
  let defaultValue: unknown

  while (true) {
    const typeName = current._def.typeName

    if (typeName === ZodFirstPartyTypeKind.ZodOptional) {
      optional = true
      current = current._def.innerType as ZodTypeAny
      continue
    }

    if (typeName === ZodFirstPartyTypeKind.ZodNullable) {
      nullable = true
      current = current._def.innerType as ZodTypeAny
      continue
    }

    if (typeName === ZodFirstPartyTypeKind.ZodDefault) {
      optional = true
      defaultValue = current._def.defaultValue()
      current = current._def.innerType as ZodTypeAny
      continue
    }

    if (typeName === ZodFirstPartyTypeKind.ZodEffects) {
      current = current._def.schema as ZodTypeAny
      continue
    }

    break
  }

  return { schema: current, optional, nullable, defaultValue }
}

function schemaForType(schema: ZodTypeAny): JsonSchema {
  const { schema: unwrapped, nullable, defaultValue } = unwrap(schema)
  let json: JsonSchema

  switch (unwrapped._def.typeName) {
    case ZodFirstPartyTypeKind.ZodString: {
      const checks = unwrapped._def.checks as Array<{ kind: string, value?: number, regex?: RegExp }>
      json = { type: 'string' }
      for (const check of checks) {
        if (check.kind === 'min') json.minLength = check.value
        if (check.kind === 'max') json.maxLength = check.value
        if (check.kind === 'email') json.format = 'email'
        if (check.kind === 'url') json.format = 'uri'
        if (check.kind === 'uuid') json.format = 'uuid'
        if (check.kind === 'datetime') json.format = 'date-time'
        if (check.kind === 'regex' && check.regex) json.pattern = check.regex.source
      }
      break
    }
    case ZodFirstPartyTypeKind.ZodNumber: {
      const checks = unwrapped._def.checks as Array<{ kind: string, value?: number }>
      json = { type: 'number' }
      for (const check of checks) {
        if (check.kind === 'int') json.type = 'integer'
        if (check.kind === 'min') json.minimum = check.value
        if (check.kind === 'max') json.maximum = check.value
      }
      break
    }
    case ZodFirstPartyTypeKind.ZodBoolean:
      json = { type: 'boolean' }
      break
    case ZodFirstPartyTypeKind.ZodArray: {
      json = {
        type: 'array',
        items: schemaForType(unwrapped._def.type),
      }
      break
    }
    case ZodFirstPartyTypeKind.ZodEnum:
      json = { type: 'string', enum: [...unwrapped._def.values] }
      break
    case ZodFirstPartyTypeKind.ZodObject: {
      const shape = unwrapped._def.shape() as Record<string, ZodTypeAny>
      const properties: Record<string, unknown> = {}
      const required: string[] = []

      for (const [key, child] of Object.entries(shape)) {
        const childMeta = unwrap(child)
        properties[key] = schemaForType(child)
        if (!childMeta.optional) {
          required.push(key)
        }
      }

      json = {
        type: 'object',
        properties,
        additionalProperties: unwrapped._def.unknownKeys === 'passthrough',
      }

      if (required.length > 0) {
        json.required = required
      }
      break
    }
    default:
      json = {}
  }

  if (nullable) {
    if (typeof json.type === 'string') {
      json.type = [json.type, 'null']
    }
    else if (Array.isArray(json.type) && !json.type.includes('null')) {
      json.type = [...json.type, 'null']
    }
  }

  if (defaultValue !== undefined) {
    json.default = defaultValue
  }

  return json
}

export function zodToJsonSchema(schema: ZodTypeAny): JsonSchema {
  return schemaForType(schema)
}
