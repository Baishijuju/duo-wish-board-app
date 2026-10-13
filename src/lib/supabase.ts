import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const supabaseClientKey = supabasePublishableKey || supabaseAnonKey || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseClientKey)

export const supabaseAuthMode = supabasePublishableKey
  ? 'publishable-key'
  : supabaseAnonKey
    ? 'anon-key'
    : 'not-configured'

/**
 * 最近一次「本地发起云端写入」的时间戳。
 *
 * 为什么需要它
 *   Supabase Realtime 推给本应用的 payload 里 new/old 都是空对象 ——
 *   在同一个页面、用同一个 client 直接订阅同一张表却能拿到完整行，
 *   差异只在于应用那个 channel 的建立方式。结果是「按行 id 匹配回声」
 *   的墓碑逻辑永远命中不了，每次写入都会被误判成他人改动，
 *   触发一次完整的全量同步（实测 5-6 秒）。
 *
 *   既然拿不到行 id，就退一步用「刚才有没有本地写入」来判断。
 *
 * 为什么打点在 client 层
 *   项目里有 59 处云端写入点，逐个打点既繁琐又容易漏。
 *   包住 client 是全部写入的唯一咽喉，以后新增写入路径会自动覆盖。
 */
export const localWriteClock = { lastAt: 0 }

/** 只读 RPC：调用它们不算本地写入，否则会误伤同步过程中的真实事件 */
const READ_ONLY_RPCS = new Set([
  'get_app_capabilities',
  'get_reward_claim_sync_payload',
  'get_reward_claim_review_data',
])

const TABLE_WRITE_METHODS = ['insert', 'upsert', 'update', 'delete'] as const
const STORAGE_WRITE_METHODS = ['upload', 'remove', 'move', 'copy', 'update'] as const

function markLocalWrite() {
  localWriteClock.lastAt = Date.now()
}

/** 把 builder 上的指定方法包一层，调用即记一次本地写入 */
function trackWriteMethods(builder: object, methods: readonly string[]) {
  const target = builder as unknown as Record<string, unknown>

  for (const method of methods) {
    const original = target[method]

    if (typeof original !== 'function') {
      continue
    }

    target[method] = (...args: unknown[]) => {
      markLocalWrite()
      return (original as (...inner: unknown[]) => unknown).apply(builder, args)
    }
  }

  return builder
}

function instrumentLocalWrites(client: SupabaseClient) {
  const originalFrom = client.from.bind(client)
  const originalRpc = client.rpc.bind(client)
  const originalStorageFrom = client.storage.from.bind(client.storage)

  client.from = ((relation: string) =>
    trackWriteMethods(originalFrom(relation), TABLE_WRITE_METHODS)) as typeof client.from

  client.rpc = ((fn: string, ...rest: unknown[]) => {
    if (!READ_ONLY_RPCS.has(fn)) {
      markLocalWrite()
    }

    return (originalRpc as (...args: unknown[]) => unknown)(fn, ...rest)
  }) as typeof client.rpc

  client.storage.from = ((bucket: string) =>
    trackWriteMethods(originalStorageFrom(bucket), STORAGE_WRITE_METHODS)) as typeof client.storage.from

  return client
}

/**
 * 固定会话存储键。
 *
 * supabase-js 默认按 `sb-${URL 主机名的第一段}-auth-token` 生成键名：
 *   https://cimwhpatnazndnnvvfoz.supabase.co -> sb-cimwhpatnazndnnvvfoz-auth-token
 *
 * 一旦把 VITE_SUPABASE_URL 换成本项目的自建反代域名（见 cloudflare/supabase-proxy.js），
 * 主机名变成 sb.yuetaijie.top，第一段就成了 "sb"，键名会变成 sb-sb-auth-token。
 * 后果不是「提示重新登录」，而是应用去错误的位置找会话、静默当作未登录：
 * 请求不带令牌 -> 401 (42501 permission denied) -> 界面显示同步异常，
 * 已登录的用户看起来像是数据坏了。
 *
 * 因此把键名固定为项目原始取值：换域名不丢登录态，两人都不需要重新登录。
 * 如果将来更换 Supabase 项目，这里要一并改。
 */
const SUPABASE_PROJECT_REF = 'cimwhpatnazndnnvvfoz'
const SUPABASE_AUTH_STORAGE_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? instrumentLocalWrites(
      createClient(supabaseUrl ?? '', supabaseClientKey, {
        auth: {
          detectSessionInUrl: true,
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          storageKey: SUPABASE_AUTH_STORAGE_KEY,
        },
      }),
    )
  : null

export const supabaseReadinessMessage = isSupabaseConfigured
  ? `环境变量已就绪，当前前端将使用 ${supabaseAuthMode} 连接 Supabase。`
  : '尚未配置 VITE_SUPABASE_URL 与 VITE_SUPABASE_PUBLISHABLE_KEY，当前使用本地 mock 数据。'

/**
 * 把 Supabase 返回的签名 URL 改写到当前配置的域名上。
 *
 * 为什么必须做
 *   createSignedUrls / getPublicUrl 返回的是**绝对地址**，主机名永远是项目
 *   原始域名（*.supabase.co）。当 VITE_SUPABASE_URL 指向自建反代域名时
 *   （用于绕开 supabase.co 在部分地区被阻断的问题），图片请求如果还指向
 *   原始域名，就会绕过反代、直连那条已经不通的路径 —— 表现为数据都正常，
 *   只有图片全部加载失败。
 *
 * 未配置反代时是空操作，行为与之前完全一致。
 */
const configuredSupabaseOrigin = (() => {
  if (!supabaseUrl) {
    return ''
  }

  try {
    return new URL(supabaseUrl).origin
  } catch {
    return ''
  }
})()

export function rewriteSignedStorageUrl(url: string) {
  if (!url || !configuredSupabaseOrigin) {
    return url
  }

  try {
    const parsed = new URL(url)

    if (parsed.hostname.endsWith('.supabase.co') || parsed.hostname.endsWith('.supabase.in')) {
      const configured = new URL(configuredSupabaseOrigin)
      parsed.protocol = configured.protocol
      parsed.host = configured.host
      return parsed.toString()
    }
  } catch {
    // 相对路径或非法 URL：原样返回，交给上层处理
  }

  return url
}
