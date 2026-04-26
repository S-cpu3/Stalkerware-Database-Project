<script setup>
const props = defineProps({ type: { type: String, required: true } })
const labels = {
  domain: 'Domain',
  package_name: 'Package',
  file_hash: 'File hash',
  ip_address: 'IP',
  url: 'URL',
}
</script>

<template>
  <span class="type-chip">{{ labels[type] || type }}</span>
</template>
