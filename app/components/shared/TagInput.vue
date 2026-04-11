<template>
  <div>
    <div class="flex flex-wrap gap-1.5 mb-2" v-if="selectedTags.length > 0">
      <UBadge
        v-for="tag in selectedTags"
        :key="tag.id"
        :style="tag.color ? { backgroundColor: tag.color, color: getContrastColor(tag.color) } : {}"
        variant="subtle"
        class="gap-1"
      >
        {{ tag.name }}
        <button
          class="ml-0.5 hover:opacity-75"
          @click="removeTag(tag.id)"
        >
          <UIcon name="i-lucide-x" class="size-3" />
        </button>
      </UBadge>
    </div>

    <UInput
      v-model="searchQuery"
      placeholder="Добавить тег..."
      icon="i-lucide-tag"
      size="sm"
      @keydown.enter.prevent="handleEnter"
      @focus="showSuggestions = true"
      @blur="handleBlur"
    />

    <!-- Suggestions dropdown -->
    <div
      v-if="showSuggestions && filteredSuggestions.length > 0"
      class="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-lg max-h-40 overflow-y-auto z-10 relative"
    >
      <button
        v-for="tag in filteredSuggestions"
        :key="tag.id"
        class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
        @mousedown.prevent="addTag(tag)"
      >
        <span
          v-if="tag.color"
          class="size-3 rounded-full shrink-0"
          :style="{ backgroundColor: tag.color }"
        />
        {{ tag.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Tag {
  id: string
  name: string
  color: string | null
}

const props = defineProps<{
  modelValue: string[]
  availableTags: Tag[]
}>()

const emit = defineEmits<{
  'update:modelValue': [ids: string[]]
  'create-tag': [name: string]
}>()

const searchQuery = ref('')
const showSuggestions = ref(false)

const selectedTags = computed(() =>
  props.availableTags.filter((t) => props.modelValue.includes(t.id)),
)

const filteredSuggestions = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return props.availableTags.filter(
    (t) =>
      !props.modelValue.includes(t.id)
      && (q === '' || t.name.toLowerCase().includes(q)),
  )
})

function addTag(tag: Tag) {
  if (!props.modelValue.includes(tag.id)) {
    emit('update:modelValue', [...props.modelValue, tag.id])
  }
  searchQuery.value = ''
}

function removeTag(id: string) {
  emit('update:modelValue', props.modelValue.filter((tid) => tid !== id))
}

function handleEnter() {
  const q = searchQuery.value.trim()
  if (!q) return

  // If exact match exists in suggestions, add it
  const match = filteredSuggestions.value.find(
    (t) => t.name.toLowerCase() === q.toLowerCase(),
  )
  if (match) {
    addTag(match)
  } else {
    // Create new tag
    emit('create-tag', q)
    searchQuery.value = ''
  }
}

function handleBlur() {
  // Delay to allow click on suggestion
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 160 ? '#374151' : '#FFFFFF'
}
</script>
