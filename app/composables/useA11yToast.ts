type ToastPayload = {
  title?: string
  description?: string
}

export function useA11yToast() {
  const toast = useToast()
  const { announce } = useA11yAnnouncer()

  function add(payload: ToastPayload & Record<string, unknown>) {
    toast.add(payload)

    const text = [payload.title, payload.description].filter(Boolean).join('. ')
    announce(text, 'polite')
  }

  return {
    ...toast,
    add,
  }
}
