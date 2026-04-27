type NotificationType = 'team' | 'security' | 'system'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  description: string
  createdAt: string
  read: boolean
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = []

export function useNotifications() {
  const notifications = useState<NotificationItem[]>('notifications:list', () => [...DEFAULT_NOTIFICATIONS])
  const loading = useState<boolean>('notifications:loading', () => false)
  const unreadCount = computed(() => notifications.value.filter(item => !item.read).length)

  function setNotifications(items: NotificationItem[]) {
    notifications.value = items
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
  }

  function markAllAsRead() {
    notifications.value = notifications.value.map(item => ({ ...item, read: true }))
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
