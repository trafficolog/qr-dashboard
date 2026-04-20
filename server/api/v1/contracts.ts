export interface V1TimestampedEntity {
  createdAt: Date
  updatedAt?: Date | null
}

export interface V1FolderEntity extends V1TimestampedEntity {
  id: string
  name: string
  parentId: string | null
  color: string | null
  createdBy: string
  qrCount?: number
}

export interface V1TagEntity extends V1TimestampedEntity {
  id: string
  name: string
  color: string | null
  qrCount?: number
}

export interface V1DestinationEntity extends V1TimestampedEntity {
  id: string
  qrCodeId: string
  url: string
  label: string | null
  weight: number
  isActive: boolean
}

function normalizeUpdatedAt<T extends V1TimestampedEntity>(entity: T): Date {
  return entity.updatedAt ?? entity.createdAt
}

export function toV1Folder(folder: V1FolderEntity) {
  return {
    id: folder.id,
    name: folder.name,
    parent_id: folder.parentId,
    color: folder.color,
    created_by: folder.createdBy,
    created_at: folder.createdAt,
    updated_at: normalizeUpdatedAt(folder),
    ...(folder.qrCount !== undefined ? { qr_count: folder.qrCount } : {}),
  }
}

export function toV1Tag(tag: V1TagEntity) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    created_at: tag.createdAt,
    updated_at: normalizeUpdatedAt(tag),
    ...(tag.qrCount !== undefined ? { qr_count: tag.qrCount } : {}),
  }
}

export function toV1Destination(destination: V1DestinationEntity) {
  return {
    id: destination.id,
    qr_code_id: destination.qrCodeId,
    url: destination.url,
    label: destination.label,
    weight: destination.weight,
    is_active: destination.isActive,
    created_at: destination.createdAt,
    updated_at: normalizeUpdatedAt(destination),
  }
}
