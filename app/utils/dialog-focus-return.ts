export function createDialogFocusReturn() {
  let lastActive: HTMLElement | null = null

  function save() {
    if (!(document.activeElement instanceof HTMLElement)) return
    if (!document.activeElement.isConnected) return

    lastActive = document.activeElement
  }

  function restore() {
    const target = lastActive
    lastActive = null

    if (!target?.isConnected) return

    requestAnimationFrame(() => {
      target.focus({ preventScroll: true })
    })
  }

  return { save, restore }
}
