<script setup>
const props = defineProps({
  level: { type: String, default: 'Low' },
  size: { type: String, default: 'md' }
})

const glyphs = { High: '!', Medium: '~', Low: '·' }
</script>

<template>
  <span class="sev-pill" :class="['sev-' + (level || 'Low').toLowerCase(), size]">
    <span class="glyph" aria-hidden="true">{{ glyphs[level] || '·' }}</span>
    {{ level }}
  </span>
</template>
