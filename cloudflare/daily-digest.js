/**
 * 每日打卡提醒 —— Cloudflare Worker（定时触发）
 *
 * 为什么放在 Cloudflare 上跑：手机直连 supabase.co 是被阻断的（本项目实测），
 * 所以任何「手机上的应用自己查数据再提醒」的方案都不可靠。
 * 定时任务在 Cloudflare 上执行、服务端直连 Supabase，手机只负责收一条微信。
 *
 * 手动预览（不发消息，只返回将要发送的内容）：
 *   GET https://<worker>/today?key=<DIGEST_KEY>
 *
 * 需要配置的环境变量（用 wrangler secret put 设置）：
 *   SUPABASE_URL               https://cimwhpatnazndnnvvfoz.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  Supabase 的 service_role key（只存在 Worker 里，不下发浏览器）
 *   SERVERCHAN_KEY             Server酱 SendKey
 *   DIGEST_KEY                 预览接口的访问口令，随便一串随机字符
 */

const TIMEZONE = 'Asia/Shanghai'
const STREAK_LOOKBACK_DAYS = 60

/** 取「北京时间的今天」，形如 2026-10-22 */
function beijingDateKey(offsetDays = 0) {
  const now = new Date(Date.now() + offsetDays * 86_400_000)
  // 用 en-CA 拿到 YYYY-MM-DD 格式
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(now)
}

async function supabaseGet(env, path) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${(await response.text()).slice(0, 200)}`)
  }

  return response.json()
}

/**
 * 日期串偏移，纯函数（不读当前时间，便于单测）
 * shiftDateKey('2026-10-22', -1) → '2026-10-21'
 */
export function shiftDateKey(dateKey, offsetDays) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + offsetDays)).toISOString().slice(0, 10)
}

/**
 * 连续打卡天数。
 *
 * 关键：不能简单「从今天往回数」——那会在每天还没打卡时算出 0，
 * 于是每天早上的提醒变成「连续 0 天」，把鼓励变成打击。
 *
 * 正确语义：
 *   - 今天已推进           → 从今天往回数
 *   - 今天没推进、昨天有   → 从昨天往回数（连击仍然「活着」）
 *   - 最后一次推进早于昨天 → 连击已断，返回 0
 */
export function computeStreak(activeDates, today) {
  const active = new Set(activeDates)

  let anchorOffset

  if (active.has(today)) {
    anchorOffset = 0
  } else if (active.has(shiftDateKey(today, -1))) {
    anchorOffset = 1
  } else {
    return 0
  }

  let streak = 0

  // 从锚点那天往回逐日数，遇到空档就停
  while (streak < STREAK_LOOKBACK_DAYS && active.has(shiftDateKey(today, -(anchorOffset + streak)))) {
    streak += 1
  }

  return streak
}

/** 汇总今日数据，并组装消息文案 */
async function buildDigest(env) {
  const today = beijingDateKey()
  const since = beijingDateKey(-STREAK_LOOKBACK_DAYS)

  const [todayRows, recentRows] = await Promise.all([
    supabaseGet(env, `wish_count_progress_daily?select=progress_units&progress_date=eq.${today}`),
    supabaseGet(env, `wish_count_progress_daily?select=progress_date,progress_units&progress_date=gte.${since}&progress_units=gt.0`),
  ])

  const todayUnits = todayRows.reduce((sum, row) => sum + (row.progress_units ?? 0), 0)
  const activeDates = [...new Set(recentRows.map((row) => row.progress_date))]
  const streak = computeStreak(activeDates, today)

  // TODO 星币：需要确认它的计算来源（现有库里没有直接存「今日星币」的字段），
  // 确认后在这里补一个查询并拼进下面的文案。
  const starCoins = null

  const hasProgress = todayUnits > 0

  const lines = []

  if (hasProgress) {
    lines.push(`今天已经推进 ${todayUnits} 次 ✅`)
  } else {
    lines.push('今天还一次都没推进 —— 去推一下吧，哪怕一点点')
  }

  if (streak > 0) {
    lines.push(hasProgress ? `连续打卡 ${streak} 天` : `连续 ${streak} 天还没断，今天补上就保住了`)
  }

  if (starCoins !== null) {
    lines.push(`今日星币 ${starCoins}`)
  }

  return {
    today,
    todayUnits,
    hasProgress,
    streak,
    starCoins,
    title: hasProgress ? `今天推进了 ${todayUnits} 次` : '今天还没开板',
    body: lines.join('\n'),
  }
}

async function sendToWeChat(env, digest) {
  // Server酱：POST 表单到 sctapi.ftqq.com/<SendKey>.send
  const response = await fetch(`https://sctapi.ftqq.com/${env.SERVERCHAN_KEY}.send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      title: digest.title,
      desp: digest.body,
    }),
  })

  if (!response.ok) {
    throw new Error(`Server酱 ${response.status}: ${(await response.text()).slice(0, 200)}`)
  }

  return response.json()
}

/**
 * 文案测试用：用假数据渲染指定分支并发送。
 * 只通过 /test 手动触发，cron 永远不会走到这里 ——
 * 不能为了测文案去改真实数据。
 */
const TEST_CASES = {
  a1: {
    title: '今天，星星又亮了几颗 ✨',
    body: [
      '今天有星星亮起来了',
      '推进 3 次 · 星币 +2.5',
      '连续 6 天',
      '慢慢来就好 ( ˘ω˘ )',
    ].join('\n'),
  },
}

function buildTestDigest(caseKey) {
  return TEST_CASES[caseKey] ?? null
}

export default {
  /** 定时触发 */
  async scheduled(_event, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const digest = await buildDigest(env)
        await sendToWeChat(env, digest)
        console.log('digest sent', JSON.stringify(digest))
      } catch (error) {
        console.error('digest failed', error?.message ?? error)
        throw error
      }
    })())
  },

  /** 手动预览：只算不发，用来核对数字 */
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/today') {
      if (!env.DIGEST_KEY || url.searchParams.get('key') !== env.DIGEST_KEY) {
        return new Response('Not Found', { status: 404 })
      }

      try {
        const digest = await buildDigest(env)
        return Response.json({ ok: true, ...digest })
      } catch (error) {
        return Response.json({ ok: false, error: error?.message ?? String(error) }, { status: 500 })
      }
    }

    if (url.pathname === '/test') {
      if (!env.DIGEST_KEY || url.searchParams.get('key') !== env.DIGEST_KEY) {
        return new Response('Not Found', { status: 404 })
      }

      const digest = buildTestDigest(url.searchParams.get('case') ?? 'a1')

      if (!digest) {
        return new Response('Unknown case', { status: 400 })
      }

      await sendToWeChat(env, digest)

      return Response.json({ ok: true, sent: digest })
    }

    return new Response('Not Found', { status: 404 })
  },
}
