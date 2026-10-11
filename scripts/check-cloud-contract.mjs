#!/usr/bin/env node
/**
 * 免凭据云端契约探测
 *
 * 用前端 publishable key 逐个探测 supabase/CONTRACT.md 里声明的数据库对象，
 * 不需要 Supabase CLI、不需要登录、不需要数据库密码。
 *
 * 原理：
 *   对象存在但被 RLS 拒绝 → HTTP 401 + 42501 permission denied
 *   对象不存在            → PostgREST 返回 PGRST205 / PGRST202
 * 因此可以仅凭「错误类型」区分「存在但无权」与「根本不存在」。
 *
 * 用法：
 *   node scripts/check-cloud-contract.mjs
 *   node scripts/check-cloud-contract.mjs --json    # 输出机器可读结果
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** CONTRACT.md 声明的必需表 */
const TABLES = [
  'spaces',
  'space_members',
  'wishes',
  'wish_steps',
  'wish_comments',
  'wish_comment_images',
  'wish_images',
  'reward_pool_items',
  'reward_claims',
  'wish_threads',
  'wish_thread_images',
  'thread_reactions',
  'monthly_journal_snapshots',
  'shared_boards',
  'shared_board_todos',
]

/**
 * CONTRACT.md 声明的必需 RPC，附带真实参数名（取自 migrations 中的函数定义）。
 *
 * 为什么带参数名探测是安全的：
 *   这些函数体第一句都是 `if auth.uid() is null then raise exception ...`，
 *   未登录时会在做任何读写之前就抛出 P0001，因此传全 null 参数只会触发守卫。
 *   带参数名调用还能消除歧义 —— PostgREST 按签名解析，参数名匹配后
 *   「存在」返回 P0001，而「不存在」仍返回 PGRST202，两者即可区分。
 */
const RPCS = [
  { name: 'get_app_capabilities', args: {} },
  { name: 'create_personal_space', args: { space_name_input: null, invite_code_input: null, display_name_input: null } },
  { name: 'ensure_bound_space_memberships', args: {} },
  { name: 'join_space_by_invite', args: { invite_code_input: null, display_name_input: null } },
  { name: 'bind_email_to_space', args: { target_space_id: null, email_input: null, role_input: null, display_name_input: null } },
  { name: 'set_wish_image_cover', args: { target_wish_id: null, target_image_id: null } },
  { name: 'set_wish_image_order', args: { target_wish_id: null, ordered_image_ids: null } },
  { name: 'update_wish_image_note', args: { target_wish_id: null, target_image_id: null, next_note: null } },
  { name: 'complete_wish_with_reward', args: { target_wish_id: null, target_reward_item_id: null } },
  { name: 'claim_completed_step_reward', args: { target_wish_id: null, target_step_id: null, target_reward_item_id: null, claim_star_coin: null } },
  { name: 'claim_count_progress_reward', args: { target_wish_id: null, target_reward_item_id: null, claim_star_coin: null, claim_quantity: null } },
  { name: 'redeem_premium_reward', args: { target_reward_item_id: null } },
  { name: 'ensure_monthly_journal_snapshots', args: { target_space_id: null } },
]

/** CONTRACT.md 声明的 Storage bucket */
const BUCKETS = ['wish-images', 'wish-comment-images']

function loadEnv() {
  for (const file of ['.env.local', '.env.production', '.env.example']) {
    const path = resolve(root, file)
    if (!existsSync(path)) continue

    const parsed = {}
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      if (line.trim().startsWith('#')) continue
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
      if (match) parsed[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }

    const url = parsed.VITE_SUPABASE_URL
    const key = parsed.VITE_SUPABASE_PUBLISHABLE_KEY || parsed.VITE_SUPABASE_ANON_KEY
    if (url && key && !url.includes('your-project')) {
      return { url: url.replace(/\/$/, ''), key, source: file }
    }
  }
  throw new Error('未找到可用的 Supabase 配置（.env.local / .env.production）')
}

/**
 * 把一次探测响应归类。
 *
 * 关键限制：PostgREST 是按「参数签名」解析函数的。用空对象调用时，
 * 「存在但需要参数」和「根本不存在」都会返回 PGRST202，两者无法区分。
 * 因此函数探测在 PGRST202 时只能标记为 ambiguous，不能判定为缺失。
 */
