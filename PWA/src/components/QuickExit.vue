<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Icon from './Icon.vue'

const armed = ref(false)
let timer = null

function trigger() {
  armed.value = true
  clearTimeout(timer)
  timer = setTimeout(() => {
    // Replace history then navigate so back-button doesn't return here.
    try { history.replaceState(null, '', 'about:blank') } catch (e) {}
    location.replace('https://www.google.com/search?q=weather')
  }, 300)
}

function onKey(e) {
  if (e.key === 'Escape') trigger()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  clearTimeout(timer)
})
</script>

<template>
  <button class="quick-exit" :class="{ armed }" @click="trigger" title="Quickly leave this page (Esc)">
    <Icon name="exit" />
    <span>{{ armed ? 'Leaving…' : 'Quick exit' }}</span>
    <kbd>Esc</kbd>
  </button>
</template>
