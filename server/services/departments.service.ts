import { and, asc, eq, inArray, ne } from 'drizzle-orm'
import { db } from '../db'
import { departments, userDepartments, users } from '../db/schema'

type DepartmentRole = 'member' | 'head'

interface UpsertDepartmentInput {
  name: string
  slug: string
  description?: string | null
  color?: string | null
  headUserId?: string | null
}

interface MembershipInput {
  userId: string
  role: DepartmentRole
}

async function getDepartmentOrThrow(id: string) {
  const department = await db.query.departments.findFirst({ where: eq(departments.id, id) })
  if (!department) {
    throw createError({ statusCode: 404, message: 'Подразделение не найдено' })
  }
  return department
}

export const departmentsService = {
  async list() {
    const rows = await db.query.departments.findMany({
      with: {
        head: { columns: { id: true, email: true, name: true } },
        memberships: {
          columns: { role: true, joinedAt: true },
          with: {
            user: { columns: { id: true, email: true, name: true, role: true } },
          },
        },
      },
      orderBy: asc(departments.name),
    })

    return rows.map(row => ({
      ...row,
      memberCount: row.memberships.length,
      members: row.memberships.map(m => ({
        userId: m.user.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      memberships: undefined,
    }))
  },

  async create(input: UpsertDepartmentInput) {
    const existingBySlug = await db.query.departments.findFirst({
      where: eq(departments.slug, input.slug),
      columns: { id: true },
    })

    if (existingBySlug) {
      throw createError({ statusCode: 409, message: 'Подразделение с таким slug уже существует' })
    }

    if (input.headUserId) {
      const headExists = await db.query.users.findFirst({ where: eq(users.id, input.headUserId), columns: { id: true } })
      if (!headExists) {
        throw createError({ statusCode: 422, message: 'Руководитель не найден' })
      }
    }

    const [created] = await db
      .insert(departments)
      .values({
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        color: input.color || null,
        headUserId: input.headUserId || null,
      })
      .returning()

    return created!
  },

  async update(id: string, input: Partial<UpsertDepartmentInput>) {
    await getDepartmentOrThrow(id)

    if (input.slug) {
      const duplicate = await db.query.departments.findFirst({
        where: and(eq(departments.slug, input.slug), ne(departments.id, id)),
        columns: { id: true },
      })

      if (duplicate) {
        throw createError({ statusCode: 409, message: 'Подразделение с таким slug уже существует' })
      }
    }

    if (input.headUserId) {
      const headExists = await db.query.users.findFirst({ where: eq(users.id, input.headUserId), columns: { id: true } })
      if (!headExists) {
        throw createError({ statusCode: 422, message: 'Руководитель не найден' })
      }
    }

    const [updated] = await db
      .update(departments)
      .set({
        name: input.name,
        slug: input.slug,
        description: input.description,
        color: input.color,
        headUserId: input.headUserId,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, id))
      .returning()

    return updated!
  },

  async remove(id: string) {
    await getDepartmentOrThrow(id)
    await db.delete(departments).where(eq(departments.id, id))
  },

  async setMembers(departmentId: string, members: MembershipInput[]) {
    await getDepartmentOrThrow(departmentId)

    const uniqueUserIds = [...new Set(members.map(m => m.userId))]

    if (uniqueUserIds.length) {
      const existingUsers = await db.query.users.findMany({
        where: inArray(users.id, uniqueUserIds),
        columns: { id: true },
      })

      if (existingUsers.length !== uniqueUserIds.length) {
        throw createError({ statusCode: 422, message: 'Некоторые участники не найдены' })
      }
    }

    await db.transaction(async (tx) => {
      await tx.delete(userDepartments).where(eq(userDepartments.departmentId, departmentId))

      if (members.length) {
        await tx.insert(userDepartments).values(
          members.map(m => ({
            departmentId,
            userId: m.userId,
            role: m.role,
          })),
        )
      }
    })

    return this.list()
  },
}
