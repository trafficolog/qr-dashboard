<template>
  <footer class="layout-footer">
    <span>{{ $t('app.name') }}</span>
    <span>v{{ version }}</span>
  </footer>
</template>

<script setup lang="ts">
const version = '0.15.0'
</script>
