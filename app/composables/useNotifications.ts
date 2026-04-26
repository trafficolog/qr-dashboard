type NotificationType = 'team' | 'security' | 'system'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  description: string
  createdAt: string
  read: boolean
}

const mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    type: 'team',
    title: 'Новый участник приглашён',
    description: 'Пользователь alex@example.com добавлен в рабочее пространство.',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    type: 'security',
    title: 'Создан API-ключ',
    description: 'Сгенерирован новый ключ интеграции с доступом mcp:access.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: false,
  },
  {
    id: 'n3',
    type: 'system',
    title: 'Импорт CSV завершён',
    description: 'Успешно импортировано 124 QR-кода.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    read: true,
  },
]

export function useNotifications() {
  const notifications = useState<NotificationItem[]>('notifications:list', () => [...mockNotifications])
  const unreadCount = computed(() => notifications.value.filter(item => !item.read).length)

  function markAsRead(id: string) {
    notifications.value = notifications.value.map(item => item.id === id ? { ...item, read: true } : item)
  }

  function markAllAsRead() {
    notifications.value = notifications.value.map(item => ({ ...item, read: true }))
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  }
}
