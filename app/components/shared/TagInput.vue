<template>
  <div>
    <div
      v-if="selectedTags.length > 0"
      class="mb-2 flex flex-wrap gap-1.5"
    >
      <Tag
        v-for="tag in selectedTags"
        :key="tag.id"
        :style="tag.color ? { backgroundColor: tag.color, color: getContrastColor(tag.color) } : {}"
        class="gap-1"
      >
        {{ tag.name }}
        <button
          class="ml-0.5 hover:opacity-75"
          @click="removeTag(tag.id)"
        >
          <Icon
            name="i-lucide-x"
            class="size-3"
          />
        </button>
      </Tag>
    </div>

    <IconField>
      <InputIcon>
        <Icon
          name="i-lucide-tag"
          class="size-4"
        />
      </InputIcon>
      <InputText
        v-model="searchQuery"
        placeholder="Добавить тег..."
        class="w-full"
        @keydown.enter.prevent="handleEnter"
        @focus="showSuggestions = true"
        @blur="handleBlur"
      />
    </IconField>

    <div
      v-if="showSuggestions && filteredSuggestions.length > 0"
      class="relative z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] shadow-lg shadow-black/5"
    >
      <button
        v-for="tag in filteredSuggestions"
        :key="tag.id"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]"
        @mousedown.prevent="addTag(tag)"
      >
        <span
          v-if="tag.color"
          class="size-3 shrink-0 rounded-full"
          :style="{ backgroundColor: tag.color }"
        />
        {{ tag.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TagItem {
  id: string
  name: string
  color: string | null
}

const props = defineProps<{
  modelValue: string[]
  availableTags: TagItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [ids: string[]]
  'create-tag': [name: string]
}>()

const searchQuery = ref('')
const showSuggestions = ref(false)

const selectedTags = computed(() =>
  props.availableTags.filter(tag => props.modelValue.includes(tag.id)),
)

const filteredSuggestions = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return props.availableTags.filter(
    tag =>
      !props.modelValue.includes(tag.id)
      && (q === '' || tag.name.toLowerCase().includes(q)),
  )
})

function addTag(tag: TagItem) {
  if (!props.modelValue.includes(tag.id)) {
    emit('update:modelValue', [...props.modelValue, tag.id])
  }
  searchQuery.value = ''
}

function removeTag(id: string) {
  emit('update:modelValue', props.modelValue.filter(tagId => tagId !== id))
}

function handleEnter() {
  const q = searchQuery.value.trim()
  if (!q) return

  const match = filteredSuggestions.value.find(tag => tag.name.toLowerCase() === q.toLowerCase())
  if (match) {
    addTag(match)
  }
  else {
    emit('create-tag', q)
    searchQuery.value = ''
  }
}

function handleBlur() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

function getContrastColor(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 160 ? '#4b1f2a' : '#FFFFFF'
}
</script>
