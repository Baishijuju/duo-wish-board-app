/**
 * Supabase 反向代理（Cloudflare Worker）
 *
 * 为什么需要它
 *   这个应用是「浏览器直连数据库」的架构：前端静态文件放在 Cloudflare（能访问），
 *   但登录令牌、愿望数据、图片、实时推送全部由手机**直接**请求
 *   xxxx.supabase.co —— 这条连接不经过 Cloudflare。
 *   在部分网络环境下 *.supabase.co 会被阻断，表现就是：网页能打开，
 *   但一直停在「本地演示数据」，挂了 VPN 就立刻正常。
 *
 *   这个 Worker 让手机只跟自己的域名说话（sb.yuetaijie.top，走 Cloudflare），
 *   由 Cloudflare 去访问 Supabase。
 *
 * 部署
 *   Cloudflare Workers Builds 连接本仓库后，push 即自动部署（见仓库根目录 wrangler.toml）。
 *   部署完在 Worker 的 Settings → Domains & Routes 里加上 sb.yuetaijie.top。
 *
 * 安全
 *   只放行 Supabase 的标准路径前缀，避免变成任意网站都能蹭的开放代理。
 *   鉴权仍由 Supabase 自己负责（publishable key + RLS），安全性不降低。
 */

const SUPABASE_ORIGIN = 'https://cimwhpatnazndnnvvfoz.supabase.co'

/** 允许代理的路径前缀 */
const ALLOWED_PREFIXES = ['/auth/v1/', '/rest/v1/', '/storage/v1/', '/realtime/v1/']

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

    // 只删 Host，交给目标 URL 决定。
    //
    // 其余首部**必须原样保留**：
    //   - Upgrade / Connection / Sec-WebSocket-* 是 Realtime 协议升级所需
    //   - 自行删除「逐跳首部」反而会破坏升级握手
    //
    // 早先这里试图用 WebSocketPair + new WebSocket() 手工桥接 Realtime，
    // 实测无法建立连接（Workers 运行时里那不是可用的出站客户端用法）。
    // 直接透传由 Cloudflare 处理 101，才是正确做法。
    headers.delete('host')

    return fetch(target.toString(), {
      method: request.method,
      headers,
      // 协议升级是 GET，不能带 body
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    })
  },
}
