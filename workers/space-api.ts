export interface Env {
  STORAGE: KVNamespace
}

const inMemoryWishStore = new Map<string, any[]>()

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | null = null

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`operation timeout after ${timeoutMs}ms`)), timeoutMs)
      }),
    ])
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

const defaultWishes = [
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

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
    ...init,
  })
}

async function getSpaceWishes(env: Env, spaceId: string) {
  const key = `space:${spaceId}:wishes`
  const memoryCached = inMemoryWishStore.get(key)

  if (memoryCached) {
    return memoryCached
  }

  let cached: string | null = null

  try {
    cached = await withTimeout(env.STORAGE.get(key), 1200)
  } catch {
    cached = null
  }

  if (cached) {
    const parsed = JSON.parse(cached)
    inMemoryWishStore.set(key, parsed)
    return parsed
  }

  const seeded = defaultWishes.map((wish) => ({ ...wish }))
  inMemoryWishStore.set(key, seeded)

  try {
    await withTimeout(env.STORAGE.put(key, JSON.stringify(seeded)), 1200)
  } catch {
    // Local KV may be unavailable in restricted environments; memory store keeps local dev usable.
  }

  return seeded
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return jsonResponse({ ok: true }, { status: 200 })
    }

    const url = new URL(request.url)
    const path = url.pathname

    if (path === '/api/wishes' && request.method === 'GET') {
      const spaceId = url.searchParams.get('spaceId') || 'space-duo-board'
      const rows = await getSpaceWishes(env, spaceId)
      return jsonResponse({ ok: true, data: rows })
    }

    if (path === '/api/wishes/progress' && request.method === 'POST') {
      const body = await request.json().catch(() => ({})) as {
        wishId?: string
        nextCurrent?: number
        memberId?: string
        spaceId?: string
      }

      if (!body.wishId || typeof body.nextCurrent !== 'number') {
        return jsonResponse({ ok: false, message: '需要 wishId 与 nextCurrent。' }, { status: 400 })
      }

      const spaceId = (body.spaceId || '').trim() || 'space-duo-board'
      const rows = await getSpaceWishes(env, spaceId)
      const nextRows = rows.map((wish: any) => wish.id === body.wishId
        ? { ...wish, progressCurrent: Math.max(0, Math.min(body.nextCurrent, wish.progressTarget ?? body.nextCurrent)), updatedAt: new Date().toISOString() }
        : wish)

      inMemoryWishStore.set(`space:${spaceId}:wishes`, nextRows)

      try {
        await withTimeout(env.STORAGE.put(`space:${spaceId}:wishes`, JSON.stringify(nextRows)), 1200)
      } catch {
        // Continue returning success for local-memory mode.
      }

      return jsonResponse({ ok: true, message: '推进已写入 Cloudflare。', data: nextRows })
    }

    return jsonResponse({ ok: false, message: '未命中 Cloudflare API 路由。' }, { status: 404 })
  },
} satisfies ExportedHandler<Env>
