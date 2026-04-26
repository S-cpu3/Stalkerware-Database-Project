import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['stalkerware_iocs.db', 'sql-wasm.wasm'],
      manifest: {
        name: 'Stalkerware IoC Lookup',
        short_name: 'StalkerwareIoC',
        description: 'Check whether a domain, package, IP, URL, or file hash is linked to known stalkerware.',
        theme_color: '#0b1f3a',
        background_color: '#0b1f3a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,wasm,db,png,svg}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024
      }
    })
  ]
})