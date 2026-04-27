import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { auditLog } from '../../db/schema'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(30),
})

type NotificationType = 'team' | 'security' | 'system'

function mapType(action: string): NotificationType {
  if (action.startsWith('team.')) {
    return 'team'
  }

  if (action.startsWith('auth.') || action.startsWith('api_key.')) {
    return 'security'
  }

  return 'system'
}

function mapTitle(action: string): string {
  const titles: Record<string, string> = {
    'auth.verify': 'Вход подтверждён',
    'auth.logout': 'Выход из аккаунта',
    'api_key.create': 'Создан API-ключ',
    'api_key.delete': 'Удалён API-ключ',
    'api_key.scope_denied': 'Ограничение доступа по API-ключу',
    'team.invite': 'Новое приглашение в команду',
    'team.update_role': 'Обновлена роль участника',
    'team.role_change': 'Изменение роли в команде',
    'team.delete_user': 'Пользователь удалён из команды',
    'qr.create': 'Создан QR-код',
    'qr.update': 'Обновлён QR-код',
    'qr.update_visibility': 'Изменена видимость QR-кода',
    'qr.delete': 'Удалён QR-код',
    'folder.create': 'Создана папка',
    'folder.update': 'Обновлена папка',
    'folder.delete': 'Удалена папка',
  }

  return titles[action] ?? `Событие: ${action}`
}

function mapDescription(action: string, entityType: string, entityId: string | null) {
  if (entityId) {
    return `Действие ${action} выполнено для ${entityType} (${entityId}).`
  }

  return `Действие ${action} выполнено для ${entityType}.`
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = await getValidatedQuery(event, querySchema.parse)

  const items = await db.query.auditLog.findMany({
    where: eq(auditLog.userId, user.id),
    orderBy: [desc(auditLog.createdAt)],
    limit: query.limit,
    columns: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      createdAt: true,
    },
  })

  const notifications = items.map(item => ({
    id: item.id,
    type: mapType(item.action),
    title: mapTitle(item.action),
    description: mapDescription(item.action, item.entityType, item.entityId),
    createdAt: item.createdAt.toISOString(),
    read: false,
  }))

  return apiSuccess(notifications)
})
