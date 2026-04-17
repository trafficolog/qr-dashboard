<template>
  <div />
</template>

<script setup lang="ts">
// Redirect /settings → /settings/general
await navigateTo('/settings/general', { replace: true })
</script>
