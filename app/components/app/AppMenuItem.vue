<template>
  <li>
    <NuxtLink
      :to="item.to"
      class="layout-menuitem-link"
      :class="{ 'layout-menuitem-link-active': active }"
      @click="onClick"
    >
      <Icon
        :name="item.icon"
        class="layout-menuitem-icon"
      />
      <span class="layout-menuitem-text">{{ item.label }}</span>
      <span
        v-if="item.badge !== undefined"
        class="layout-menuitem-badge"
      >
        {{ item.badge }}
      </span>
    </NuxtLink>
  </li>
</template>

<script setup lang="ts">
interface AppMenuItem {
  label: string
  icon: string
  to: string
  badge?: number
}

const props = defineProps<{
  item: AppMenuItem
}>()

const emit = defineEmits<{
  itemClick: []
}>()

const route = useRoute()

const active = computed(() => route.path === props.item.to || route.path.startsWith(`${props.item.to}/`))

function onClick() {
  emit('itemClick')
}
</script>
