import { describe, expect, it } from 'vitest'
import { toV1Destination, toV1Folder, toV1Tag } from './contracts'

describe('v1 contracts mappers', () => {
  const createdAt = new Date('2026-04-20T09:00:00.000Z')
  const updatedAt = new Date('2026-04-20T10:00:00.000Z')

  it('maps folder with required updated_at and qr_count', () => {
    const result = toV1Folder({
      id: 'a7f0b5e7-46a3-4ef4-aeb8-35757f0db89e',
      name: 'Folder',
      parentId: null,
      color: '#ffffff',
      createdBy: 'b4de22d5-af9c-47a8-b5cb-67e5683e90da',
      createdAt,
      updatedAt,
      qrCount: 3,
    })

    expect(result).toMatchObject({
      created_at: createdAt,
      updated_at: updatedAt,
      qr_count: 3,
    })
  })

  it('normalizes missing updatedAt to createdAt for tags', () => {
    const result = toV1Tag({
      id: '4d5d1503-11f8-44a5-a16e-ed813fd0aa2b',
      name: 'Tag',
      color: null,
      createdAt,
      updatedAt: undefined,
      qrCount: 1,
    })

    expect(result.updated_at).toEqual(createdAt)
  })

  it('maps destination with normalized updated_at', () => {
    const result = toV1Destination({
      id: '95dc5a55-e4d0-4f66-b5f8-12f3d6b70d34',
      qrCodeId: 'cc811ba8-d674-42f4-8cf4-f74f0b6f4a9d',
      url: 'https://example.com',
      label: 'Primary',
      weight: 100,
      isActive: true,
      createdAt,
    })

    expect(result).toMatchObject({
      created_at: createdAt,
      updated_at: createdAt,
      is_active: true,
    })
  })
})
