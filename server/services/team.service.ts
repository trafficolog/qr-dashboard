import { eq, count, sql } from 'drizzle-orm'
import { db } from '../db'
import { users, qrCodes, sessions } from '../db/schema'
import { recordAudit } from '../utils/audit'
import type { User } from '#shared/types/auth'

export const teamService = {
  /**
   * Список всех пользователей с количеством QR-кодов.
   * Доступно только admin.
   */
  async list() {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        avatarUrl: users.avatarUrl,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        qrCount: sql<number>`(
          SELECT COUNT(*) FROM ${qrCodes} WHERE ${qrCodes.createdBy} = ${users.id}
        )`.mapWith(Number),
      })
      .from(users)
      .orderBy(users.createdAt)

    return rows
  },

  /**
   * Создать нового пользователя (invite).
   * Если уже существует — 409.
   */
  async invite(email: string, role: 'admin' | 'editor' | 'viewer', currentUser?: User) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
      columns: { id: true },
    })

    if (existing) {
      throw createError({
        statusCode: 409,
        message: 'Пользователь с таким email уже существует',
      })
    }

    const [created] = await db
      .insert(users)
      .values({ email: email.toLowerCase(), role })
      .returning()

    recordAudit(
      {
        userId: currentUser?.id ?? null,
        action: 'team.invite',
        entityType: 'user',
        entityId: created!.id,
      },
      { details: { invitedBy: currentUser?.id ?? null, role } },
    )

    return created!
  },

  /**
   * Изменить роль пользователя.
   * Нельзя снять роль admin если он последний.
   */
  async updateRole(
    id: string,
    newRole: 'admin' | 'editor' | 'viewer',
    currentUser: User,
  ) {
    const target = await db.query.users.findFirst({
      where: eq(users.id, id),
    })

    if (!target) {
      throw createError({ statusCode: 404, message: 'Пользователь не найден' })
    }

    // Guard: cannot demote the last admin
    if (target.role === 'admin' && newRole !== 'admin') {
      const [adminCount] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, 'admin'))

      if (adminCount!.count <= 1) {
        throw createError({
          statusCode: 422,
          message: 'Нельзя снять права у единственного администратора',
        })
      }
    }

    // Guard: cannot change own role
    if (target.id === currentUser.id) {
      throw createError({
        statusCode: 422,
        message: 'Нельзя изменить собственную роль',
      })
    }

    const [updated] = await db
      .update(users)
      .set({ role: newRole, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()

    // Invalidate target user sessions so permissions are refreshed on next request.
    await db.delete(sessions).where(eq(sessions.userId, id))

    recordAudit(
      {
        userId: currentUser.id,
        action: 'team.role_change',
        entityType: 'user',
        entityId: id,
      },
      { details: { oldRole: target.role, newRole } },
    )

    return updated!
  },

  /**
   * Удалить пользователя.
   * Нельзя удалить последнего admin или самого себя.
   * QR-коды переназначаются текущему admin (FK не CASCADE).
   */
  async remove(id: string, currentUser: User) {
    const target = await db.query.users.findFirst({
      where: eq(users.id, id),
    })

    if (!target) {
      throw createError({ statusCode: 404, message: 'Пользователь не найден' })
    }

    if (target.id === currentUser.id) {
      throw createError({
        statusCode: 422,
        message: 'Нельзя удалить собственный аккаунт',
      })
    }

    if (target.role === 'admin') {
      const [adminCount] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, 'admin'))

      if (adminCount!.count <= 1) {
        throw createError({
          statusCode: 422,
          message: 'Нельзя удалить единственного администратора',
        })
      }
    }

    // Reassign QR codes to the deleting admin to avoid FK violation
    await db
      .update(qrCodes)
      .set({ createdBy: currentUser.id })
      .where(eq(qrCodes.createdBy, id))

    // Delete all sessions for the user
    await db.delete(sessions).where(eq(sessions.userId, id))

    await db.delete(users).where(eq(users.id, id))

    recordAudit(
      {
        userId: currentUser.id,
        action: 'team.delete_user',
        entityType: 'user',
        entityId: id,
      },
      { details: { deletedEmail: target.email, deletedRole: target.role } },
    )
  },

  /**
   * Подсчёт администраторов (для UI-подсказок).
   */
  async adminCount() {
    const [row] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'admin'))
    return row!.count
  },
}
