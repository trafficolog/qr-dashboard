import { useToast } from 'primevue/usetoast'

interface NotifyOptions {
  title: string
  detail?: string
  life?: number
}

export function useNotify() {
  const toast = useToast()

  function success(options: NotifyOptions) {
    toast.add({
      group: 'app',
      severity: 'success',
      summary: options.title,
      detail: options.detail,
      life: options.life ?? 3000,
    })
  }

  function error(options: NotifyOptions) {
    toast.add({
      group: 'app',
      severity: 'error',
      summary: options.title,
      detail: options.detail,
      life: options.life ?? 4500,
    })
  }

  function info(options: NotifyOptions) {
    toast.add({
      group: 'app',
      severity: 'info',
      summary: options.title,
      detail: options.detail,
      life: options.life ?? 3000,
    })
  }

  return {
    success,
    error,
    info,
  }
}
