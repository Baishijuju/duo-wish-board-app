import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseUrl = process.env.SEED_BASE_URL || process.env.BENCH_BASE_URL || 'http://127.0.0.1:3000'
const authStatePath = process.env.SEED_AUTH_STATE || process.env.BENCH_AUTH_STATE || path.join(os.tmpdir(), 'duo-wish-bench-auth.json')
const authStorageKey = 'duo-wish-board-auth:v2'

if (!existsSync(authStatePath)) {
  throw new Error(`没有找到登录态文件：${authStatePath}。先运行 node scripts/benchmark-comment-upload.mjs 完成一次 OTP 登录。`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    storageState: authStatePath,
    viewport: { width: 1280, height: 900 },
  })
  const page = await context.newPage()

  try {
    await page.goto(`${baseUrl}/settings`, { waitUntil: 'networkidle' })
    await page.waitForFunction((key) => {
      const raw = localStorage.getItem(key)

      if (!raw) {
        return false
      }

      try {
        return JSON.parse(raw).dataMode === 'supabase'
      } catch {
        return false
      }
    }, authStorageKey, { timeout: 30_000 })
    await context.storageState({ path: authStatePath })

    const report = await page.evaluate(async ({ authStorageKey }) => {
      const { supabase } = await import('/src/lib/supabase.ts')
      const rawAuth = localStorage.getItem(authStorageKey)
      const authState = rawAuth ? JSON.parse(rawAuth) : null
      const seedStamp = new Date().toISOString().replace(/[:.]/g, '-')
      const seedPrefix = `daily-seed ${seedStamp}`
      const operations = []
      const created = {
        commentImages: [],
        comments: [],
        rewardClaims: [],
        rewardPoolItems: [],
        steps: [],
        threadReactions: [],
        threads: [],
        wishImages: [],
        wishes: [],
      }

      if (!supabase) {
        throw new Error('当前页面没有 Supabase client。')
      }

      if (!authState?.currentSpaceId || authState.dataMode !== 'supabase') {
        throw new Error('当前页面没有进入真实 Supabase 空间。')
      }

      function getErrorMessage(error) {
        if (error && typeof error === 'object') {
          const parts = [error.message, error.details, error.hint, error.code, error.status].filter(Boolean)

          if (parts.length) {
            return parts.join(' | ').replace(/\s+/g, ' ').slice(0, 500)
          }

          return JSON.stringify(error).slice(0, 500)
        }

        return String(error).replace(/\s+/g, ' ').slice(0, 500)
      }

      function requireOk(result, label) {
        if (result.error) {
          throw new Error(`${label}: ${getErrorMessage(result.error)}`)
        }

        return result.data
      }

      async function op(label, fn, options = {}) {
        const started = performance.now()

        try {
          const detail = await fn()
          operations.push({
            label,
            ms: Math.round((performance.now() - started) * 10) / 10,
            ok: true,
            ...(detail ? { detail } : {}),
          })
          return detail
        } catch (error) {
          operations.push({
            label,
            ms: Math.round((performance.now() - started) * 10) / 10,
            ok: false,
            error: getErrorMessage(error),
          })

          if (options.critical) {
            throw error
          }

          return null
        }
      }

      async function waitFor(label, fn, timeoutMs = 8_000) {
        const started = performance.now()
        let lastError = null

        while (performance.now() - started < timeoutMs) {
          try {
            const value = await fn()

            if (value) {
              return value
            }
          } catch (error) {
            lastError = error
          }

          await new Promise((resolve) => setTimeout(resolve, 250))
        }

        throw lastError ?? new Error(`${label} timed out after ${timeoutMs}ms`)
      }

      async function createImageBlob(title, fillColor, accentColor) {
        const canvas = document.createElement('canvas')
        canvas.width = 960
        canvas.height = 540
        const context = canvas.getContext('2d')

        if (!context) {
          throw new Error('无法创建图片 canvas。')
        }

        context.fillStyle = fillColor
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = accentColor
        context.fillRect(0, 360, canvas.width, 180)
        context.fillStyle = '#ffffff'
        context.font = 'bold 48px sans-serif'
        context.fillText(title, 56, 110)
        context.font = '28px sans-serif'
        context.fillText(seedPrefix, 56, 165)

        return new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('生成测试图片失败。'))
            }
          }, 'image/jpeg', 0.82)
        })
      }

      function createImagePath(parentId, userId, name) {
        return `${parentId}/${userId}/${seedStamp}-${name}.jpg`
      }

      async function insertWish(input) {
        const row = requireOk(await supabase.from('wishes').insert({
          category: input.category,
          completed_at: input.completedAt ?? null,
          due_date: input.dueDate ?? null,
          note: input.note,
          owner_id: input.ownerId,
          priority: input.priority,
          progress_current: input.progressCurrent ?? 0,
          progress_mode: input.progressMode,
          progress_target: input.progressTarget ?? 0,
          progress_unit: input.progressUnit ?? '',
          scope: input.scope,
          space_id: input.spaceId,
          status: input.status ?? 'active',
          title: input.title,
        }).select('id').single(), `insert wish ${input.title}`)

        created.wishes.push({ id: row.id, title: input.title })
        return row
      }

      async function insertReward(input) {
        const row = requireOk(await supabase.from('reward_pool_items').insert({
          is_archived: input.isArchived ?? false,
          note: input.note,
          owner_id: input.ownerId,
          space_id: input.spaceId,
          star_coin_cost: input.starCoinCost,
          tier: input.tier,
          title: input.title,
        }).select('id').single(), `insert reward ${input.title}`)

        created.rewardPoolItems.push({ id: row.id, tier: input.tier, title: input.title })
        return row
      }

      async function insertComment(wishId, body, userId) {
        const comment = requireOk(await supabase.from('wish_comments').insert({
          author_id: userId,
          body,
          wish_id: wishId,
        }).select('id').single(), `insert comment ${body}`)

        created.comments.push({ id: comment.id, wishId })
        const thread = await waitFor(`thread for comment ${comment.id}`, async () => {
          const rows = requireOk(await supabase
            .from('wish_threads')
            .select('id, wish_id, event_kind, message_text')
            .eq('dedupe_key', `wish_comments:${comment.id}`)
            .limit(1), 'select comment thread') ?? []

          return rows[0] ?? null
        })

        created.threads.push({ id: thread.id, commentId: comment.id, wishId })
        return { comment, thread }
      }

      async function uploadCommentImage(commentId, userId, label, color) {
        const blob = await createImageBlob(label, color, '#334155')
        const storagePath = createImagePath(commentId, userId, label.toLowerCase().replace(/\s+/g, '-'))

        requireOk(await supabase.storage.from('wish-comment-images').upload(storagePath, blob, {
          cacheControl: '3600',
          contentType: 'image/jpeg',
          upsert: false,
        }), `upload comment image ${label}`)

        const row = requireOk(await supabase.from('wish_comment_images').insert({
          comment_id: commentId,
          created_by: userId,
          file_name: `${label}.jpg`,
          mime_type: 'image/jpeg',
          size_bytes: blob.size,
          sort_order: 1,
          storage_path: storagePath,
        }).select('id').single(), `insert comment image ${label}`)

        created.commentImages.push({ id: row.id, commentId, sizeBytes: blob.size, storagePath })
        return row
      }

      async function uploadWishImage(wishId, userId, label, sortOrder, color) {
        const blob = await createImageBlob(label, color, '#0f766e')
        const storagePath = createImagePath(wishId, userId, label.toLowerCase().replace(/\s+/g, '-'))

        requireOk(await supabase.storage.from('wish-images').upload(storagePath, blob, {
          cacheControl: '3600',
          contentType: 'image/jpeg',
          upsert: false,
        }), `upload wish image ${label}`)

        const row = requireOk(await supabase.from('wish_images').insert({
          created_by: userId,
          file_name: `${label}.jpg`,
          mime_type: 'image/jpeg',
          size_bytes: blob.size,
          sort_order: sortOrder,
          storage_path: storagePath,
          wish_id: wishId,
        }).select('id').single(), `insert wish image ${label}`)

        created.wishImages.push({ id: row.id, wishId, sizeBytes: blob.size, storagePath })
        return row
      }

      const session = await op('auth.getUser', async () => {
        const user = requireOk(await supabase.auth.getUser(), 'auth.getUser')?.user

        if (!user?.id) {
          throw new Error('没有拿到当前 Supabase 用户。')
        }

        return { email: user.email, userId: user.id }
      }, { critical: true })
      const userId = session.userId
      const spaceId = authState.currentSpaceId

      await op('space.members.select', async () => {
        const rows = requireOk(await supabase.from('space_members').select('space_id, user_id, role').eq('space_id', spaceId), 'space_members select') ?? []
        return { rows: rows.length }
      }, { critical: true })

      const dailyFocus = await op('reward.daily.focus', () => insertReward({
        note: `${seedPrefix} 日常奖励：专注后的小休息`,
        ownerId: userId,
        spaceId,
        starCoinCost: 0,
        tier: 'daily',
        title: `${seedPrefix} 买一杯喜欢的咖啡`,
      }), { critical: true })
      const dailyWalk = await op('reward.daily.walk', () => insertReward({
        note: `${seedPrefix} 日常奖励：去附近散步`,
        ownerId: userId,
        spaceId,
        starCoinCost: 0,
        tier: 'daily',
        title: `${seedPrefix} 傍晚散步 20 分钟`,
      }), { critical: true })
      const premiumDinner = await op('reward.premium.dinner', () => insertReward({
        note: `${seedPrefix} 高档奖励：完成重要愿望后兑现`,
        ownerId: userId,
        spaceId,
        starCoinCost: 0,
        tier: 'premium',
        title: `${seedPrefix} 周末吃一顿庆祝晚餐`,
      }), { critical: true })
      const premiumTrip = await op('reward.premium.trip', () => insertReward({
        note: `${seedPrefix} 高档奖励：攒星星币兑换`,
        ownerId: userId,
        spaceId,
        starCoinCost: 1,
        tier: 'premium',
        title: `${seedPrefix} 买一本收藏版画册`,
      }), { critical: true })

      const readingWish = await op('wish.none.shared', () => insertWish({
        category: '生活',
        dueDate: '2026-07-20',
        note: `${seedPrefix} 普通愿望：晚上留一点阅读时间。`,
        ownerId: userId,
        priority: 'medium',
        progressMode: 'none',
        scope: 'shared',
        spaceId,
        title: `${seedPrefix} 读完一本一直想看的书`,
      }), { critical: true })
      const countWish = await op('wish.count.shared', () => insertWish({
        category: '健康',
        dueDate: '2026-08-15',
        note: `${seedPrefix} 计数愿望：每完成一次运动就推进一次。`,
        ownerId: userId,
        priority: 'high',
        progressCurrent: 1,
        progressMode: 'count',
        progressTarget: 5,
        progressUnit: '次',
        scope: 'shared',
        spaceId,
        title: `${seedPrefix} 完成 5 次晨间运动`,
      }), { critical: true })
      const stepWish = await op('wish.steps.shared', () => insertWish({
        category: '学习',
        dueDate: '2026-09-01',
        note: `${seedPrefix} 步骤愿望：分阶段准备一个作品集。`,
        ownerId: userId,
        priority: 'high',
        progressMode: 'steps',
        scope: 'shared',
        spaceId,
        title: `${seedPrefix} 整理一个作品集页面`,
      }), { critical: true })
      const privateWish = await op('wish.none.private', () => insertWish({
        category: '个人',
        dueDate: '2026-07-05',
        note: `${seedPrefix} 私密愿望：只给自己看的练习。`,
        ownerId: userId,
        priority: 'low',
        progressMode: 'none',
        scope: 'private',
        spaceId,
        title: `${seedPrefix} 写一篇只给自己的复盘`,
      }), { critical: true })
      const doneSeedWish = await op('wish.done.manual', () => insertWish({
        category: '回顾',
        completedAt: new Date().toISOString(),
        note: `${seedPrefix} 已完成愿望：用于完成册页展示。`,
        ownerId: userId,
        priority: 'medium',
        progressMode: 'none',
        scope: 'shared',
        spaceId,
        status: 'done',
        title: `${seedPrefix} 完成一次周末整理`,
      }), { critical: true })
      const completeTargetWish = await op('wish.complete.target', () => insertWish({
        category: '旅行',
        note: `${seedPrefix} 等待通过完成奖励 RPC 结束。`,
        ownerId: userId,
        priority: 'medium',
        progressMode: 'none',
        scope: 'shared',
        spaceId,
        title: `${seedPrefix} 规划一次短途旅行`,
      }), { critical: true })

      await op('count.progress.update', async () => {
        requireOk(await supabase.from('wishes').update({ progress_current: 4 }).eq('id', countWish.id), 'count progress update')
      })
      await op('count.reward.claim.star', async () => {
        const claim = requireOk(await supabase.rpc('claim_count_progress_reward', {
          claim_quantity: 1,
          claim_star_coin: true,
          target_reward_item_id: null,
          target_wish_id: countWish.id,
        }), 'claim_count_progress_reward')
        created.rewardClaims.push({ id: claim?.id, kind: 'count_star', wishId: countWish.id })
        return { id: claim?.id }
      })

      const stepRows = await op('steps.insert.three', async () => {
        const rows = requireOk(await supabase.from('wish_steps').insert([
          { is_done: false, title: `${seedPrefix} 收集 6 个参考案例`, wish_id: stepWish.id },
          { is_done: false, title: `${seedPrefix} 写首页文案草稿`, wish_id: stepWish.id },
          { is_done: false, title: `${seedPrefix} 做移动端检查`, wish_id: stepWish.id },
        ]).select('id, title, created_at').order('created_at', { ascending: true }), 'insert steps') ?? []
        created.steps.push(...rows.map((row) => ({ id: row.id, wishId: stepWish.id, title: row.title })))
        return { ids: rows.map((row) => row.id) }
      }, { critical: true })

      if (stepRows?.ids?.length) {
        await op('steps.complete.partial', async () => {
          requireOk(await supabase.from('wish_steps').update({ is_done: true }).in('id', stepRows.ids.slice(0, 2)), 'complete partial steps')
        })
        await op('step.reward.claim.daily', async () => {
          const claim = requireOk(await supabase.rpc('claim_completed_step_reward', {
            claim_star_coin: false,
            target_reward_item_id: dailyFocus.id,
            target_step_id: stepRows.ids[0],
            target_wish_id: stepWish.id,
          }), 'claim_completed_step_reward')
          created.rewardClaims.push({ id: claim?.id, kind: 'step_daily', stepId: stepRows.ids[0], wishId: stepWish.id })
          return { id: claim?.id }
        })
      }

      await op('wish.complete.with.reward', async () => {
        const claim = requireOk(await supabase.rpc('complete_wish_with_reward', {
          target_reward_item_id: premiumDinner.id,
          target_wish_id: completeTargetWish.id,
        }), 'complete_wish_with_reward')
        created.rewardClaims.push({ id: claim?.id, kind: 'wish_reward', wishId: completeTargetWish.id })
        return { id: claim?.id }
      })
      await op('premium.redeem.try', async () => {
        const claim = requireOk(await supabase.rpc('redeem_premium_reward', { target_reward_item_id: premiumTrip.id }), 'redeem_premium_reward')
        created.rewardClaims.push({ id: claim?.id, kind: 'premium_redeem', rewardItemId: premiumTrip.id })
        return { id: claim?.id }
      })
      await op('wish.coin.cast.try', async () => {
        const coin = requireOk(await supabase.rpc('cast_wish_coin', { target_wish_id: readingWish.id }), 'cast_wish_coin')
        return { id: coin?.id }
      })

      const commentA = await op('comment.reading', () => insertComment(readingWish.id, `${seedPrefix} 今天先读了前两章，感觉节奏刚好。`, userId), { critical: true })
      const commentB = await op('comment.count', () => insertComment(countWish.id, `${seedPrefix} 早上完成了一次运动，腿有点酸但状态很好。`, userId), { critical: true })
      const commentC = await op('comment.steps', () => insertComment(stepWish.id, `${seedPrefix} 作品集有进展，先把结构搭起来。`, userId), { critical: true })
      await op('comment.private', () => insertComment(privateWish.id, `${seedPrefix} 私密记录：今天给自己留一点空间。`, userId))
      await op('comment.done', () => insertComment(doneSeedWish.id, `${seedPrefix} 完成后回看，这件事比想象中轻松。`, userId))

      if (commentA?.comment?.id) {
        await op('comment.image.upload', () => uploadCommentImage(commentA.comment.id, userId, 'Reading Note', '#2563eb'))
      }

      if (commentA?.thread?.id) {
        await op('reaction.reading.multi', async () => {
          const rows = requireOk(await supabase.from('thread_reactions').insert([
            { actor_id: userId, emoji: '👍', space_id: spaceId, target_thread_id: commentA.thread.id },
            { actor_id: userId, emoji: '✨', space_id: spaceId, target_thread_id: commentA.thread.id },
            { actor_id: userId, emoji: '💪', space_id: spaceId, target_thread_id: commentA.thread.id },
          ]).select('id, emoji'), 'insert reading reactions') ?? []
          created.threadReactions.push(...rows.map((row) => ({ id: row.id, emoji: row.emoji, threadId: commentA.thread.id })))
          return { ids: rows.map((row) => row.id) }
        })
      }

      if (commentB?.thread?.id) {
        await op('reaction.count.two', async () => {
          const rows = requireOk(await supabase.from('thread_reactions').insert([
            { actor_id: userId, emoji: '🔥', space_id: spaceId, target_thread_id: commentB.thread.id },
            { actor_id: userId, emoji: '✅', space_id: spaceId, target_thread_id: commentB.thread.id },
          ]).select('id, emoji'), 'insert count reactions') ?? []
          created.threadReactions.push(...rows.map((row) => ({ id: row.id, emoji: row.emoji, threadId: commentB.thread.id })))
          return { ids: rows.map((row) => row.id) }
        })
      }

      const wishImageA = await op('wish.image.upload.a', () => uploadWishImage(readingWish.id, userId, 'Shelf Photo', 1, '#7c3aed'))
      const wishImageB = await op('wish.image.upload.b', () => uploadWishImage(readingWish.id, userId, 'Desk Photo', 2, '#db2777'))

      if (wishImageA?.id) {
        await op('wish.image.note', async () => {
          requireOk(await supabase.rpc('update_wish_image_note', {
            next_note: `${seedPrefix} 书架照片，作为阅读愿望封面素材。`,
            target_image_id: wishImageA.id,
            target_wish_id: readingWish.id,
          }), 'update_wish_image_note')
        })
      }

      if (wishImageB?.id) {
        await op('wish.image.cover', async () => {
          requireOk(await supabase.rpc('set_wish_image_cover', {
            target_image_id: wishImageB.id,
            target_wish_id: readingWish.id,
          }), 'set_wish_image_cover')
        })
      }

      if (wishImageA?.id && wishImageB?.id) {
        await op('wish.image.order', async () => {
          requireOk(await supabase.rpc('set_wish_image_order', {
            ordered_image_ids: [wishImageB.id, wishImageA.id],
            target_wish_id: readingWish.id,
          }), 'set_wish_image_order')
        })
      }

      const counts = await op('counts.summary', async () => {
        const wishRows = requireOk(await supabase.from('wishes').select('id').eq('space_id', spaceId).ilike('title', `${seedPrefix}%`), 'count seeded wishes') ?? []
        const rewardRows = requireOk(await supabase.from('reward_pool_items').select('id').eq('space_id', spaceId).ilike('title', `${seedPrefix}%`), 'count seeded rewards') ?? []
        const threadRows = created.threads.length
          ? requireOk(await supabase.from('wish_threads').select('id').in('id', created.threads.map((thread) => thread.id)), 'count seeded threads') ?? []
          : []

        return {
          comments: created.comments.length,
          commentImages: created.commentImages.length,
          rewardClaims: created.rewardClaims.length,
          rewardPoolItems: rewardRows.length,
          steps: created.steps.length,
          threadReactions: created.threadReactions.length,
          threads: threadRows.length,
          wishImages: created.wishImages.length,
          wishes: wishRows.length,
        }
      })

      return {
        created,
        counts,
        failed: operations.filter((entry) => !entry.ok).length,
        operations,
        prefix: seedPrefix,
        spaceId,
        succeeded: operations.filter((entry) => entry.ok).length,
        total: operations.length,
      }
    }, { authStorageKey })

    console.log(JSON.stringify(report, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error('DAILY_SEED_FAILED')
  console.error(error)
  process.exit(1)
})