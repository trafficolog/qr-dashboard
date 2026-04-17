type AnnouncePriority = 'polite' | 'assertive'

export function useA11yAnnouncer() {
  const message = useState<string>('a11y:announce:message', () => '')
  const priority = useState<AnnouncePriority>('a11y:announce:priority', () => 'polite')

  function announce(text: string, nextPriority: AnnouncePriority = 'polite') {
    if (!text.trim()) return

    priority.value = nextPriority
    // Force screen-reader update even for identical consecutive messages.
    message.value = ''
    nextTick(() => {
      message.value = text
    })
  }

  return {
    message: readonly(message),
    priority: readonly(priority),
    announce,
  }
}
