import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core'
import { qrCodes } from './qr-codes'
import { tags } from './tags'

export const qrTags = pgTable(
  'qr_tags',
  {
    qrCodeId: uuid('qr_code_id')
      .notNull()
      .references(() => qrCodes.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.qrCodeId, table.tagId] })],
)
