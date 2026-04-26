<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getRecentIocs, dbVersion } from '../db.js'
import SeverityPill from '../components/SeverityPill.vue'
import TypeChip from '../components/TypeChip.vue'

const all = ref([])
const loading = ref(true)
const typeFilter = ref('all')
const sevFilter = ref('all')

const types = ['all', 'domain', 'package_name', 'file_hash', 'ip_address', 'url']
const sevs = ['all', 'High', 'Medium', 'Low']

async function load() {
  loading.value = true
  all.value = await getRecentIocs(500)
  loading.value = false
}

onMounted(load)
watch(dbVersion, load)

const rows = computed(() =>
  all.value
    .filter(x => typeFilter.value === 'all' || x.type === typeFilter.value)
    .filter(x => sevFilter.value === 'all' || x.severity === sevFilter.value)
)
</script>

<template>
  <div class="page-feed">
    <header style="margin-bottom: 20px">
      <h1 class="h1-md">Recent indicators</h1>
      <p style="margin: 0; font-size: 14px; color: var(--ink-2)">
        {{ rows.length }} indicators sorted by most recently published.
      </p>
    </header>

    <div class="filters">
      <div class="filter-group">
        <span class="filter-label">Type</span>
        <div class="filter-chips">
          <button v-for="t in types" :key="t" class="filter-chip"
            :class="{ active: typeFilter === t }" @click="typeFilter = t">
            {{ t.replace('_', ' ') }}
          </button>
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-label">Severity</span>
        <div class="filter-chips">
          <button v-for="s in sevs" :key="s" class="filter-chip"
            :class="{ active: sevFilter === s }" @click="sevFilter = s">
            {{ s }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading…</div>

    <div v-else>
      <div v-for="m in rows" :key="m.id" class="feed-row">
        <div class="feed-date">{{ m.date }}</div>
        <div class="feed-mid">
          <div class="feed-meta">
            <TypeChip :type="m.type" />
            <span class="label-text">linked to <strong class="app-name">{{ m.appName }}</strong></span>
          </div>
          <code class="mono">{{ m.value }}</code>
          <div class="feed-src">Source: {{ m.source }}</div>
        </div>
        <div class="feed-sev">
          <SeverityPill :level="m.severity" size="sm" />
        </div>
      </div>
      <div v-if="!rows.length" class="empty">No indicators match these filters.</div>
    </div>
  </div>
</template>
