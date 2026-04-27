type NotificationType = 'team' | 'security' | 'system'
type NotificationSeverity = 'success' | 'info' | 'warn'

export interface NotificationItem {
  id: string
  type: NotificationType
  severity: NotificationSeverity
  title: string
  description: string
  createdAt: string
  read: boolean
  deeplink?: string | null
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = []
const NOTIFICATIONS_READ_COOKIE = 'splat-notifications-read'

export function useNotifications() {
  const notifications = useState<NotificationItem[]>('notifications:list', () => [...DEFAULT_NOTIFICATIONS])
  const loading = useState<boolean>('notifications:loading', () => false)
  const unreadCount = computed(() => notifications.value.filter(item => !item.read).length)
  const readIdsCookie = useCookie<string[]>(NOTIFICATIONS_READ_COOKIE, {
    default: () => [],
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    path: '/',
  })

  function getReadIdsSet() {
    return new Set(readIdsCookie.value ?? [])
  }

  function persistReadIds(ids: Iterable<string>) {
    readIdsCookie.value = [...new Set(ids)]
  }

  function setNotifications(items: NotificationItem[]) {
    const readIds = getReadIdsSet()
    notifications.value = items.map(item => ({
      ...item,
      read: item.read || readIds.has(item.id),
    }))
  }

  async function fetchNotifications() {
    loading.value = true
    try {
      const response = await $fetch<{ data: NotificationItem[] }>('/api/notifications')
      setNotifications(response.data)
    }
    finally {
      loading.value = false
    }
  }

  async function fetchNotifications() {
    loading.value = true
    try {
      const response = await $fetch<{ data: NotificationItem[] }>('/api/notifications')
      notifications.value = response.data
    }
    finally {
      loading.value = false
    }
  }

  function markAsRead(id: string) {
    notifications.value = notifications.value.map(item => item.id === id ? { ...item, read: true } : item)
    const readIds = getReadIdsSet()
    readIds.add(id)
    persistReadIds(readIds)
  }

  function markAllAsRead() {
    notifications.value = notifications.value.map(item => ({ ...item, read: true }))
    persistReadIds(notifications.value.map(item => item.id))
  }

  return {
    notifications,
    loading,
    unreadCount,
    setNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
