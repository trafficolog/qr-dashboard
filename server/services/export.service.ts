/**
 * Export Service — генерация QR-кодов в форматах SVG, PNG, PDF.
 *
 * Содержит полную копию логики рендеринга из app/utils/qr-svg.ts,
 * т.к. сервер не имеет прямого доступа к app/utils (разные модульные контексты).
 */
import QRCode from 'qrcode'
import sharp from 'sharp'
import PDFDocument from 'pdfkit'
import type { QrStyle } from '~/shared/types/qr'

// ─── SVG rendering (mirrors app/utils/qr-svg.ts) ────────────────────────────

const DEFAULT_STYLE = {
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
  moduleStyle: 'square',
  cornerStyle: 'square',
  errorCorrectionLevel: 'M',
}

function generateMatrix(data: string, ecl: string): boolean[][] {
  const qr = QRCode.create(data, {
    errorCorrectionLevel: ecl as 'L' | 'M' | 'Q' | 'H',
  })
  const size = qr.modules.size
  const matrix: boolean[][] = []
  for (let r = 0; r < size; r++) {
    const row: boolean[] = []
    for (let c = 0; c < size; c++) {
      row.push(qr.modules.get(r, c) === 1)
    }
    matrix.push(row)
  }
  return matrix
}

function isFinderPattern(row: number, col: number, size: number): boolean {
  if (row < 7 && col < 7) return true
  if (row < 7 && col >= size - 7) return true
  if (row >= size - 7 && col < 7) return true
  return false
}

function renderModule(x: number, y: number, s: number, style: string, color: string): string {
  switch (style) {
    case 'rounded':
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.3}" fill="${color}"/>`
    case 'dots':
      return `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s * 0.42}" fill="${color}"/>`
    case 'classy': {
      const r = s * 0.3
      return `<path d="M${x} ${y}h${s - r}a${r} ${r} 0 0 1 ${r} ${r}v${s - r}h-${s}v-${s}z" fill="${color}"/>`
    }
    case 'classy-rounded': {
      const r = s * 0.4
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" fill="${color}"/>`
    }
    default:
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${color}"/>`
  }
}

function renderFinderPattern(
  sx: number,
  sy: number,
  s: number,
  cornerStyle: string,
  color: string,
  cornerColor: string,
): string {
  const outerSize = 7 * s
  const middleSize = 5 * s
  const innerSize = 3 * s
  let svg = ''

  switch (cornerStyle) {
    case 'rounded': {
      svg += `<rect x="${sx}" y="${sy}" width="${outerSize}" height="${outerSize}" rx="${s * 1.5}" fill="${cornerColor}"/>`
      svg += `<rect x="${sx + s}" y="${sy + s}" width="${middleSize}" height="${middleSize}" rx="${s}" fill="white"/>`
      svg += `<rect x="${sx + 2 * s}" y="${sy + 2 * s}" width="${innerSize}" height="${innerSize}" rx="${s * 0.8}" fill="${cornerColor}"/>`
      break
    }
    case 'dot': {
      const r = outerSize / 2
      const cx = sx + r
      const cy = sy + r
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${cornerColor}"/>`
      svg += `<circle cx="${cx}" cy="${cy}" r="${middleSize / 2}" fill="white"/>`
      svg += `<circle cx="${cx}" cy="${cy}" r="${innerSize / 2}" fill="${cornerColor}"/>`
      break
    }
    case 'extra-rounded': {
      svg += `<rect x="${sx}" y="${sy}" width="${outerSize}" height="${outerSize}" rx="${s * 2.5}" fill="${cornerColor}"/>`
      svg += `<rect x="${sx + s}" y="${sy + s}" width="${middleSize}" height="${middleSize}" rx="${s * 1.5}" fill="white"/>`
      svg += `<rect x="${sx + 2 * s}" y="${sy + 2 * s}" width="${innerSize}" height="${innerSize}" rx="${s}" fill="${cornerColor}"/>`
      break
    }
    default: {
      svg += `<rect x="${sx}" y="${sy}" width="${outerSize}" height="${outerSize}" fill="${cornerColor}"/>`
      svg += `<rect x="${sx + s}" y="${sy + s}" width="${middleSize}" height="${middleSize}" fill="white"/>`
      svg += `<rect x="${sx + 2 * s}" y="${sy + 2 * s}" width="${innerSize}" height="${innerSize}" fill="${cornerColor}"/>`
    }
  }
  return svg
}

function buildQrSvg(data: string, style: Partial<QrStyle> = {}): string {
  const {
    foregroundColor,
    backgroundColor,
    moduleStyle,
    cornerStyle,
    errorCorrectionLevel,
  } = { ...DEFAULT_STYLE, ...style }

  const cornerColor = style.cornerColor || foregroundColor
  const matrix = generateMatrix(data, errorCorrectionLevel)
  const size = matrix.length
  const cellSize = 10
  const margin = 4 * cellSize
  const svgSize = size * cellSize + margin * 2

  let modules = ''
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!matrix[row]![col] || isFinderPattern(row, col, size)) continue
      modules += renderModule(
        margin + col * cellSize,
        margin + row * cellSize,
        cellSize,
        moduleStyle,
        foregroundColor,
      )
    }
  }

  const eyes = [
    { row: 0, col: 0 },
    { row: 0, col: size - 7 },
    { row: size - 7, col: 0 },
  ]

  let eyeSvg = ''
  for (const eye of eyes) {
    eyeSvg += renderFinderPattern(
      margin + eye.col * cellSize,
      margin + eye.row * cellSize,
      cellSize,
      cornerStyle,
      foregroundColor,
      cornerColor,
    )
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" shape-rendering="crispEdges">
  <rect width="${svgSize}" height="${svgSize}" fill="${backgroundColor}"/>
  ${eyeSvg}
  ${modules}
</svg>`
}

// ─── Export service ──────────────────────────────────────────────────────────

export const exportService = {
  generateQrSvg(data: string, style: Partial<QrStyle> = {}): string {
    return buildQrSvg(data, style)
  },

  async generateQrPng(data: string, style: Partial<QrStyle> = {}, size = 1000): Promise<Buffer> {
    const svg = buildQrSvg(data, style)
    return sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer()
  },

  async generateQrPdf(data: string, style: Partial<QrStyle> = {}, title?: string): Promise<Buffer> {
    // Растеризуем в PNG, затем встраиваем в PDF
    const pngBuffer = await this.generateQrPng(data, style, 600)

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 })
      const chunks: Buffer[] = []

      doc.on('data', chunk => chunks.push(chunk as Buffer))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // A4: 595.28 × 841.89 pt
      const pageWidth = 595.28
      const imgSize = 400
      const x = (pageWidth - imgSize) / 2

      if (title) {
        doc.fontSize(18).fillColor('#1f2937').text(title, { align: 'center' })
        doc.moveDown(1.5)
        doc.image(pngBuffer, x, doc.y, { width: imgSize, height: imgSize })
      }
      else {
        const y = (841.89 - imgSize) / 2
        doc.image(pngBuffer, x, y, { width: imgSize, height: imgSize })
      }

      doc.end()
    })
  },
}
