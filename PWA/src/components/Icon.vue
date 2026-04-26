<script setup>
const props = defineProps({ name: { type: String, required: true } })

const paths = {
  search: '<circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.6"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  exit:   '<path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5M9 8l-5 4 5 4M4 12h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  warn:   '<path d="M12 4 2.5 20h19L12 4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 10v5M12 17.5v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  info:   '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v5M12 8v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  arrow:  '<path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  back:   '<path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  lens:   '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="0.9" fill="currentColor"/>',
  feed:   '<path d="M4 11a9 9 0 0 1 9 9M4 5a15 15 0 0 1 15 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="5" cy="19" r="1.5" fill="currentColor"/>',
  book:   '<path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 16a4 4 0 0 1 4-4h10" stroke="currentColor" stroke-width="1.6"/>',
  help:   '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M9 9.5a3 3 0 1 1 4.2 2.7c-.8.3-1.2.9-1.2 1.8M12 17v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  ext:    '<path d="M14 4h6v6M20 4l-9 9M10 6H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  sun:    '<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  moon:   '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
}
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" width="1em" height="1em" v-html="paths[name] || ''" />
</template>
