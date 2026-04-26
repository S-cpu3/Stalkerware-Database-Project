<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getApp, getIocsForApp, getPermsForApp, dbVersion } from '../db.js'
import SeverityPill from '../components/SeverityPill.vue'
import TypeChip from '../components/TypeChip.vue'
import Placeholder from '../components/Placeholder.vue'
import Icon from '../components/Icon.vue'

const route = useRoute()
const router = useRouter()

const app = ref(null)
const iocs = ref([])
const perms = ref([])
const loading = ref(true)

async function load(id) {
  loading.value = true
  app.value = await getApp(id)
  if (app.value) {
    const [i, p] = await Promise.all([getIocsForApp(id), getPermsForApp(id)])
    iocs.value = i
    perms.value = p
  } else {
    iocs.value = []
    perms.value = []
  }
  loading.value = false
}

onMounted(() => load(route.params.id))
watch(() => route.params.id, (id) => { if (id) load(id) })
watch(dbVersion, () => { if (route.params.id) load(route.params.id) })

const grouped = computed(() => {
  const g = {}
  for (const m of iocs.value) (g[m.type] = g[m.type] || []).push(m)
  return g
})

function back() { router.push({ name: 'apps' }) }
</script>

<template>
  <div class="page">
    <button class="back-link" @click="back"><Icon name="back" /> All apps</button>

    <div v-if="loading" class="loading">Loading…</div>

    <template v-else-if="app">
      <div class="detail-head">
        <Placeholder :label="app.name.slice(0, 2).toLowerCase()" :size="64" :radius="14" />
        <div style="flex: 1; min-width: 0">
          <div class="detail-title-row">
            <h1 class="detail-title">{{ app.name }}</h1>
            <SeverityPill :level="app.severity" />
          </div>
          <div class="detail-meta">
            {{ app.vendor }} · since {{ app.first_seen }} · {{ app.platforms.join(' · ') }}
          </div>
        </div>
      </div>

      <p class="detail-desc">{{ app.description }}</p>

      <section style="margin-bottom: 32px">
        <h2 class="h2">Indicators ({{ iocs.length }})</h2>
        <div v-if="!iocs.length" class="empty">No indicators in the database for this app yet.</div>
        <div v-for="(list, type) in grouped" :key="type" class="ioc-group">
          <div class="ioc-group-head">
            <TypeChip :type="type" />
            <span class="ioc-group-count">{{ list.length }}</span>
          </div>
          <div>
            <div v-for="m in list" :key="m.id" class="ioc-row">
              <code class="mono">{{ m.value }}</code>
              <div class="src">{{ m.source }} · {{ m.date }}</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 class="h2">What it can do on the phone</h2>
        <p style="font-size: 13px; color: var(--ink-3); margin: 0 0 16px">
          Based on the Android permissions this app requests.
        </p>
        <ul v-if="perms.length" class="perms-list">
          <li v-for="p in perms" :key="p.key">
            <div>
              <div class="perm-label">{{ p.label }}</div>
              <code class="mono sm" style="margin-top: 3px; display: inline-block">{{ p.key }}</code>
            </div>
            <div class="perm-plain">{{ p.plain }}</div>
            <div class="perm-risk"><SeverityPill :level="p.risk" size="sm" /></div>
          </li>
        </ul>
        <div v-else class="empty">No permissions recorded for this app.</div>
      </section>
    </template>

    <div v-else class="empty">App not found.</div>
  </div>
</template>
