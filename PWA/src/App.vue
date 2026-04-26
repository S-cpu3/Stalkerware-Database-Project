<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Wordmark from './components/Wordmark.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import RefreshButton from './components/RefreshButton.vue'
import Icon from './components/Icon.vue'

const route = useRoute()
const router = useRouter()

const navItems = [
  { name: 'search',      label: 'Lookup',      icon: 'search' },
  { name: 'apps',        label: 'Apps',        icon: 'book' },
  { name: 'iocs',        label: 'Feed',        icon: 'feed' },
  { name: 'permissions', label: 'Permissions', icon: 'shield' },
  { name: 'help',        label: 'Get help',    icon: 'help' },
]

const current = computed(() => {
  if (route.name === 'app-detail') return 'apps'
  return route.name
})

function go(name) { router.push({ name }) }
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <button class="brand-button" @click="go('search')" aria-label="Go to lookup">
        <Wordmark />
      </button>
      <nav class="top-nav" aria-label="Primary">
        <button v-for="n in navItems" :key="n.name"
          :class="{ active: current === n.name }"
          @click="go(n.name)">{{ n.label }}</button>
      </nav>
      <div class="header-right">
        <RefreshButton />
        <ThemeToggle />
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <nav class="bottom-nav" aria-label="Primary mobile">
      <button v-for="n in navItems" :key="n.name"
        :class="{ active: current === n.name }"
        @click="go(n.name)">
        <span class="icon"><Icon :name="n.icon" /></span>
        {{ n.label.split(' ')[0] }}
      </button>
    </nav>
  </div>
</template>
