import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import os from 'node:os'
import path from 'node:path'

const email = process.env.BENCH_EMAIL || 'tai-jie.yue@basf.com'
const phase = process.env.BENCH_PHASE || 'baseline'
const baseUrl = process.env.BENCH_BASE_URL || 'http://127.0.0.1:3000'
const wishId = process.env.BENCH_WISH_ID || '0bcb2f4b-415b-4a1f-a088-aa4bcacd0483'
const imagePath = process.env.BENCH_IMAGE_PATH || 'C:/Users/YUETJ/OneDrive - BASF/2 Python Learning/2 待完成代码/人生愿望清单/0112_7.jpg'
const authStatePath = process.env.BENCH_AUTH_STATE || path.join(os.tmpdir(), 'duo-wish-bench-auth.json')
const timeout = Number(process.env.BENCH_TIMEOUT || 60_000)

function now() {
  return Date.now()
}

async function mark(label, started, promise) {
  try {
    await promise
    return { label, ms: now() - started, ok: true }
  } catch (error) {
    return {
      label,
      ms: null,
      ok: false,
      error: String(error?.message || error).slice(0, 300),
    }
  }
}

async function ensureLoggedIn(page, context) {
  await page.goto(`${baseUrl}/settings`, { waitUntil: 'networkidle' })
  await page.locator('details.space-utility-card-access').evaluate((element) => {
    element.open = true
  })

  if (await page.locator('details.space-utility-card-access').getByText('已进入').count()) {
    return
  }

  const access = page.locator('details.space-utility-card-access').first()
  await access.locator('input[type=email]').fill(email)
  await access.getByRole('button', { name: /发送验证邮件|发送中/ }).click()
  await page.waitForTimeout(500)
  const feedback = await access.locator('.feedback-message').innerText().catch(() => '')

  console.log(`验证码邮件已发送到 ${email}。${feedback}`)
  console.log('请在这个终端输入邮箱里的验证码，然后按 Enter。不要把验证码发到聊天窗口。')

  const reader = readline.createInterface({ input, output })
  const otp = (await reader.question('邮箱验证码: ')).trim()
  reader.close()

  if (!otp) {
    throw new Error('未输入验证码')
  }

  await access.locator('input[placeholder="输入邮件里的验证码"]').fill(otp)
  await access.getByRole('button', { name: /确认进入|校验中/ }).click()
  await page.waitForFunction(
    () => document.body.innerText.includes('邮箱验证码校验成功')
      || document.body.innerText.includes('已登录')
      || document.body.innerText.includes('已进入'),
    null,
    { timeout },
  )
  await context.storageState({ path: authStatePath })
}

async function runBenchmark() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    storageState: existsSync(authStatePath) ? authStatePath : undefined,
    viewport: { width: 390, height: 844 },
  })
  const page = await context.newPage()

  try {
    await ensureLoggedIn(page, context)
    await page.goto(`${baseUrl}/wish/${wishId}#progress`, { waitUntil: 'networkidle' })

    const form = page.locator('form.detail-atelier-comment-form.is-front').first()
    await form.waitFor({ state: 'visible', timeout })

    const textareas = await page.locator('textarea').count()
    const uploadInputs = await form.locator('input[type=file]').count()

    if (!textareas || !uploadInputs) {
      throw new Error(`登录后仍未找到评论或上传控件: textareas=${textareas} uploadInputs=${uploadInputs} url=${page.url()}`)
    }

    const commentText = `测速评论 ${phase} ${new Date().toISOString()}`
    const selectedStart = now()

    await form.locator('textarea').fill(commentText)
    await form.locator('input[type=file]').first().setInputFiles(imagePath)

    const selectedMs = now() - selectedStart
    const submitButton = form.locator('button[type=submit]').first()
    const started = now()
    const checks = [
      mark('busy', started, page.waitForFunction(() => {
        const button = document.querySelector('form.detail-atelier-comment-form.is-front button[type=submit]')
        return Boolean(button && (button.disabled || button.textContent?.includes('发送中')))
      }, null, { timeout })),
      mark('feedback', started, page.waitForFunction(() => {
        const element = document.querySelector('.detail-atelier-feedback')
        return Boolean(element && /已|成功|收到|发/.test(element.textContent || ''))
      }, null, { timeout })),
      mark('buttonRecovered', started, page.waitForFunction(() => {
        const button = document.querySelector('form.detail-atelier-comment-form.is-front button[type=submit]')
        return Boolean(button && !button.disabled && button.textContent?.includes('发送留言'))
      }, null, { timeout })),
      mark('commentVisible', started, page.waitForFunction((text) => {
        return Array.from(document.querySelectorAll('.detail-atelier-thread-message,.detail-atelier-thread-entry'))
          .some((element) => element.textContent?.includes(text))
      }, commentText, { timeout })),
      mark('pendingImageVisible', started, page.waitForFunction((text) => {
        const entries = Array.from(document.querySelectorAll('.detail-atelier-thread-entry'))
        const entry = entries.find((element) => element.textContent?.includes(text))

        return Boolean(entry?.textContent?.includes('这张图正在出现'))
      }, commentText, { timeout })),
      mark('imageVisible', started, page.waitForFunction((text) => {
        const entries = Array.from(document.querySelectorAll('.detail-atelier-thread-entry'))
        const entry = entries.find((element) => element.textContent?.includes(text))

        if (!entry) {
          return false
        }

        return Array.from(entry.querySelectorAll('img.detail-atelier-thread-image'))
          .some((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)
      }, commentText, { timeout })),
    ]

    await submitButton.click()
    const results = await Promise.all(checks)
    const uploadedImages = await page.evaluate(async ({ text, targetWishId }) => {
      const { supabase } = await import('/src/lib/supabase.ts')
      const { data: comment, error: commentError } = await supabase
        .from('wish_comments')
        .select('id')
        .eq('wish_id', targetWishId)
        .eq('body', text)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (commentError || !comment?.id) {
        return { ok: false, error: commentError?.message || 'comment row not found', images: [] }
      }

      const { data: images, error: imagesError } = await supabase
        .from('wish_comment_images')
        .select('id, file_name, mime_type, size_bytes')
        .eq('comment_id', comment.id)
        .order('sort_order', { ascending: true })

      if (imagesError) {
        return { ok: false, error: imagesError.message, images: [] }
      }

      return { ok: true, images: images ?? [] }
    }, { text: commentText, targetWishId: wishId })

    console.log(JSON.stringify({
      phase,
      targetUrl: page.url(),
      imagePath,
      commentText,
      selectedMs,
      uploadedImages,
      results,
    }, null, 2))
  } finally {
    await browser.close()
  }
}

runBenchmark().catch((error) => {
  console.error('BENCHMARK_FAILED')
  console.error(error)
  process.exit(1)
})