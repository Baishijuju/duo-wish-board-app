import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.GITHUB_ACTIONS && repoName ? `/${repoName}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      id: base,
      name: '双人人生愿望清单',
      short_name: '愿望清单',
      description: '两个人一起记录、推进和回顾愿望的共享清单。',
      lang: 'zh-CN',
      start_url: base,
      scope: base,
      display: 'standalone',
      display_override: ['standalone', 'minimal-ui'],
      orientation: 'portrait-primary',
      background_color: '#fff6eb',
      theme_color: '#efe2cf',
      categories: ['lifestyle', 'productivity'],
      icons: [
        {
          src: 'pwa-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: 'pwa-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: 'maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      cleanupOutdatedCaches: true,
      globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      globIgnores: [
        '**/manifest.webmanifest',
        '**/pwa-icon.svg',
        '**/pwa-maskable-icon.svg',
        '**/pwa-192.png',
        '**/pwa-512.png',
        '**/maskable-512.png',
      ],
      navigateFallback: `${base}index.html`,
    },
  }), cloudflare()],
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
  },
})