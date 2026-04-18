<template>
  <div />
</template>

<script setup lang="ts">
const { user } = useAuth()

const fallbackRoute = user.value?.role === 'admin'
  ? '/settings/general'
  : '/settings/profile'

await navigateTo(fallbackRoute, { replace: true })
</script>
