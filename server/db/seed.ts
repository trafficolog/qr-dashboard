import 'dotenv/config'
import { randomUUID, createHash } from 'node:crypto'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { and, eq, inArray } from 'drizzle-orm'
import * as schema from './schema'

const {
  users,
  allowedDomains,
  folders,
  tags,
  qrCodes,
  qrTags,
  scanEvents,
  departments,
  userDepartments,
} = schema

// --- Config ---
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://splat_qr:secret@localhost:5432/splat_qr'

const pool = new pg.Pool({ connectionString: DATABASE_URL })
const db = drizzle(pool, { schema })

// --- Helpers ---
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function weightedRandom<T>(items: { value: T, weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item.value
  }
  return items[items.length - 1]!.value
}

function randomDate(daysBack: number): Date {
  const now = Date.now()
  const past = now - daysBack * 24 * 60 * 60 * 1000
  return new Date(past + Math.random() * (now - past))
}

function randomHourBiased(): number {
  // Пик 10:00-18:00 МСК
  const hour = Math.round(10 + Math.random() * 8 + (Math.random() - 0.5) * 6)
  return Math.max(0, Math.min(23, hour))
}

// --- Seed ---
async function seed() {
  console.log('🌱 Starting seed...')
  // 1. Allowed domain
  console.log('  → Allowed domains...')
  const domain = await db.query.allowedDomains.findFirst({
    where: eq(allowedDomains.domain, 'splat.com'),
    columns: { id: true },
  })
  if (!domain) {
    await db.insert(allowedDomains).values({
      id: randomUUID(),
      domain: 'splat.com',
      isActive: true,
    })
  }

  // 2. Users
  console.log('  → Users...')
  const userDefs = [
    { email: 'admin@splat.com', name: 'Администратор', role: 'admin' as const },
    { email: 'editor.marketing@splat.com', name: 'Маркетолог', role: 'editor' as const },
    { email: 'editor.sales@splat.com', name: 'Менеджер продаж', role: 'editor' as const },
    { email: 'viewer.hr@splat.com', name: 'HR Наблюдатель', role: 'viewer' as const },
  ]

  const userIdsByEmail = new Map<string, string>()
  for (const userDef of userDefs) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, userDef.email),
      columns: { id: true },
    })

    if (existingUser) {
      userIdsByEmail.set(userDef.email, existingUser.id)
      await db
        .update(users)
        .set({ name: userDef.name, role: userDef.role, lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, existingUser.id))
      continue
    }

    const userId = randomUUID()
    await db.insert(users).values({
      id: userId,
      email: userDef.email,
      name: userDef.name,
      role: userDef.role,
      lastLoginAt: new Date(),
    })
    userIdsByEmail.set(userDef.email, userId)
  }

  const adminId = userIdsByEmail.get('admin@splat.com')!
  const marketingEditorId = userIdsByEmail.get('editor.marketing@splat.com')!
  const salesEditorId = userIdsByEmail.get('editor.sales@splat.com')!
  const hrViewerId = userIdsByEmail.get('viewer.hr@splat.com')!

  // 3. Folders
  console.log('  → Folders...')
  const folderDefs = [
    { name: 'Упаковка', color: '#4CAF50' },
    { name: 'Рекламные материалы', color: '#2196F3' },
    { name: 'Мероприятия', color: '#FF9800' },
  ] as const

  const folderIds: string[] = []
  for (const f of folderDefs) {
    const existingFolder = await db.query.folders.findFirst({
      where: eq(folders.name, f.name),
      columns: { id: true },
    })
    const id = existingFolder?.id ?? randomUUID()
    folderIds.push(id)

    if (existingFolder) {
      await db
        .update(folders)
        .set({ color: f.color, createdBy: adminId })
        .where(eq(folders.id, existingFolder.id))
    }
    else {
      await db.insert(folders).values({
        id,
        name: f.name,
        color: f.color,
        createdBy: adminId,
      })
    }
  }

  // 4. Tags
  console.log('  → Tags...')
  const tagDefs = [
    { name: 'paste', color: '#E8F5E9' },
    { name: 'rinse', color: '#E3F2FD' },
    { name: 'brush', color: '#FFF3E0' },
    { name: 'promo', color: '#FCE4EC' },
    { name: 'event', color: '#F3E5F5' },
    { name: 'packaging', color: '#E0F2F1' },
  ]

  const tagIds: string[] = []
  for (const t of tagDefs) {
    const existingTag = await db.query.tags.findFirst({
      where: eq(tags.name, t.name),
      columns: { id: true },
    })
    const id = existingTag?.id ?? randomUUID()
    tagIds.push(id)

    if (existingTag) {
      await db.update(tags).set({ color: t.color }).where(eq(tags.id, existingTag.id))
    }
    else {
      await db.insert(tags).values({ id, name: t.name, color: t.color })
    }
  }

  // 5. Departments and memberships
  console.log('  → Departments...')
  const departmentDefs = [
    {
      name: 'Marketing',
      slug: 'marketing',
      description: 'Команда маркетинговых кампаний',
      color: '#7C4DFF',
      headUserId: marketingEditorId,
      members: [
        { userId: marketingEditorId, role: 'head' as const },
        { userId: adminId, role: 'member' as const },
      ],
    },
    {
      name: 'Sales',
      slug: 'sales',
      description: 'Команда продаж и партнёрств',
      color: '#00ACC1',
      headUserId: salesEditorId,
      members: [
        { userId: salesEditorId, role: 'head' as const },
        { userId: adminId, role: 'member' as const },
      ],
    },
    {
      name: 'HR',
      slug: 'hr',
      description: 'Команда рекрутинга и развития',
      color: '#FF7043',
      headUserId: hrViewerId,
      members: [
        { userId: hrViewerId, role: 'head' as const },
        { userId: adminId, role: 'member' as const },
      ],
    },
  ]

  const departmentIdsBySlug = new Map<string, string>()

  for (const departmentDef of departmentDefs) {
    const existingDepartment = await db.query.departments.findFirst({
      where: eq(departments.slug, departmentDef.slug),
      columns: { id: true },
    })

    const departmentId = existingDepartment?.id ?? randomUUID()
    departmentIdsBySlug.set(departmentDef.slug, departmentId)

    if (existingDepartment) {
      await db
        .update(departments)
        .set({
          name: departmentDef.name,
          description: departmentDef.description,
          color: departmentDef.color,
          headUserId: departmentDef.headUserId,
          updatedAt: new Date(),
        })
        .where(eq(departments.id, existingDepartment.id))
    }
    else {
      await db.insert(departments).values({
        id: departmentId,
        name: departmentDef.name,
        slug: departmentDef.slug,
        description: departmentDef.description,
        color: departmentDef.color,
        headUserId: departmentDef.headUserId,
      })
    }

    for (const member of departmentDef.members) {
      const existingMembership = await db.query.userDepartments.findFirst({
        where: and(
          eq(userDepartments.userId, member.userId),
          eq(userDepartments.departmentId, departmentId),
        ),
        columns: { userId: true },
      })

      if (existingMembership) {
        await db
          .update(userDepartments)
          .set({ role: member.role })
          .where(
            and(
              eq(userDepartments.userId, member.userId),
              eq(userDepartments.departmentId, departmentId),
            ),
          )
      }
      else {
        await db.insert(userDepartments).values({
          userId: member.userId,
          departmentId,
          role: member.role,
        })
      }
    }
  }

  // 6. QR codes
  console.log('  → QR codes...')
  const qrDefs = [
    {
      shortCode: 'seedPriv1',
      title: 'SPLAT Special — зубная паста',
      url: 'https://splat.ru/special',
      folderId: folderIds[0]!,
      tagIdxs: [0, 5],
      status: 'active' as const,
      createdBy: adminId,
      visibility: 'private' as const,
      departmentId: null,
      style: { foregroundColor: '#2E7D32', backgroundColor: '#FFFFFF', moduleStyle: 'square', cornerStyle: 'square', errorCorrectionLevel: 'M' },
    },
    {
      shortCode: 'seedPubl1',
      title: 'Ополаскиватель SPLAT Active',
      url: 'https://splat.ru/rinse/active',
      folderId: folderIds[0]!,
      tagIdxs: [1, 5],
      status: 'active' as const,
      createdBy: adminId,
      visibility: 'public' as const,
      departmentId: null,
      style: { foregroundColor: '#1565C0', backgroundColor: '#FFFFFF', moduleStyle: 'rounded', cornerStyle: 'rounded', errorCorrectionLevel: 'M' },
    },
    {
      shortCode: 'seedDept1',
      title: 'Зубная щётка SPLAT Complete',
      url: 'https://splat.ru/brush/complete',
      folderId: folderIds[0]!,
      tagIdxs: [2, 5],
      status: 'active' as const,
      createdBy: marketingEditorId,
      visibility: 'department' as const,
      departmentId: departmentIdsBySlug.get('marketing')!,
      style: { foregroundColor: '#000000', backgroundColor: '#FFFFFF', moduleStyle: 'dots', cornerStyle: 'dot', errorCorrectionLevel: 'M' },
    },
    {
      shortCode: 'seedDept2',
      title: 'Промо-акция Лето 2025',
      url: 'https://splat.ru/promo/summer2025',
      folderId: folderIds[1]!,
      tagIdxs: [3],
      status: 'active' as const,
      createdBy: salesEditorId,
      visibility: 'department' as const,
      departmentId: departmentIdsBySlug.get('sales')!,
      style: { foregroundColor: '#E65100', backgroundColor: '#FFF8E1', moduleStyle: 'classy', cornerStyle: 'extra-rounded', errorCorrectionLevel: 'M' },
    },
    {
      shortCode: 'seedPubl2',
      title: 'Баннер на выставке',
      url: 'https://splat.ru/expo2025',
      folderId: folderIds[1]!,
      tagIdxs: [3, 4],
      status: 'active' as const,
      createdBy: adminId,
      visibility: 'public' as const,
      departmentId: null,
      style: { foregroundColor: '#4A148C', backgroundColor: '#FFFFFF', moduleStyle: 'classy-rounded', cornerStyle: 'rounded', errorCorrectionLevel: 'M' },
    },
    {
      shortCode: 'seedPriv2',
      title: 'Конференция Dental Forum',
      url: 'https://splat.ru/dental-forum',
      folderId: folderIds[2]!,
      tagIdxs: [4],
      status: 'active' as const,
      createdBy: hrViewerId,
      visibility: 'private' as const,
      departmentId: null,
      style: { foregroundColor: '#1B5E20', backgroundColor: '#F1F8E9', moduleStyle: 'rounded', cornerStyle: 'square', errorCorrectionLevel: 'M' },
    },
    {
      shortCode: 'seedDept3',
      title: 'Детская линейка SPLAT Kids',
      url: 'https://splat.ru/kids',
      folderId: folderIds[0]!,
      tagIdxs: [0, 3],
      status: 'paused' as const,
      createdBy: hrViewerId,
      visibility: 'department' as const,
      departmentId: departmentIdsBySlug.get('hr')!,
      style: { foregroundColor: '#FF6F00', backgroundColor: '#FFFFFF', moduleStyle: 'dots', cornerStyle: 'extra-rounded', errorCorrectionLevel: 'M' },
    },
    {
      shortCode: 'seedPriv3',
      title: 'Старая акция 2024',
      url: 'https://splat.ru/promo/old',
      folderId: folderIds[1]!,
      tagIdxs: [3],
      status: 'expired' as const,
      createdBy: adminId,
      visibility: 'private' as const,
      departmentId: null,
      style: { foregroundColor: '#616161', backgroundColor: '#FAFAFA', moduleStyle: 'square', cornerStyle: 'square', errorCorrectionLevel: 'M' },
    },
    {
      shortCode: 'seedDept4',
      title: 'SPLAT Professional White Plus',
      url: 'https://splat.ru/professional/white-plus',
      folderId: folderIds[0]!,
      tagIdxs: [0, 5],
      status: 'active' as const,
      createdBy: marketingEditorId,
      visibility: 'department' as const,
      departmentId: departmentIdsBySlug.get('marketing')!,
      style: { foregroundColor: '#0D47A1', backgroundColor: '#E3F2FD', moduleStyle: 'classy-rounded', cornerStyle: 'dot', errorCorrectionLevel: 'H' },
    },
    {
      shortCode: 'seedPubl3',
      title: 'Мастер-класс гигиена полости рта',
      url: 'https://splat.ru/events/masterclass',
      folderId: folderIds[2]!,
      tagIdxs: [4, 2],
      status: 'active' as const,
      createdBy: salesEditorId,
      visibility: 'public' as const,
      departmentId: null,
      style: { foregroundColor: '#2E7D32', backgroundColor: '#FFFFFF', moduleStyle: 'rounded', cornerStyle: 'rounded', errorCorrectionLevel: 'M' },
    },
  ]

  const qrIds: string[] = []
  const qrWeights: number[] = [] // for scan distribution

  for (const qr of qrDefs) {
    const existingQr = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.shortCode, qr.shortCode),
      columns: { id: true },
    })
    const id = existingQr?.id ?? randomUUID()
    qrIds.push(id)
    // Popular QRs get more scans
    qrWeights.push(qr.status === 'active' ? Math.floor(Math.random() * 80) + 20 : 5)

    const qrValues = {
      shortCode: qr.shortCode,
      title: qr.title,
      description: `Тестовый QR-код: ${qr.title}`,
      type: 'dynamic' as const,
      status: qr.status,
      visibility: qr.visibility,
      destinationUrl: qr.url,
      style: qr.style,
      folderId: qr.folderId,
      departmentId: qr.departmentId,
      createdBy: qr.createdBy,
      expiresAt: qr.status === 'expired' ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null,
      updatedAt: new Date(),
    }

    if (existingQr) {
      await db.update(qrCodes).set(qrValues).where(eq(qrCodes.id, existingQr.id))
    }
    else {
      await db.insert(qrCodes).values({
        id,
        ...qrValues,
      })
    }

    // Tag associations
    for (const tIdx of qr.tagIdxs) {
      const tagId = tagIds[tIdx]!
      const existingQrTag = await db.query.qrTags.findFirst({
        where: and(eq(qrTags.qrCodeId, id), eq(qrTags.tagId, tagId)),
        columns: { qrCodeId: true },
      })

      if (!existingQrTag) {
        await db.insert(qrTags).values({
          qrCodeId: id,
          tagId,
        })
      }
    }
  }

  // 7. Scan events (400 events over 30 days)
  console.log('  → Scan events (400)...')
  const SCAN_COUNT = 400

  await db.delete(scanEvents).where(inArray(scanEvents.qrCodeId, qrIds))

  const countries = [
    { value: 'RU', weight: 60 },
    { value: 'KZ', weight: 15 },
    { value: 'BY', weight: 10 },
    { value: 'UA', weight: 15 },
  ]

  const cities: Record<string, string[]> = {
    RU: ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород'],
    KZ: ['Алматы', 'Нур-Султан', 'Шымкент'],
    BY: ['Минск', 'Гомель', 'Брест'],
    UA: ['Киев', 'Харьков', 'Одесса', 'Днепр'],
  }

  const devices = [
    { value: 'mobile', weight: 60 },
    { value: 'desktop', weight: 30 },
    { value: 'tablet', weight: 10 },
  ]

  const browsers = [
    { value: 'Chrome', weight: 50 },
    { value: 'Safari', weight: 25 },
    { value: 'Firefox', weight: 10 },
    { value: 'Samsung Internet', weight: 10 },
    { value: 'Edge', weight: 5 },
  ]

  const osList = [
    { value: 'Android', weight: 40 },
    { value: 'iOS', weight: 25 },
    { value: 'Windows', weight: 20 },
    { value: 'macOS', weight: 10 },
    { value: 'Linux', weight: 5 },
  ]

  // Track unique combos per day for isUnique
  const uniqueSet = new Set<string>()

  // Prepare QR weighted selection
  const qrWeightedItems = qrIds.map((id, i) => ({ value: id, weight: qrWeights[i]! }))

  const scanBatch: (typeof scanEvents.$inferInsert)[] = []

  for (let i = 0; i < SCAN_COUNT; i++) {
    const qrCodeId = weightedRandom(qrWeightedItems)
    const country = weightedRandom(countries)
    const cityList = cities[country] || ['Unknown']
    const city = randomFrom(cityList)
    const device = weightedRandom(devices)
    const browser = weightedRandom(browsers)
    const os = weightedRandom(osList)

    const scanDate = randomDate(30)
    scanDate.setHours(randomHourBiased(), Math.floor(Math.random() * 60))

    const fakeIp = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    const fakeUa = `Mozilla/5.0 (${os}; ${device}) ${browser}/1.0`

    // Unique check
    const dateStr = scanDate.toISOString().slice(0, 10)
    const uniqueKey = createHash('sha256')
      .update(`${fakeIp}${fakeUa}${qrCodeId}${dateStr}`)
      .digest('hex')
    const isUnique = !uniqueSet.has(uniqueKey)
    if (isUnique) uniqueSet.add(uniqueKey)

    scanBatch.push({
      id: randomUUID(),
      qrCodeId,
      ipAddress: fakeIp,
      userAgent: fakeUa,
      country,
      city,
      region: city,
      deviceType: device,
      os,
      browser,
      isUnique,
      scannedAt: scanDate,
    })
  }

  // Batch insert in chunks of 100
  for (let i = 0; i < scanBatch.length; i += 100) {
    const chunk = scanBatch.slice(i, i + 100)
    await db.insert(scanEvents).values(chunk)
  }

  // 8. Update QR scan counters
  console.log('  → Updating scan counters...')
  for (const qrId of qrIds) {
    const totalScans = scanBatch.filter(s => s.qrCodeId === qrId).length
    const uniqueScans = scanBatch.filter(s => s.qrCodeId === qrId && s.isUnique).length

    await db
      .update(qrCodes)
      .set({ totalScans, uniqueScans })
      .where(eq(qrCodes.id, qrId))
  }

  console.log(`✅ Seed complete:`)
  console.log(`   • 1 allowed domain`)
  console.log(`   • ${userDefs.length} users (admin/editor/viewer)`)
  console.log(`   • ${folderDefs.length} folders`)
  console.log(`   • ${tagDefs.length} tags`)
  console.log(`   • ${departmentDefs.length} departments`)
  console.log(`   • ${qrDefs.length} QR codes`)
  console.log(`   • ${scanBatch.length} scan events`)

  await pool.end()
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
