import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref, watch, type Ref } from 'vue'

type StateFactory = <T>(key: string, init?: () => T) => Ref<T>

const stateStore = new Map<string, Ref<unknown>>()

const useStateMock: StateFactory = <T>(key: string, init?: () => T): Ref<T> => {
  if (!stateStore.has(key)) {
    stateStore.set(key, ref(init ? init() : undefined) as Ref<unknown>)
  }

  return stateStore.get(key)! as Ref<T>
}

describe('useGlobalSearch', () => {
  beforeEach(() => {
    vi.resetModules()
    stateStore.clear()

    vi.stubGlobal('useState', useStateMock)
    vi.stubGlobal('watch', watch)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('navigateTo', vi.fn())
    vi.stubGlobal('$fetch', vi.fn())
  })

  it('close resets transient state including timer and in-flight request', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const abortSpy = vi.fn()

    const { useGlobalSearch } = await import('./useGlobalSearch')
    const search = useGlobalSearch()

    search.open()
    search.query.value = 'даш'

    const apiResults = useStateMock<{ qrs: Array<{ id: string, title: string, shortCode: string }>, folders: Array<{ id: string, name: string }> }>('global-search:api-results')
    const loading = useStateMock<boolean>('global-search:loading')
    const abortController = useStateMock<{ abort: () => void, signal?: AbortSignal } | null>('global-search:abort-controller')

    apiResults.value = {
      qrs: [{ id: 'qr-1', title: 'Dash QR', shortCode: 'dash' }],
      folders: [{ id: 'folder-1', name: 'Dash Folder' }],
    }
    loading.value = true
    abortController.value = { abort: abortSpy }

    await nextTick()
    expect(search.results.value.length).toBeGreaterThan(0)

    search.close()
    await nextTick()

    const debounceTimer = useStateMock<ReturnType<typeof setTimeout> | null>('global-search:debounce-timer')

    expect(search.query.value).toBe('')
    expect(search.loading.value).toBe(false)
    expect(apiResults.value).toEqual({ qrs: [], folders: [] })
    expect(search.results.value).toEqual([])
    expect(debounceTimer.value).toBeNull()
    expect(clearTimeoutSpy).toHaveBeenCalled()
    expect(abortSpy).toHaveBeenCalledTimes(1)
    expect(abortController.value).toBeNull()
  })
})
