import { createHash, timingSafeEqual } from 'node:crypto'

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

export function hashOtpWithPepper(otp: string): string {
  const runtimeConfig = useRuntimeConfig()
  const pepper = runtimeConfig.otpPepper?.trim()

  if (!pepper) {
    throw new Error('OTP_PEPPER is required for OTP hashing')
  }

  return createHash('sha256').update(`${otp}:${pepper}`).digest('hex')
}

export function compareHash(plain: string, hash: string): boolean {
  const plainHash = hashToken(plain)
  try {
    return timingSafeEqual(Buffer.from(plainHash, 'hex'), Buffer.from(hash, 'hex'))
  }
  catch {
    return false
  }
}
