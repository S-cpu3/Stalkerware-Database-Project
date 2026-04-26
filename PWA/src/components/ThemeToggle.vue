<script setup>
import { ref, watchEffect } from 'vue'
import Icon from './Icon.vue'

const stored = (() => {
  try { return localStorage.getItem('theme') } catch (e) { return null }
})()
const dark = ref(stored !== 'light')

watchEffect(() => {
  document.documentElement.dataset.theme = dark.value ? 'dark' : 'light'
  try { localStorage.setItem('theme', dark.value ? 'dark' : 'light') } catch (e) {}
})

function toggle() { dark.value = !dark.value }
</script>

<template>
  <button class="theme-toggle" @click="toggle" :title="dark ? 'Switch to light' : 'Switch to dark'">
    <Icon :name="dark ? 'sun' : 'moon'" />
  </button>
</template>
