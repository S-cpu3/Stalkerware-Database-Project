<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'
import { refreshDatabase, refreshState, dbMeta } from '../db.js'

const running = computed(() => refreshState.value.running)
const message = computed(() => refreshState.value.message)
const error = computed(() => refreshState.value.error)

const updatedLabel = computed(() => {
  if (running.value) return message.value || 'Updating…'
  if (error.value) return 'Update failed'
  if (dbMeta.value.source === 'scraped' && dbMeta.value.updatedAt) {
    return 'Updated ' + relativeTime(dbMeta.value.updatedAt)
  }
  return 'Bundled snapshot'
})

function relativeTime(iso) {
  const then = new Date(iso).getTime()
  const diff = (Date.now() - then) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return Math.floor(diff / 60) + ' min ago'
  if (diff < 86400) return Math.floor(diff / 3600) + ' h ago'
  return Math.floor(diff / 86400) + ' d ago'
}

async function onClick() {
  if (running.value) return
  try { await refreshDatabase() } catch (e) { /* surfaced via refreshState.error */ }
}
</script>

<template>
  <div class="refresh-wrap" :title="error || message || updatedLabel">
    <button class="refresh-btn" :class="{ running }" :disabled="running" @click="onClick">
      <span class="refresh-icon" :class="{ spin: running }">
        <svg viewBox="0 0 24 24" fill="none" width="1em" height="1em">
          <path d="M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4"
            stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="refresh-label">{{ running ? 'Updating…' : 'Refresh data' }}</span>
    </button>
    <span v-if="!running" class="refresh-meta">{{ updatedLabel }}</span>
    <span v-else class="refresh-meta">{{ message }}</span>
  </div>
</template>

<style scoped>
.refresh-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.refresh-btn {
  appearance: none;
  border: 0.5px solid var(--rule);
  background: transparent;
  color: var(--ink-2);
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 500;
}
.refresh-btn:hover:not(:disabled) { color: var(--ink); border-color: var(--ink-3); }
.refresh-btn:disabled { opacity: 0.7; cursor: progress; }
.refresh-icon { display: inline-flex; font-size: 14px; }
.refresh-icon.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.refresh-meta {
  font-size: 11.5px;
  color: var(--ink-3);
  white-space: nowrap;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (max-width: 720px) {
  .refresh-label, .refresh-meta { display: none; }
  .refresh-btn { padding: 6px; }
}
</style>
