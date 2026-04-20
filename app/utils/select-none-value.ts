/**
 * Reka UI Select (Nuxt UI) forbids SelectItem with `value: ''` — empty string clears the selection.
 * Use this sentinel for “no folder” / “root parent” options and map to API null/undefined when saving.
 */
export const SELECT_VALUE_NONE = '__splat_none__'

export function selectValueToOptionalId(value: string): string | undefined {
  return value === SELECT_VALUE_NONE ? undefined : value
}

export function selectValueToNullableId(value: string): string | null {
  return value === SELECT_VALUE_NONE ? null : value
}
