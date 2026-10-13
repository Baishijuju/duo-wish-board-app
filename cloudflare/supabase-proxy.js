/**
 * Supabase 反向代理（Cloudflare Worker）
 *
 * 为什么需要它
 *   这个应用是「浏览器直连数据库」的架构：前端静态文件放在 Cloudflare（能访问），
 *   但登录令牌、愿望数据、图片、实时推送全部由手机**直接**请求
 *   xxxx.supabase.co —— 这条连接不经过 Cloudflare。
 *   在部分网络环境下 *.supabase.co 会被阻断，表现就是：网页能打开，
 *   但一直停在「本地演示数据」/「同步异常」，挂了 VPN 就立刻正常。
 *
 *   这个 Worker 让手机只跟自己的域名说话（sb.yuetaijie.top，走 Cloudflare），
 *   由 Cloudflare 去访问 Supabase。
 *
 * 部署
 *   1. Cloudflare Dashboard → Workers & Pages → 创建 Worker，粘贴本文件
 *   2. Settings → Variables：本文件里的 SUPABASE_ORIGIN 可直接改，或用环境变量
 *   3. Settings → Domains & Routes → 添加自定义域名 sb.yuetaijie.top
 *   4. 前端 .env 里把 VITE_SUPABASE_URL 改为 https://sb.yuetaijie.top，重新构建部署
 *
 * 安全
 *   只放行 Supabase 的标准路径前缀，避免变成任意网站都能蹭的开放代理。
 *   鉴权仍由 Supabase 自己负责（publishable key + RLS），安全性不降低。
 */

const SUPABASE_ORIGIN = 'https://cimwhpatnazndnnvvfoz.supabase.co'

/** 允许代理的路径前缀 */
const ALLOWED_PREFIXES = ['/auth/v1/', '/rest/v1/', '/storage/v1/', '/realtime/v1/']

/**
 * 逐跳首部（hop-by-hop）与 Cloudflare 注入的首部。
 * 转发时不剔除会导致 content-length 不匹配、连接复用异常等问题。
 */
const STRIP_REQUEST_HEADERS = [
  'host',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'cf-connecting-ip',
  'cf-ipcountry',
  'cf-ray',
  'cf-visitor',
  'cf-worker',
  'x-forwarded-proto',
  'x-real-ip',
]

export default {
  async fetch(request) {
    const incoming = new URL(request.url)

    if (!ALLOWED_PREFIXES.some((prefix) => incoming.pathname.startsWith(prefix))) {
      return new Response('Not Found', { status: 404 })
    }

    const target = new URL(SUPABASE_ORIGIN)
    target.pathname = incoming.pathname
    target.search = incoming.search

    const headers = new Headers(request.headers)
    for (const name of STRIP_REQUEST_HEADERS) {
      headers.delete(name)
    }
    headers.set('Host', target.host)

    const isWebSocketUpgrade = (request.headers.get('Upgrade') ?? '').toLowerCase() === 'websocket'

    if (isWebSocketUpgrade) {
      return proxyWebSocket(target, headers)
    }

    return fetch(target.toString(), {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    })
  },
}

/**
 * Realtime 走 WebSocket，不能靠普通 fetch 透传 101，
 * 必须在 Worker 里做一次双向桥接。
 */
function proxyWebSocket(target, headers) {
  const wsTarget = new URL(target.toString())
  wsTarget.protocol = wsTarget.protocol === 'https:' ? 'wss:' : 'ws:'

  const pair = new WebSocketPair()
  const client = pair[0]
  const server = pair[1]

  server.accept()

  let upstream
  try {
    upstream = new WebSocket(wsTarget.toString(), [])
  } catch (error) {
    server.close(1011, 'upstream websocket failed')
    return new Response(`websocket connect failed: ${error.message}`, { status: 502 })
  }

  // Workers 的出站 WebSocket 也需要 accept() 才会开始接收消息。
  // 不同运行时版本行为略有差异，所以用可选调用兼容。
  if (typeof upstream.accept === 'function') {
    upstream.accept()
  }

  upstream.addEventListener('message', (event) => {
    try {
      server.send(event.data)
    } catch {
      // 客户端可能已经断开，忽略
    }
  })

  upstream.addEventListener('close', (event) => {
    try {
      server.close(event.code, event.reason)
    } catch {
      // 已关闭
    }
  })

  upstream.addEventListener('error', () => {
    try {
      server.close(1011, 'upstream error')
    } catch {
      // 已关闭
    }
  })

  server.addEventListener('message', (event) => {
    try {
      upstream.send(event.data)
    } catch {
      // 上游可能已经断开，忽略
    }
  })

  server.addEventListener('close', (event) => {
    try {
      upstream.close(event.code, event.reason)
    } catch {
      // 已关闭
    }
  })

  return new Response(null, { status: 101, webSocket: client })
}
