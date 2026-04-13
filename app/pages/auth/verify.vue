<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: to => navigateTo({
    path: '/auth/login',
    query: {
      ...to.query,
      step: 'code',
    },
  }),
})
</script>
