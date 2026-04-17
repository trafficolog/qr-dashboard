import { z } from 'zod'
import { requireAuth } from '../../../utils/auth'
import { qrService } from '../../../services/qr.service'
import { exportService } from '../../../services/export.service'
import type { QrStyle } from '~~/types/qr'

const querySchema = z.object({
  format: z.enum(['svg', 'png', 'pdf']).default('png'),
  size: z.coerce.number().int().min(100).max(3000).default(1000),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const query = await getValidatedQuery(event, querySchema.parse)

  const qr = await qrService.getQrById(id, user)
  const style = (qr.style ?? {}) as Partial<QrStyle>
  const data = qr.destinationUrl
  const filename = `qr-${qr.shortCode}`

  switch (query.format) {
    case 'svg': {
      const svg = exportService.generateQrSvg(data, style)
      setHeader(event, 'Content-Type', 'image/svg+xml')
      setHeader(event, 'Content-Disposition', `attachment; filename="${filename}.svg"`)
      return svg
    }

    case 'png': {
      const png = await exportService.generateQrPng(data, style, query.size)
      setHeader(event, 'Content-Type', 'image/png')
      setHeader(event, 'Content-Disposition', `attachment; filename="${filename}.png"`)
      return png
    }

    case 'pdf': {
      const pdf = await exportService.generateQrPdf(data, style, qr.title)
      setHeader(event, 'Content-Type', 'application/pdf')
      setHeader(event, 'Content-Disposition', `attachment; filename="${filename}.pdf"`)
      return pdf
    }
  }
})
