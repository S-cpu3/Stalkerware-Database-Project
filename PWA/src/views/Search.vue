<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { findIocs, dbVersion } from '../db.js'
import Icon from '../components/Icon.vue'
import SeverityPill from '../components/SeverityPill.vue'
import TypeChip from '../components/TypeChip.vue'

const router = useRouter()

const q = ref('')
const submitted = ref('')
const matches = ref([])
const loading = ref(false)
const samples = ['mspy', 'flexispy', '185.77', 'cerberus']

async function onSubmit(val) {
  const v = (val ?? q.value).trim()
  if (val !== undefined) q.value = val
  submitted.value = v
  if (!v) { matches.value = []; return }
  loading.value = true
  try {
    matches.value = await findIocs(v)
  } finally {
    loading.value = false
  }
}

// Re-run the last query when the underlying DB is refreshed.
watch(dbVersion, () => { if (submitted.value) onSubmit(submitted.value) })

const matchedApps = computed(() => {
  const seen = new Map()
  for (const m of matches.value) {
    if (m.app && !seen.has(m.app)) {
      seen.set(m.app, { id: m.app, name: m.appName, severity: m.severity })
    }
  }
  const order = { High: 0, Medium: 1, Low: 2 }
  return [...seen.values()].sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9))
})

const primary = computed(() => matchedApps.value[0])
const primaryMatches = computed(() =>
  primary.value ? matches.value.filter(m => m.app === primary.value.id) : []
)
const verdictClass = computed(() => {
  if (!primary.value) return ''
  return primary.value.severity?.toLowerCase()
})

function goHelp() { router.push({ name: 'help' }) }
function goApps() { router.push({ name: 'apps' }) }
function goPerms() { router.push({ name: 'permissions' }) }
function goAppDetail(id) { router.push({ name: 'app-detail', params: { id } }) }
</script>

<template>
  <div class="page">
    <div style="margin-bottom: 44px">
      <div class="eyebrow">
        <span class="eyebrow-dot"></span>
        Runs entirely on your device · nothing is sent anywhere
      </div>
      <h1 class="h1">
        Check whether something on a phone<br>is linked to known stalkerware.
      </h1>
      <p class="lede">
        Paste a domain, app package name, IP address, URL, or file hash. We’ll check it against a
        public database of known surveillance apps and tell you what we find.
      </p>
    </div>

    <form class="search-form" @submit.prevent="onSubmit()">
      <div class="search-box">
        <span class="icon"><Icon name="search" /></span>
        <input v-model="q" placeholder="e.g. api.flexispy.com or com.android.mspy"
          spellcheck="false" autocapitalize="off" autocomplete="off" />
        <button type="submit" class="submit">Check</button>
      </div>
    </form>

    <div class="samples">
      <span class="samples-label">Try:</span>
      <button v-for="s in samples" :key="s" class="sample-chip" @click="onSubmit(s)">{{ s }}</button>
    </div>

    <div v-if="loading" class="loading">Checking…</div>

    <article v-else-if="submitted && primary" class="result-card">
      <div class="verdict" :class="verdictClass">
        <div class="verdict-meta">
          <SeverityPill :level="primary.severity" />
          <span class="verdict-count">
            Match found · {{ matches.length }} indicator{{ matches.length === 1 ? '' : 's' }}
          </span>
        </div>
        <h2>
          <code class="mono">{{ submitted }}</code> is linked to
          <span class="accent">{{ primary.name }}</span>
        </h2>
        <p>{{ matchedApps.length > 1
          ? 'Also linked to: ' + matchedApps.slice(1).map(a => a.name).join(', ') + '.'
          : 'This indicator appears in the public stalkerware-indicators database.' }}</p>
      </div>

      <div class="evidence">
        <div class="section-label">Indicators</div>
        <ul>
          <li v-for="m in primaryMatches" :key="m.id">
            <TypeChip :type="m.type" />
            <div style="min-width: 0">
              <code class="mono">{{ m.value }}</code>
              <div class="src">
                Source: <span class="src-name">{{ m.source }}</span> · {{ m.date }}
              </div>
            </div>
          </li>
        </ul>

        <div class="advisory">
          <span class="warn-icon"><Icon name="warn" /></span>
          <div>
            <div class="title">Before you remove anything</div>
            <p>
              Removing the app can alert the person watching and put you at greater risk. If you can,
              talk to a domestic-violence advocate first — they can help you plan a safer next step.
            </p>
            <button class="help-btn" @click="goHelp">
              Find help near you <Icon name="arrow" />
            </button>
          </div>
        </div>

        <button class="profile-link" @click="goAppDetail(primary.id)">
          See full profile of {{ primary.name }} <Icon name="arrow" />
        </button>
      </div>
    </article>

    <article v-else-if="submitted" class="no-match">
      <div class="no-match-head">
        <span class="no-match-icon"><Icon name="info" /></span>
        <span class="no-match-eyebrow">No match in our database</span>
      </div>
      <h2>We didn’t find <code class="mono">{{ submitted }}</code> in our list.</h2>
      <p>
        That doesn’t mean a phone is safe. Stalkerware authors change domains and rename packages,
        and our database only covers a known set of apps with publicly-published indicators. If
        you’re worried something is wrong, trust that.
      </p>
      <div class="no-match-next">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px">What you can do next</div>
        <ul>
          <li>Browse the
            <button class="link" @click="goApps">known-app directory</button> — an app may be there
            even if this exact value isn’t.</li>
          <li>Check the
            <button class="link" @click="goPerms">dangerous-permissions guide</button> — an app
            asking for the mic, location, and accessibility services together is a red flag,
            regardless of name.</li>
          <li>Talk to a
            <button class="link" @click="goHelp">DV advocate or hotline</button>. They can help you
            think through it without you having to touch the device.</li>
        </ul>
      </div>
    </article>

    <div v-else class="tiles">
      <button class="tile" @click="goPerms">
        <div class="tile-title">What is stalkerware?</div>
        <div class="tile-body">
          Apps installed without your knowledge to monitor your messages, location, mic, or camera.
          Most often used by abusive partners.
        </div>
        <span class="tile-cta">Read more <Icon name="arrow" /></span>
      </button>
      <button class="tile accent" @click="goHelp">
        <div class="tile-title">If you find a match</div>
        <div class="tile-body">
          Don’t remove the app right away. Removal can alert the person watching and put you at
          greater risk. Talk to a DV advocate first.
        </div>
        <span class="tile-cta">Get help <Icon name="arrow" /></span>
      </button>
    </div>
  </div>
</template>