function classify(status, body, kind = 'table') {
  const text = typeof body === 'string' ? body : JSON.stringify(body ?? {})
  const code = (body && typeof body === 'object' && body.code) || ''

  if (status === 200) return { state: 'ok', detail: '可匿名访问' }
  // 42501：对象存在，但当前角色无权访问
  if (code === '42501' || /permission denied/i.test(text)) return { state: 'exists', detail: '存在（RLS 已拦截）' }
  // P0001：函数自身的业务/权限守卫被触发，说明函数存在且已执行
  if (code === 'P0001') return { state: 'exists', detail: '存在（被自身守卫拒绝）' }
  // 42P01 / PGRST205：关系确实不存在
  if (code === 'PGRST205' || code === '42P01' || /relation .* does not exist/i.test(text)) {
    return { state: 'missing', detail: '不存在' }
  }
  if (code === 'PGRST202') {
    return kind === 'rpc'
      ? { state: 'ambiguous', detail: '无法判定（带参数与不存在同码）' }
      : { state: 'missing', detail: '不存在' }
  }
  if (status === 400 || status === 404) return { state: 'exists', detail: `存在（HTTP ${status}）` }
  return { state: 'unknown', detail: `HTTP ${status} ${text.slice(0, 90)}` }
}

async function probe(url, key, path, init = {}) {
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  const raw = await res.text()
  let body = raw
  try { body = raw ? JSON.parse(raw) : {} } catch { /* 保留原始文本 */ }
  return { status: res.status, body }
}

async function main() {
  const asJson = process.argv.includes('--json')
  const { url, key, source } = loadEnv()

  const results = { tables: [], rpcs: [], buckets: [] }

  for (const table of TABLES) {
    const { status, body } = await probe(url, key, `/rest/v1/${table}?select=*&limit=0`)
    results.tables.push({ name: table, ...classify(status, body) })
  }

  for (const rpc of RPCS) {
    const { status, body } = await probe(url, key, `/rest/v1/rpc/${rpc.name}`, {
      method: 'POST',
      body: JSON.stringify(rpc.args),
    })
    results.rpcs.push({ name: rpc.name, ...classify(status, body, 'rpc') })
  }

  for (const bucket of BUCKETS) {
    const { status, body } = await probe(url, key, `/storage/v1/bucket/${bucket}`)
    results.buckets.push({ name: bucket, ...classify(status, body) })
  }

  if (asJson) {
    console.log(JSON.stringify({ url, source, ...results }, null, 2))
    return
  }

  const icon = { ok: '✅', exists: '✅', missing: '❌', ambiguous: '❓', unknown: '⚠️' }
  const label = { ok: '存在·可匿名读', exists: '存在', missing: '缺失', ambiguous: '无法判定', unknown: '未知' }

  console.log(`\n云端契约探测  ${url}`)
  console.log(`配置来源      ${source}\n`)

  for (const [title, rows] of [['数据表', results.tables], ['RPC 函数', results.rpcs], ['Storage Bucket', results.buckets]]) {
    const missing = rows.filter((r) => r.state === 'missing').length
    const ambiguous = rows.filter((r) => r.state === 'ambiguous').length
    const suffix = ambiguous ? `，${ambiguous} 无法判定` : ''
    console.log(`── ${title}（${rows.length - missing - ambiguous}/${rows.length} 确认存在${suffix}）${'─'.repeat(14)}`)
    for (const row of rows) {
      console.log(`  ${icon[row.state] ?? '⚠️'} ${row.name.padEnd(34)} ${label[row.state] ?? row.state}`)
    }
    console.log('')
  }

  const all = [...results.tables, ...results.rpcs, ...results.buckets]
  const missing = all.filter((r) => r.state === 'missing')
  const ambiguous = all.filter((r) => r.state === 'ambiguous')
  const unknown = all.filter((r) => r.state === 'unknown')
  const confirmed = all.length - missing.length - ambiguous.length - unknown.length

  console.log('═'.repeat(62))
  console.log(`合计 ${all.length} 项：确认存在 ${confirmed}，缺失 ${missing.length}，无法判定 ${ambiguous.length}，未知 ${unknown.length}`)
  if (missing.length) console.log(`缺失项：${missing.map((r) => r.name).join(', ')}`)
  if (ambiguous.length) {
    console.log(`无法判定：${ambiguous.map((r) => r.name).join(', ')}`)
    console.log('  ↑ 这些函数带参数，免凭据方式无法区分「存在但需参数」与「不存在」。')
    console.log('    要确认请用：npm run supabase -- db query --linked（需先 login 并 link）')
  }
  if (unknown.length) console.log(`未知项：${unknown.map((r) => `${r.name}(${r.detail})`).join(', ')}`)
  console.log('')
}

main().catch((error) => {
  console.error('探测失败：', error.message)
  process.exitCode = 1
})
