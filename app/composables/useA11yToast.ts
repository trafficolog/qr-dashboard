import { useToast } from 'primevue/usetoast'

type ToastColor = 'success' | 'error' | 'warning' | 'info' | 'neutral'

type ToastPayload = {
  title?: string
  description?: string
  color?: ToastColor
  life?: number
}

function mapColorToSeverity(color?: ToastColor): 'success' | 'error' | 'warn' | 'info' | 'secondary' {
  switch (color) {
    case 'success':
      return 'success'
    case 'error':
      return 'error'
    case 'warning':
      return 'warn'
    case 'info':
      return 'info'
    default:
      return 'secondary'
  }
}

export function useA11yToast() {
  const toast = useToast()
  const { announce } = useA11yAnnouncer()

  function add(payload: ToastPayload & Record<string, unknown>) {
    const summary = payload.title
    const detail = payload.description

    toast.add({
      group: 'app',
      severity: mapColorToSeverity(payload.color),
      summary,
      detail,
      life: payload.life ?? 3000,
    })

    const text = [summary, detail].filter(Boolean).join('. ')
    announce(text, 'polite')
  }

  return {
    add,
  }
}
