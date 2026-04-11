import QRCode from 'qrcode'
import type { QrStyle } from '~/types/qr'

const DEFAULT_STYLE: Required<Pick<QrStyle, 'foregroundColor' | 'backgroundColor' | 'moduleStyle' | 'cornerStyle' | 'errorCorrectionLevel'>> = {
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
  moduleStyle: 'square',
  cornerStyle: 'square',
  errorCorrectionLevel: 'M',
}

/**
 * Generate QR code matrix using qrcode library
 */
function generateMatrix(data: string, errorCorrectionLevel: string): boolean[][] {
  const qr = QRCode.create(data, {
    errorCorrectionLevel: errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H',
  })

  const size = qr.modules.size
  const matrix: boolean[][] = []

  for (let row = 0; row < size; row++) {
    const rowData: boolean[] = []
    for (let col = 0; col < size; col++) {
      rowData.push(qr.modules.get(row, col) === 1)
    }
    matrix.push(rowData)
  }

  return matrix
}

/**
 * Check if a module is part of a finder pattern (eye)
 */
function isFinderPattern(row: number, col: number, size: number): boolean {
  // Top-left
  if (row < 7 && col < 7) return true
  // Top-right
  if (row < 7 && col >= size - 7) return true
  // Bottom-left
  if (row >= size - 7 && col < 7) return true
  return false
}

/**
 * Render a single module based on style
 */
function renderModule(
  x: number,
  y: number,
  cellSize: number,
  moduleStyle: string,
  color: string,
): string {
  const s = cellSize

  switch (moduleStyle) {
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

    case 'square':
    default:
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${color}"/>`
  }
}

/**
 * Render finder pattern (eye) with specified corner style
 */
function renderFinderPattern(
  startX: number,
  startY: number,
  cellSize: number,
  cornerStyle: string,
  color: string,
  cornerColor?: string,
): string {
  const c = cornerColor || color
  const s = cellSize
  const outerSize = 7 * s
  const innerSize = 3 * s
  const middleSize = 5 * s

  let svg = ''

  switch (cornerStyle) {
    case 'rounded': {
      const or = s * 1.5
      const mr = s
      const ir = s * 0.8
      svg += `<rect x="${startX}" y="${startY}" width="${outerSize}" height="${outerSize}" rx="${or}" fill="${c}"/>`
      svg += `<rect x="${startX + s}" y="${startY + s}" width="${middleSize}" height="${middleSize}" rx="${mr}" fill="white"/>`
      svg += `<rect x="${startX + 2 * s}" y="${startY + 2 * s}" width="${innerSize}" height="${innerSize}" rx="${ir}" fill="${c}"/>`
      break
    }

    case 'dot': {
      const outerR = outerSize / 2
      const middleR = middleSize / 2
      const innerR = innerSize / 2
      const cx = startX + outerR
      const cy = startY + outerR
      svg += `<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${c}"/>`
      svg += `<circle cx="${cx}" cy="${cy}" r="${middleR}" fill="white"/>`
      svg += `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="${c}"/>`
      break
    }

    case 'extra-rounded': {
      const or = s * 2.5
      const mr = s * 1.5
      const ir = s
      svg += `<rect x="${startX}" y="${startY}" width="${outerSize}" height="${outerSize}" rx="${or}" fill="${c}"/>`
      svg += `<rect x="${startX + s}" y="${startY + s}" width="${middleSize}" height="${middleSize}" rx="${mr}" fill="white"/>`
      svg += `<rect x="${startX + 2 * s}" y="${startY + 2 * s}" width="${innerSize}" height="${innerSize}" rx="${ir}" fill="${c}"/>`
      break
    }

    case 'square':
    default:
      svg += `<rect x="${startX}" y="${startY}" width="${outerSize}" height="${outerSize}" fill="${c}"/>`
      svg += `<rect x="${startX + s}" y="${startY + s}" width="${middleSize}" height="${middleSize}" fill="white"/>`
      svg += `<rect x="${startX + 2 * s}" y="${startY + 2 * s}" width="${innerSize}" height="${innerSize}" fill="${c}"/>`
      break
  }

  return svg
}

/**
 * Main function: generate complete QR SVG string
 */
export function generateQrSvg(data: string, style: Partial<QrStyle> = {}): string {
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
  const margin = 4 * cellSize // quiet zone
  const svgSize = size * cellSize + margin * 2

  let modules = ''

  // Render data modules (skip finder patterns)
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!matrix[row]![col]) continue
      if (isFinderPattern(row, col, size)) continue

      const x = margin + col * cellSize
      const y = margin + row * cellSize
      modules += renderModule(x, y, cellSize, moduleStyle, foregroundColor)
    }
  }

  // Render finder patterns
  const eyes = [
    { row: 0, col: 0 },       // Top-left
    { row: 0, col: size - 7 }, // Top-right
    { row: size - 7, col: 0 }, // Bottom-left
  ]

  let eyeSvg = ''
  for (const eye of eyes) {
    const x = margin + eye.col * cellSize
    const y = margin + eye.row * cellSize
    eyeSvg += renderFinderPattern(x, y, cellSize, cornerStyle, foregroundColor, cornerColor)
  }

  // Logo overlay area (center, white background)
  let logoSvg = ''
  if (style.logo?.url) {
    const logoSizeRatio = style.logo.size || 0.2
    const logoPixelSize = size * cellSize * logoSizeRatio
    const logoPadding = style.logo.padding || 5
    const logoX = margin + (size * cellSize - logoPixelSize) / 2
    const logoY = margin + (size * cellSize - logoPixelSize) / 2
    const br = style.logo.borderRadius || 4

    // White background behind logo
    logoSvg += `<rect x="${logoX - logoPadding}" y="${logoY - logoPadding}" width="${logoPixelSize + logoPadding * 2}" height="${logoPixelSize + logoPadding * 2}" rx="${br}" fill="${backgroundColor}"/>`
    logoSvg += `<image href="${style.logo.url}" x="${logoX}" y="${logoY}" width="${logoPixelSize}" height="${logoPixelSize}" preserveAspectRatio="xMidYMid slice" clip-path="inset(0 round ${br}px)"/>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" shape-rendering="crispEdges">
  <rect width="${svgSize}" height="${svgSize}" fill="${backgroundColor}"/>
  ${eyeSvg}
  ${modules}
  ${logoSvg}
</svg>`
}

/**
 * Generate data URL for QR SVG (for downloads)
 */
export function qrSvgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
}
