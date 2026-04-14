import { z } from 'zod'
import { qrService } from '../../../services/qr.service'
import { generateQrSvg, generateQrPng, generateQrPdf } from '../../../services/export.service'
import type { QrStyle } from '~~/types/qr'

const querySchema = z.object({
  format: z.enum(['svg', 'png', 'pdf']).default('png'),
  size: z.coerce.number().int().min(100).max(4096).default(1000),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID обязателен' })
  }

  const query = await getValidatedQuery(event, querySchema.parse)
  const qr = await qrService.getQrById(id, user)

  const destinationUrl = qr.destinationUrl
  const style = (qr.style ?? {}) as Partial<QrStyle>
  const shortCode = qr.shortCode
  const title = qr.title

  switch (query.format) {
    case 'svg': {
      const svgString = generateQrSvg(destinationUrl, style)
      setHeader(event, 'Content-Type', 'image/svg+xml')
      setHeader(event, 'Content-Disposition', `attachment; filename="qr-${shortCode}.svg"`)
      return svgString
    }

    case 'png': {
      const pngBuffer = await generateQrPng(destinationUrl, style, query.size)
      setHeader(event, 'Content-Type', 'image/png')
      setHeader(event, 'Content-Disposition', `attachment; filename="qr-${shortCode}.png"`)
      return pngBuffer
    }

    case 'pdf': {
      const pdfBuffer = await generateQrPdf(destinationUrl, style, title)
      setHeader(event, 'Content-Type', 'application/pdf')
      setHeader(event, 'Content-Disposition', `attachment; filename="qr-${shortCode}.pdf"`)
      return pdfBuffer
    }
  }
})
