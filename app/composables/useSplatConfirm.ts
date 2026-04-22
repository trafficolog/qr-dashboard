import { useConfirm } from 'primevue/useconfirm'

interface SplatConfirmOptions {
  message: string
  header?: string
  acceptLabel?: string
  rejectLabel?: string
  onAccept: () => void
  onReject?: () => void
}

export function useSplatConfirm() {
  const confirm = useConfirm()

  function requireConfirm(options: SplatConfirmOptions) {
    confirm.require({
      group: 'app',
      message: options.message,
      header: options.header ?? 'Подтверждение действия',
      acceptLabel: options.acceptLabel ?? 'Подтвердить',
      rejectLabel: options.rejectLabel ?? 'Отмена',
      accept: options.onAccept,
      reject: options.onReject,
    })
  }

  return {
    requireConfirm,
  }
}
