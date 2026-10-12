#!/usr/bin/env node
/**
 * 登录后同步耗时基准测量
 *
 * 做什么
 *   用有头 Chromium 打开应用，重新加载页面，记录从导航到头部出现「同步正常」
 *   之间的全部 Supabase 请求，输出总耗时 / 请求数 / 响应字节与请求瀑布。
 *
 * 为什么需要它
 *   同步耗时对「往返次数」极其敏感（本机到 Singapore 单次 RTT 约 200-350ms），
 *   改动同步相关代码后很容易在不知不觉中变慢。有了它，性能回归就有据可查。
 *
 * 用法
 *   npm run perf:sync                     默认 3 次，取均值（单次有 ±500ms 噪声）
 *   npm run perf:sync -- --runs 5         指定次数
 *   npm run perf:sync -- --base-url http://localhost:4173
 *   npm run perf:sync -- --budget 2500    均值超过该毫秒数时以非 0 退出（可用于门禁）
 *
 * 前置条件
 *   1. 目标服务已在运行（默认 http://localhost:3000，即 npm run dev）
 *   2. 首次使用需要登录一次：脚本会打开浏览器并等待，登录态保存在
 *      .e2e/chrome-profile（已 gitignore），之后无需重复登录
 *
 * 基线（2026-10-11，dev server，真实云端数据）
 *   优化前 8,952ms / 24 请求 / 1,536KB  ->  优化后约 2,950ms / 17 请求 / 507KB
 */

import { chromium } from '@playwright/test'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const PROFILE = resolve(ROOT, '.e2e', 'chrome-profile')

function readArg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const RUNS = Math.max(1, Number.parseInt(readArg('runs', '3'), 10) || 3)
const BASE_URL = readArg('base-url', 'http://localhost:3000').replace(/\/$/, '')
const BUDGET_MS = Number.parseInt(readArg('budget', ''), 10) || 0

const hasSession = (page) =>
  page.evaluate(() => Object.keys(localStorage).some((key) => key.includes('-auth-token')))

async function preflight() {
  try {
    const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  } catch (error) {
    console.error(`无法访问 ${BASE_URL} —— ${error.message}`)
    console.error('请先启动开发服务器：npm run dev（或 .\\npm22.cmd run dev）')
    process.exit(1)
  }
}

/** 采集一次：返回 { totalMs, requests[], bytes } */
async function measureOnce(context, page, index) {
  const inflight = new Map()

  const onRequest = (req) => {
    inflight.set(req, { url: req.url(), method: req.method(), start: Date.now() })
  }
  const onFinished = async (req) => {
    const rec = inflight.get(req)
    if (!rec) return
    rec.end = Date.now()
    rec.duration = rec.end - rec.start
    try {
      const res = await req.response()
      rec.status = res?.status()
      rec.bytes = (await res?.body().catch(() => null))?.length ?? 0
    } catch { /* 忽略 */ }
  }
  const onFailed = (req) => {
    const rec = inflight.get(req)
    if (!rec) return
    rec.end = Date.now()
    rec.duration = rec.end - rec.start
    rec.failed = req.failure()?.errorText ?? 'unknown'
  }

  page.on('request', onRequest)
  page.on('requestfinished', onFinished)
  page.on('requestfailed', onFailed)

  inflight.clear()
  const navAt = Date.now()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.body.innerText.includes('同步正常'), null, { timeout: 180_000 })
  const syncedAt = Date.now()
  await page.waitForTimeout(2500) // 收尾，确保请求记录完整

  page.off('request', onRequest)
  page.off('requestfinished', onFinished)
  page.off('requestfailed', onFailed)

  const requests = [...inflight.values()]
    .filter((r) => r.url.includes('supabase.co'))
    .map((r) => ({
      path: r.url.replace(/^https?:\/\/[^/]+/, '').split('?')[0],
      status: r.status ?? (r.failed ? `FAIL:${r.failed}` : '?'),
      startOffset: r.start - navAt,
      duration: r.duration ?? 0,
      bytes: r.bytes ?? 0,
    }))
    .sort((a, b) => a.startOffset - b.startOffset)

  const totalMs = syncedAt - navAt
  const bytes = requests.reduce((sum, r) => sum + r.bytes, 0)

  console.log(
    `  第 ${index} 次: ${String(totalMs).padStart(6)}ms   ${String(requests.length).padStart(2)} 请求   ` +
    `${(bytes / 1024).toFixed(1).padStart(7)} KB`,
  )

  return { totalMs, requests, bytes }
}

await preflight()
mkdirSync(resolve(ROOT, '.e2e'), { recursive: true })

if (!existsSync(PROFILE)) {
  console.log('首次运行：将打开浏览器，请完成一次登录（登录态会被保留，之后无需重复登录）。')
}

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1440, height: 900 },
})
const page = context.pages()[0] ?? (await context.newPage())

console.log(`目标: ${BASE_URL}    测量次数: ${RUNS}\n`)

await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

if (!(await hasSession(page))) {
  console.log('未检测到登录态 —— 请在浏览器里完成登录，最多等待 180 秒…')
  const start = Date.now()
  while (!(await hasSession(page))) {
    if (Date.now() - start > 180_000) {
      console.error('仍未登录，退出。')
      await context.close()
      process.exit(1)
    }
    await page.waitForTimeout(1500)
  }
  console.log('已登录。\n')
}

const results = []
for (let index = 1; index <= RUNS; index += 1) {
  results.push(await measureOnce(context, page, index))
}

const totals = results.map((r) => r.totalMs).sort((a, b) => a - b)
const mean = Math.round(totals.reduce((sum, value) => sum + value, 0) / totals.length)
const requestCount = results[0].requests.length
const bytes = results[0].bytes

console.log('\n================ 汇总 ================')
console.log(`总耗时  均值 ${mean}ms   最小 ${totals[0]}ms   最大 ${totals[totals.length - 1]}ms`)
console.log(`请求数  ${requestCount}`)
console.log(`字节    ${(bytes / 1024).toFixed(1)} KB`)

console.log('\n--- 最后一次的请求瀑布 ---')
for (const r of results[results.length - 1].requests) {
  console.log(
    `${String(r.startOffset).padStart(6)}ms ${String(r.duration).padStart(6)}ms ` +
    `${String(r.status).padEnd(6)} ${String(r.bytes).padStart(7)}B  ${r.path}`,
  )
}

await context.close()

if (BUDGET_MS && mean > BUDGET_MS) {
  console.error(`\n❌ 均值 ${mean}ms 超过预算 ${BUDGET_MS}ms`)
  process.exit(1)
}

if (BUDGET_MS) console.log(`\n✅ 均值 ${mean}ms 在预算 ${BUDGET_MS}ms 之内`)
