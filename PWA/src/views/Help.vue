<script setup>
import { RESOURCES } from '../db.js'
import Icon from '../components/Icon.vue'
</script>

<template>
  <div class="page">
    <header style="margin-bottom: 24px">
      <h1 class="h1-md">You’re not alone.</h1>
      <p class="lede">
        These organizations specialize in helping people who are being watched, monitored, or
        controlled. Reaching out is free and confidential.
      </p>
    </header>

    <div class="crisis">
      <div class="crisis-eyebrow">If you’re in immediate danger</div>
      <div class="crisis-title">Call your local emergency number.</div>
      <div class="crisis-numbers">911 in the US · 999 in the UK · 112 across the EU · 000 in Australia</div>
    </div>

    <div class="resources-list">
      <a v-for="r in RESOURCES" :key="r.name" :href="r.url" target="_blank" rel="noopener noreferrer"
        class="resource">
        <div style="min-width: 0">
          <div class="resource-head">
            <span class="resource-name">{{ r.name }}</span>
            <span class="resource-tag">{{ r.tag }}</span>
          </div>
          <div class="resource-desc">{{ r.desc }}</div>
          <div class="resource-url">{{ r.url }}</div>
        </div>
        <span class="ext-icon"><Icon name="ext" /></span>
      </a>
    </div>

    <div class="privacy-note">
      <strong>A note on your privacy.</strong> This page doesn’t track which links you tap. Visits
      to outside sites can be logged by your browser, your network, or by someone with access to the
      device — consider using a different device if you’re unsure.
    </div>
  </div>
</template>
