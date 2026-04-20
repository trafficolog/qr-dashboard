import { z } from 'zod'

export const QR_TITLE_MAX_LENGTH = 255
export const QR_DESCRIPTION_MAX_LENGTH = 1000
export const QR_UTM_MAX_LENGTH = 100
export const QR_STYLE_COLOR_MAX_LENGTH = 32
export const QR_STYLE_LOGO_URL_MAX_LENGTH = 2048
export const QR_STYLE_FRAME_TEXT_MAX_LENGTH = 140

const qrStyleLogoSchema = z.object({
  url: z.string().url().max(QR_STYLE_LOGO_URL_MAX_LENGTH),
  size: z.number().finite().min(0).max(1),
  padding: z.number().finite().min(0).max(100),
  borderRadius: z.number().finite().min(0).max(100),
}).strict()

const qrStyleFrameSchema = z.object({
  style: z.enum(['none', 'banner-bottom', 'banner-top', 'rounded-box', 'tooltip']),
  text: z.string().max(QR_STYLE_FRAME_TEXT_MAX_LENGTH),
  textColor: z.string().max(QR_STYLE_COLOR_MAX_LENGTH),
  backgroundColor: z.string().max(QR_STYLE_COLOR_MAX_LENGTH),
  fontSize: z.number().int().min(8).max(128),
}).strict()

export const qrStyleSchema = z.object({
  foregroundColor: z.string().max(QR_STYLE_COLOR_MAX_LENGTH).optional(),
  backgroundColor: z.string().max(QR_STYLE_COLOR_MAX_LENGTH).optional(),
  gradientType: z.enum(['linear', 'radial']).optional(),
  gradientColors: z.tuple([
    z.string().max(QR_STYLE_COLOR_MAX_LENGTH),
    z.string().max(QR_STYLE_COLOR_MAX_LENGTH),
  ]).optional(),
  moduleStyle: z.enum(['square', 'rounded', 'dots', 'classy', 'classy-rounded']).optional(),
  cornerStyle: z.enum(['square', 'rounded', 'dot', 'extra-rounded']).optional(),
  cornerColor: z.string().max(QR_STYLE_COLOR_MAX_LENGTH).optional(),
  logo: qrStyleLogoSchema.optional(),
  frame: qrStyleFrameSchema.optional(),
  errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).optional(),
}).strict()

export const qrUtmSchema = z.object({
  utm_source: z.string().max(QR_UTM_MAX_LENGTH).optional(),
  utm_medium: z.string().max(QR_UTM_MAX_LENGTH).optional(),
  utm_campaign: z.string().max(QR_UTM_MAX_LENGTH).optional(),
  utm_term: z.string().max(QR_UTM_MAX_LENGTH).optional(),
  utm_content: z.string().max(QR_UTM_MAX_LENGTH).optional(),
}).strict()
