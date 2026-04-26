import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router.js'
import { maybeAutoRefresh } from './db.js'
import './styles.css'

// Apply persisted theme before mount to avoid flash.
try {
  const t = localStorage.getItem('theme')
  document.documentElement.dataset.theme = t === 'light' ? 'light' : 'dark'
} catch (e) {
  document.documentElement.dataset.theme = 'dark'
}

createApp(App).use(router).mount('#app')

// Kick off a background refresh if the snapshot is missing or stale.
// Runs after first paint so it doesn't block initial render.
requestIdleCallback?.(maybeAutoRefresh) ?? setTimeout(maybeAutoRefresh, 1000)
