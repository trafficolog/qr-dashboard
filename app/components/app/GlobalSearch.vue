<template>
  <UModal
    v-model:open="isOpen"
    :close-on-escape="true"
    class="max-w-xl"
  >
    <template #content>
      <div class="flex flex-col max-h-[70vh]">
        <!-- Search input -->
        <div class="flex items-center gap-3 border-b border-[color:var(--border)] px-4 py-3">
          <UIcon
            name="i-lucide-search"
            class="size-5 shrink-0 text-[color:var(--text-muted)]"
          />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            :placeholder="$t('search.placeholder')"
            class="flex-1 bg-transparent text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] outline-none text-sm"
            data-testid="global-search-input"
            @keydown.escape="close"
          >
          <UKbd
            v-if="!query"
            class="shrink-0"
          >
            Esc
          </UKbd>
          <button
            v-else
            aria-label="Очистить поисковый запрос"
            title="Очистить поисковый запрос"
            class="shrink-0 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
            @click="query = ''"
          >
            <UIcon
              name="i-lucide-x"
              class="size-4"
            />
          </button>
        </div>

        <!-- Content -->
        <div
          class="overflow-y-auto"
          @keydown.up.prevent="moveFocus(-1)"
          @keydown.down.prevent="moveFocus(1)"
        >
          <!-- Loading -->
          <div
            v-if="loading"
            class="flex items-center justify-center py-8"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="size-5 animate-spin text-[color:var(--text-muted)]"
            />
          </div>

          <!-- Results -->
          <template v-else-if="query.trim()">
            <div
              v-if="results.length === 0"
              class="py-8 text-center text-sm text-[color:var(--text-muted)]"
            >
              {{ $t('search.noResults') }}
            </div>

            <template v-else>
              <!-- QR codes -->
              <SearchSection
                v-if="qrResults.length"
                :label="$t('search.categories.qr')"
              >
                <SearchItem
                  v-for="(item, idx) in qrResults"
                  :key="item.id"
                  :focused="focusedIndex === flatIndex('qr', idx)"
                  icon="i-lucide-qr-code"
                  :label-html="highlightMatch(item.title, query)"
                  :sub-html="highlightMatch(item.shortCode, query)"
                  data-testid="search-result-qr"
                  @click="select(item)"
                  @mouseenter="focusedIndex = flatIndex('qr', idx)"
                />
              </SearchSection>

              <!-- Folders -->
              <SearchSection
                v-if="folderResults.length"
                :label="$t('search.categories.folders')"
              >
                <SearchItem
                  v-for="(item, idx) in folderResults"
                  :key="item.id"
                  :focused="focusedIndex === flatIndex('folder', idx)"
                  icon="i-lucide-folder"
                  :label-html="highlightMatch(item.name, query)"
                  @click="select(item)"
                  @mouseenter="focusedIndex = flatIndex('folder', idx)"
                />
              </SearchSection>

              <!-- Pages -->
              <SearchSection
                v-if="pageResults.length"
                :label="$t('search.categories.pages')"
              >
                <SearchItem
                  v-for="(item, idx) in pageResults"
                  :key="item.path"
                  :focused="focusedIndex === flatIndex('page', idx)"
                  :icon="item.icon"
                  :label-html="highlightMatch(item.label, query)"
                  @click="select(item)"
                  @mouseenter="focusedIndex = flatIndex('page', idx)"
                />
              </SearchSection>
            </template>
          </template>

          <!-- Recent (empty query) -->
          <template v-else>
            <div
              v-if="recent.length === 0"
              class="py-8 text-center text-sm text-[color:var(--text-muted)]"
            >
              {{ $t('search.recentEmpty') }}
            </div>

            <template v-else>
              <div class="flex items-center justify-between px-4 pt-3 pb-1">
                <span class="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
                  {{ $t('search.recent') }}
                </span>
                <button
                  class="text-xs text-[color:var(--text-muted)] hover:text-[color:var(--accent)] transition-colors"
                  @click="discardRecent"
                >
                  {{ $t('search.clearHistory') }}
                </button>
              </div>
              <SearchItem
                v-for="entry in recent"
                :key="entry.id"
                :focused="false"
                :icon="recentIcon(entry.kind)"
                :label-html="escapeHtml(entry.label)"
                :sub-html="entry.path ? escapeHtml(entry.path) : undefined"
                @click="navigateTo(entry.path!); close()"
              />
            </template>
          </template>
        </div>

        <!-- Footer -->
        <div class="shrink-0 border-t border-[color:var(--border)] px-4 py-2 flex items-center gap-4 text-xs text-[color:var(--text-muted)]">
          <span>
            <UKbd size="sm">↑↓</UKbd> {{ $t('search.keybinds.navigate') }}
          </span>
          <span>
            <UKbd size="sm">↵</UKbd> {{ $t('search.keybinds.select') }}
          </span>
          <span>
            <UKbd size="sm">Esc</UKbd> {{ $t('search.keybinds.close') }}
          </span>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useGlobalSearch, highlightMatch, escapeHtml } from '~/composables/useGlobalSearch'
import type { SearchResult } from '~/composables/useGlobalSearch'
import { createDialogFocusReturn } from '~/utils/dialog-focus-return'

const { isOpen, query, results, recent, loading, close, select, discardRecent } = useGlobalSearch()
const focusReturn = createDialogFocusReturn()

const inputRef = ref<HTMLInputElement | null>(null)

// Focus input when modal opens
watch(isOpen, (v) => {
  if (v) {
    focusReturn.save()
    nextTick(() => inputRef.value?.focus())
    focusedIndex.value = 0
  }
  else {
    focusReturn.restore()
  }
})

// Reset focus index on results change
const focusedIndex = ref(0)
watch(results, () => {
  focusedIndex.value = 0
})

// Grouped results
const qrResults = computed(() => results.value.filter((r): r is Extract<SearchResult, { kind: 'qr' }> => r.kind === 'qr'))
const folderResults = computed(() => results.value.filter((r): r is Extract<SearchResult, { kind: 'folder' }> => r.kind === 'folder'))
const pageResults = computed(() => results.value.filter((r): r is Extract<SearchResult, { kind: 'page' }> => r.kind === 'page'))

// Map (kind, localIdx) → flat index for keyboard nav
function flatIndex(kind: 'qr' | 'folder' | 'page', localIdx: number): number {
  if (kind === 'qr') return localIdx
  if (kind === 'folder') return qrResults.value.length + localIdx
  return qrResults.value.length + folderResults.value.length + localIdx
}

function moveFocus(delta: number) {
  const total = results.value.length
  if (total === 0) return
  focusedIndex.value = (focusedIndex.value + delta + total) % total
}

function handleEnter() {
  const item = results.value[focusedIndex.value]
  if (item) select(item)
}

// Global keydown for Enter within the modal
function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return
  if (e.key === 'Enter') {
    e.preventDefault()
    handleEnter()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

function recentIcon(kind: string): string {
  if (kind === 'qr') return 'i-lucide-qr-code'
  if (kind === 'folder') return 'i-lucide-folder'
  return 'i-lucide-file'
}
</script>
