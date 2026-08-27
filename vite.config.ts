import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'

type LocalWishRow = {
  id: string
  title: string
  category: string
  note: string
  ownerId: string
  scope: string
  status: string
  starred: boolean
  progressMode: string
  progressCurrent: number
  progressTarget: number
  progressUnit: string
  progressStarCoinValue: number
  completionStarCoinBonus: number
  completedAt: string | null
  steps: Array<Record<string, unknown>>
  comments: Array<Record<string, unknown>>
  images: Array<Record<string, unknown>>
  createdAt: string
  updatedAt: string
}

const localCloudDefaultWishes: LocalWishRow[] = [
  {
    id: 'cloud-wish-1',
    title: '陪伴爸妈吃顿饭',
    category: '家庭',
    note: '每周至少一次陪他们吃饭，聊聊近况。',
    ownerId: 'member-a',
    scope: 'shared',
    status: 'active',
    starred: false,
    progressMode: 'count',
    progressCurrent: 2,
    progressTarget: 8,
    progressUnit: '次',
    progressStarCoinValue: 1,
    completionStarCoinBonus: 2,
    completedAt: null,
    steps: [
      { id: 'step-1', title: '筛选合适日期', starCoinValue: 1, isDone: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
    ],
    comments: [],
    images: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'cloud-wish-2',
    title: '学会游泳',
    category: '健康',
    note: '坚持每周两次训练，慢慢变轻松。',
    ownerId: 'member-b',
    scope: 'shared',
    status: 'active',
    starred: true,
    progressMode: 'count',
    progressCurrent: 5,
    progressTarget: 10,
    progressUnit: '次',
    progressStarCoinValue: 2,
    completionStarCoinBonus: 3,
    completedAt: null,
    steps: [],
    comments: [],
    images: [],
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-20T00:00:00.000Z',
  },
]

function cloneDefaultWishes() {
  return localCloudDefaultWishes.map((wish) => ({ ...wish, steps: [...wish.steps], comments: [...wish.comments], images: [...wish.images] }))
}

function createLocalCloudApiPlugin() {
  const wishStoreBySpace = new Map<string, LocalWishRow[]>()

  function writeJson(res: import('node:http').ServerResponse, payload: unknown, status = 200) {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(payload))
  }

  function getRowsBySpace(spaceId: string) {
    const existing = wishStoreBySpace.get(spaceId)

    if (existing) {
      return existing
    }

    const seeded = cloneDefaultWishes()
    wishStoreBySpace.set(spaceId, seeded)
    return seeded
  }

  return {
    name: 'local-cloud-api',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = req.url ? new URL(req.url, 'http://localhost:3000') : null

        if (!requestUrl) {
          return next()
        }

        if (requestUrl.pathname === '/api/wishes' && req.method === 'GET') {
          const spaceId = requestUrl.searchParams.get('spaceId') || 'space-duo-board'
          const rows = getRowsBySpace(spaceId)
          writeJson(res, { ok: true, data: rows })
          return
        }

        if (requestUrl.pathname === '/api/wishes/progress' && req.method === 'POST') {
          let raw = ''

          req.on('data', (chunk) => {
            raw += chunk
          })

          req.on('end', () => {
            const payload = (raw ? JSON.parse(raw) : {}) as {
              wishId?: string
              nextCurrent?: number
              spaceId?: string
            }

            if (!payload.wishId || typeof payload.nextCurrent !== 'number') {
              writeJson(res, { ok: false, message: '需要 wishId 与 nextCurrent。' }, 400)
              return
            }

            const spaceId = (payload.spaceId || '').trim() || 'space-duo-board'
            const nextCurrent = payload.nextCurrent
            const rows = getRowsBySpace(spaceId)
            const updatedRows = rows.map((wish) => wish.id === payload.wishId
              ? {
                  ...wish,
                  progressCurrent: Math.max(0, Math.min(nextCurrent, wish.progressTarget || nextCurrent)),
                  updatedAt: new Date().toISOString(),
                }
              : wish)

            wishStoreBySpace.set(spaceId, updatedRows)
            writeJson(res, { ok: true, message: '推进已写入 Cloudflare。', data: updatedRows })
          })

          req.on('error', () => {
            writeJson(res, { ok: false, message: '请求体读取失败。' }, 400)
          })

          return
        }

        return next()
      })
    },
  }
}

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.GITHUB_ACTIONS && repoName ? `/${repoName}/` : '/'
const viteCacheRoot = process.env.LOCALAPPDATA || tmpdir()
const viteCacheDir = resolve(viteCacheRoot, 'duo-wish-board-app', 'vite-cache')

// https://vite.dev/config/
export default defineConfig({
  base,
  // Keep Vite prebundle cache outside OneDrive workspace to reduce sync/index overhead.
  cacheDir: viteCacheDir,
  plugins: [
    vue(),
    createLocalCloudApiPlugin(),
    VitePWA({
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
    }),
  ],
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
  },
})
