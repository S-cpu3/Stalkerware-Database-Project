<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAllApps, getIocCountForApp, dbVersion } from '../db.js'
import SeverityPill from '../components/SeverityPill.vue'
import Placeholder from '../components/Placeholder.vue'
import Icon from '../components/Icon.vue'

const router = useRouter()
const apps = ref([])
const counts = ref({})
const loading = ref(true)

async function load() {
  loading.value = true
  apps.value = await getAllApps()
  const entries = await Promise.all(apps.value.map(async a => [a.id, await getIocCountForApp(a.id)]))
  counts.value = Object.fromEntries(entries)
  loading.value = false
}

onMounted(load)
watch(dbVersion, load)

function open(id) { router.push({ name: 'app-detail', params: { id } }) }
</script>

<template>
  <div class="page-wide">
    <header style="margin-bottom: 24px">
      <h1 class="h1-md">Known stalkerware apps</h1>
      <p class="lede">
        {{ apps.length }} apps with publicly-documented surveillance behavior. Tap any app for
        indicators and the permissions it requests.
      </p>
    </header>

    <div v-if="loading" class="loading">Loading…</div>

    <div v-else class="apps-list">
      <button v-for="a in apps" :key="a.id" class="app-row" @click="open(a.id)">
        <Placeholder :label="a.name.slice(0, 2).toLowerCase()" :size="44" :radius="10" />
        <div class="body">
          <div class="row-head">
            <span class="name">{{ a.name }}</span>
            <SeverityPill :level="a.severity" size="sm" />
          </div>
          <div class="tagline">{{ a.tagline }}</div>
          <div class="meta">
            <span>{{ counts[a.id] ?? 0 }} indicator{{ counts[a.id] === 1 ? '' : 's' }}</span>
            <span>{{ a.platforms.join(' · ') }}</span>
            <span>since {{ a.first_seen }}</span>
          </div>
        </div>
        <span class="arrow"><Icon name="arrow" /></span>
      </button>
    </div>
  </div>
</template>
