export function createDialogFocusReturn() {
  let lastActive: HTMLElement | null = null

  function save() {
    if (document.activeElement instanceof HTMLElement) {
      lastActive = document.activeElement
    }
  }

  function restore() {
    lastActive?.focus()
    lastActive = null
  }

  return { save, restore }
}
