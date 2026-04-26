<script setup>
const props = defineProps({
  label: { type: String, default: '' },
  size: { type: Number, default: 48 },
  radius: { type: Number, default: 12 },
})
</script>

<template>
  <div class="placeholder"
    :style="{ width: size + 'px', height: size + 'px', borderRadius: radius + 'px', fontSize: (size < 56 ? 8 : 9.5) + 'px' }">
    {{ label }}
  </div>
</template>
