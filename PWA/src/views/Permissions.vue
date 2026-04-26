<script setup>
import { ref, onMounted, watch } from 'vue'
import { getAllPermissions, dbVersion } from '../db.js'
import SeverityPill from '../components/SeverityPill.vue'

const perms = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  perms.value = await getAllPermissions()
  loading.value = false
}

onMounted(load)
watch(dbVersion, load)
</script>

<template>
  <div class="page">
    <header style="margin-bottom: 28px">
      <h1 class="h1-md">What dangerous permissions actually mean</h1>
      <p class="lede">
        Stalkerware apps need permission to do their work. Here’s what each one means in plain
        language — so you can spot a problem on a phone’s settings screen.
      </p>
    </header>

    <div v-if="loading" class="loading">Loading…</div>

    <ul v-else class="perms-list">
      <li v-for="p in perms" :key="p.key">
        <div>
          <div class="perm-label">{{ p.label }}</div>
          <code class="mono sm" style="margin-top: 3px; display: inline-block">{{ p.key }}</code>
        </div>
        <div class="perm-plain">{{ p.plain }}</div>
        <div class="perm-risk"><SeverityPill :level="p.risk" size="sm" /></div>
      </li>
    </ul>
  </div>
</template>
