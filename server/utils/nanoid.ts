import { customAlphabet } from 'nanoid'

// Убираем ambiguous символы: 0/O, 1/l/I
const SAFE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'
const SHORT_CODE_LENGTH = 7

const generate = customAlphabet(SAFE_ALPHABET, SHORT_CODE_LENGTH)

export function generateShortCode(): string {
  return generate()
}
