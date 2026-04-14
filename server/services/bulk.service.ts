import { ilike, eq } from 'drizzle-orm'
import { db } from '../db'
import { folders, tags, qrCodes, qrTags } from '../db/schema'
import { generateShortCode } from '../utils/nanoid'
import type { User } from '~~/types/auth'

const DEFAULT_STYLE = {
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
  moduleStyle: 'square',
  cornerStyle: 'square',
  errorCorrectionLevel: 'M',
}

export interface BulkRow {
  title: string
  destinationUrl: string
  description?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  expiresAt?: string
  folderName?: string
  tagNames?: string[]
}

export interface BulkRowError {
  row: number
  field: string
  message: string
}

export interface BulkValidationResult {
  valid: (BulkRow & { rowIndex: number })[]
  errors: BulkRowError[]
}

export interface ParsedCsvRow {
  [key: string]: string
}

export const bulkService = {
  /**
   * Validate a list of raw parsed CSV rows.
   * Client sends plain objects with snake_case keys from the CSV headers.
   */
  validateRows(rows: ParsedCsvRow[]): BulkValidationResult {
    const valid: (BulkRow & { rowIndex: number })[] = []
    const errors: BulkRowError[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!
      const rowNum = i + 2 // header = row 1, data starts at 2
      const rowErrors: BulkRowError[] = []

      const title = row.title?.trim()
      const destinationUrl = (row.destination_url || row.destinationUrl || row.url)?.trim()

      if (!title) {
        rowErrors.push({ row: rowNum, field: 'title', message: 'Название обязательно' })
      }

      if (!destinationUrl) {
        rowErrors.push({ row: rowNum, field: 'destination_url', message: 'URL обязателен' })
      }
      else {
        try {
          new URL(destinationUrl)
        }
        catch {
          rowErrors.push({ row: rowNum, field: 'destination_url', message: 'Некорректный URL' })
        }
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
        continue
      }

      const tagNames = (row.tags || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      valid.push({
        rowIndex: rowNum,
        title: title!,
        destinationUrl: destinationUrl!,
        description: row.description?.trim() || undefined,
        utmSource: row.utm_source?.trim() || undefined,
        utmMedium: row.utm_medium?.trim() || undefined,
        utmCampaign: row.utm_campaign?.trim() || undefined,
        utmContent: row.utm_content?.trim() || undefined,
        expiresAt: row.expires_at?.trim() || undefined,
        folderName: row.folder?.trim() || undefined,
        tagNames,
      })
    }

    return { valid, errors }
  },

  /**
   * Create QR codes in bulk. Returns counts and per-row errors.
   */
  async bulkCreate(validRows: (BulkRow & { rowIndex: number })[], user: User) {
    // Pre-resolve folder names → ids
    const folderNameSet = new Set(validRows.map(r => r.folderName).filter(Boolean) as string[])
    const folderMap = new Map<string, string>()

    for (const name of folderNameSet) {
      const found = await db.query.folders.findFirst({
        where: ilike(folders.name, name),
        columns: { id: true, createdBy: true },
      })
      // Only use folders owned by this user or admin
      if (found && (user.role === 'admin' || found.createdBy === user.id)) {
        folderMap.set(name.toLowerCase(), found.id)
      }
    }

    // Pre-resolve tag names → ids (create if missing)
    const tagNameSet = new Set(validRows.flatMap(r => r.tagNames ?? []))
    const tagMap = new Map<string, string>()

    for (const name of tagNameSet) {
      const existing = await db.query.tags.findFirst({
        where: ilike(tags.name, name),
        columns: { id: true },
      })
      if (existing) {
        tagMap.set(name.toLowerCase(), existing.id)
      }
      else {
        const [created] = await db.insert(tags).values({ name }).returning()
        if (created) tagMap.set(name.toLowerCase(), created.id)
      }
    }

    let created = 0
    const errors: BulkRowError[] = []

    for (const row of validRows) {
      try {
        // Generate unique shortCode
        let shortCode = ''
        for (let attempt = 0; attempt < 3; attempt++) {
          const candidate = generateShortCode()
          const exists = await db.query.qrCodes.findFirst({
            where: eq(qrCodes.shortCode, candidate),
            columns: { id: true },
          })
          if (!exists) {
            shortCode = candidate
            break
          }
        }

        if (!shortCode) {
          errors.push({ row: row.rowIndex, field: 'general', message: 'Не удалось сгенерировать уникальный код' })
          continue
        }

        const utmParams: Record<string, string> = {}
        if (row.utmSource) utmParams.utm_source = row.utmSource
        if (row.utmMedium) utmParams.utm_medium = row.utmMedium
        if (row.utmCampaign) utmParams.utm_campaign = row.utmCampaign
        if (row.utmContent) utmParams.utm_content = row.utmContent

        const [qr] = await db
          .insert(qrCodes)
          .values({
            shortCode,
            title: row.title,
            description: row.description,
            type: 'dynamic',
            destinationUrl: row.destinationUrl,
            style: DEFAULT_STYLE,
            utmParams: Object.keys(utmParams).length > 0 ? utmParams : undefined,
            folderId: row.folderName ? folderMap.get(row.folderName.toLowerCase()) : undefined,
            createdBy: user.id,
            expiresAt: row.expiresAt ? new Date(row.expiresAt) : null,
          })
          .returning()

        // Attach tags
        const tagIds = (row.tagNames ?? [])
          .map(t => tagMap.get(t.toLowerCase()))
          .filter(Boolean) as string[]

        if (tagIds.length && qr) {
          await db.insert(qrTags).values(tagIds.map(tagId => ({ qrCodeId: qr.id, tagId })))
        }

        created++
      }
      catch {
        errors.push({ row: row.rowIndex, field: 'general', message: 'Ошибка при создании' })
      }
    }

    return { created, failed: errors.length, errors }
  },

  /**
   * Generate a CSV template as a string.
   */
  generateTemplate(): string {
    const headers = [
      'title',
      'destination_url',
      'description',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'expires_at',
      'folder',
      'tags',
    ]
    const example = [
      'Промо-акция лето 2025',
      'https://splat.ru/promo/summer',
      'QR для упаковки крема',
      'qr-code',
      'packaging',
      'summer2025',
      '',
      '',
      'Рекламные материалы',
      'promo,summer',
    ]
    return [headers.join(','), example.join(',')].join('\n')
  },
}
