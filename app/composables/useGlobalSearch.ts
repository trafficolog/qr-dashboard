import type { Ref } from 'vue'

export type SearchResult =
  | { kind: 'qr', id: string, title: string, shortCode: string }
  | { kind: 'folder', id: string, name: string }
  | { kind: 'page', path: string, label: string, icon: string }

export interface SearchEntry {
  id: string
  kind: SearchResult['kind']
  label: string
  path?: string
  shortCode?: string
}

const RECENT_KEY = 'search:recent'
const RECENT_MAX = 10

const staticPages: Extract<SearchResult, { kind: 'page' }>[] = [
  { kind: 'page', path: '/dashboard', label: 'Дашборд', icon: 'i-lucide-layout-dashboard' },
  { kind: 'page', path: '/qr', label: 'QR-коды', icon: 'i-lucide-qr-code' },
  { kind: 'page', path: '/qr/create', label: 'Создать QR', icon: 'i-lucide-plus' },
  { kind: 'page', path: '/folders', label: 'Папки', icon: 'i-lucide-folder' },
  { kind: 'page', path: '/analytics', label: 'Аналитика', icon: 'i-lucide-bar-chart-3' },
  { kind: 'page', path: '/integrations', label: 'Интеграции', icon: 'i-lucide-plug' },
  { kind: 'page', path: '/settings', label: 'Настройки', icon: 'i-lucide-settings' },
  { kind: 'page', path: '/settings/general', label: 'Настройки — Общие', icon: 'i-lucide-sliders' },
  { kind: 'page', path: '/settings/profile', label: 'Настройки — Профиль', icon: 'i-lucide-user' },
  { kind: 'page', path: '/settings/team', label: 'Настройки — Команда', icon: 'i-lucide-users' },
  { kind: 'page', path: '/settings/domains', label: 'Настройки — Домены', icon: 'i-lucide-globe' },
  { kind: 'page', path: '/settings/integrations', label: 'Настройки — Интеграции', icon: 'i-lucide-plug' },
]

let abortController: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return escapeHtml(text)
  const escaped = escapeHtml(text)
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return escaped.replace(
    new RegExp(`(${escapedQuery})`, 'gi'),
    '<mark class="bg-[color:var(--accent-light)] text-[color:var(--accent)] rounded px-0.5">$1</mark>',
  )
}

interface ApiSearchResult {
  qrs: Array<{ id: string, title: string, shortCode: string }>
  folders: Array<{ id: string, name: string }>
}

function clearTransientState(query: Ref<string>, loading: Ref<boolean>, apiResults: Ref<ApiSearchResult>) {
  query.value = ''
  loading.value = false
  apiResults.value = { qrs: [], folders: [] }

  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  if (abortController) {
    abortController.abort()
    abortController = null
  }
}

export function useGlobalSearch() {
  const isOpen = useState<boolean>('global-search:is-open', () => false)
  const query = useState<string>('global-search:query', () => '')
  const loading = useState<boolean>('global-search:loading', () => false)
  const apiResults = useState<ApiSearchResult>('global-search:api-results', () => ({ qrs: [], folders: [] }))
  const recent = useState<SearchEntry[]>('global-search:recent', () => [])

  const isInitialized = useState<boolean>('global-search:is-initialized', () => false)

  function debouncedFetch(q: string) {
    if (debounceTimer) clearTimeout(debounceTimer)

    debounceTimer = setTimeout(async () => {
      if (!q.trim()) {
        apiResults.value = { qrs: [], folders: [] }
        loading.value = false
        return
      }

      if (abortController) abortController.abort()
      abortController = new AbortController()

      loading.value = true
      try {
        const res = await $fetch<{ data: ApiSearchResult }>(
          `/api/search?q=${encodeURIComponent(q)}`,
          { signal: abortController.signal },
        )
        apiResults.value = res.data
      }
      catch {
        // Aborted or error — keep previous results
      }
      finally {
        loading.value = false
      }
    }, 250)
  }

  if (!isInitialized.value) {
    isInitialized.value = true

    if (typeof window !== 'undefined') {
      try {
        recent.value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as SearchEntry[]
      }
      catch {
        // ignore
      }

      watch(recent, v => localStorage.setItem(RECENT_KEY, JSON.stringify(v)), { deep: true })
    }

    watch(query, q => debouncedFetch(q))

    watch(isOpen, (open) => {
      if (!open) {
        clearTransientState(query, loading, apiResults)
      }
    })
  }

  const results = computed<SearchResult[]>(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return []

    const qrResults: SearchResult[] = apiResults.value.qrs.map(r => ({
      kind: 'qr' as const,
      id: r.id,
      title: r.title,
      shortCode: r.shortCode,
    }))

    const folderResults: SearchResult[] = apiResults.value.folders.map(r => ({
      kind: 'folder' as const,
      id: r.id,
      name: r.name,
    }))

    const pageResults: SearchResult[] = staticPages.filter(p =>
      p.label.toLowerCase().includes(q),
    )

    return [...qrResults, ...folderResults, ...pageResults]
  })

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function select(result: SearchResult) {
    let entry: SearchEntry
    let destination: string

    if (result.kind === 'qr') {
      entry = { id: result.id, kind: 'qr', label: result.title, shortCode: result.shortCode, path: `/qr/${result.id}` }
      destination = `/qr/${result.id}`
    }
    else if (result.kind === 'folder') {
      entry = { id: result.id, kind: 'folder', label: result.name, path: `/folders/${result.id}` }
      destination = `/folders/${result.id}`
    }
    else {
      entry = { id: result.path, kind: 'page', label: result.label, path: result.path }
      destination = result.path
    }

    // Prepend, deduplicate, truncate
    recent.value = [entry, ...recent.value.filter((r: SearchEntry) => r.id !== entry.id)].slice(0, RECENT_MAX)

    navigateTo(destination)
    close()
  }

  function discardRecent() {
    recent.value = []
  }

  return {
    isOpen,
    query,
    results,
    recent,
    loading,
    staticPages,
    open,
    close,
    select,
    discardRecent,
  }
}
