import { chromium } from 'playwright'
import { existsSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseUrl = process.env.BENCH_BASE_URL || 'http://127.0.0.1:3000'
const authStatePath = process.env.BENCH_AUTH_STATE || path.join(os.tmpdir(), 'duo-wish-bench-auth.json')
const imagePath = process.env.BENCH_IMAGE_PATH || 'C:/Users/YUETJ/OneDrive - BASF/2 Python Learning/2 待完成代码/人生愿望清单/0112_7.jpg'
const authStorageKey = 'duo-wish-board-auth:v2'
const imageBase64 = readFileSync(imagePath).toString('base64')

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

    const report = await page.evaluate(async ({ authStorageKey, imageBase64, imagePath }) => {
      const { supabase } = await import('/src/lib/supabase.ts')
      const benchStamp = new Date().toISOString().replace(/[:.]/g, '-')
      const benchPrefix = `cloud-bench ${benchStamp}`
      const rawAuth = localStorage.getItem(authStorageKey)
      const authState = rawAuth ? JSON.parse(rawAuth) : null
      const results = []

      if (!supabase) {
        throw new Error('当前页面没有 Supabase client。')
      }

      if (!authState?.currentSpaceId || authState.dataMode !== 'supabase') {
        throw new Error('当前页面没有进入真实 Supabase 空间。')
      }

      function roundMs(value) {
        return Math.round(value * 10) / 10
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

      async function timed(label, fn, options = {}) {
        const started = performance.now()

        try {
          const detail = await fn()
          const entry = {
            label,
            ms: roundMs(performance.now() - started),
            ok: true,
            ...(detail ? { detail } : {}),
          }

          results.push(entry)
          return detail
        } catch (error) {
          const entry = {
            label,
            ms: roundMs(performance.now() - started),
            ok: false,
            error: getErrorMessage(error),
          }

          results.push(entry)

          if (options.critical) {
            throw error
          }

          return null
        }
      }

      function requireOk(result, label) {
        if (result.error) {
          throw new Error(`${label}: ${getErrorMessage(result.error)}`)
        }

        return result.data
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

      function imageBlob() {
        const binary = atob(imageBase64)
        const bytes = new Uint8Array(binary.length)

        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index)
        }

        return new Blob([bytes], { type: 'image/jpeg' })
      }

      function createImagePath(parentId, userId, name) {
        return `${parentId}/${userId}/${benchStamp}-${name}.jpg`
      }

      async function fullSync(spaceId) {
        const counts = {}
        const capabilities = requireOk(await supabase.rpc('get_app_capabilities'), 'get_app_capabilities')
        const wishRows = requireOk(await supabase
          .from('wishes')
          .select('id, space_id, owner_id, title, category, note, priority, scope, status, is_starred, due_date, progress_mode, progress_current, progress_target, progress_unit, completed_at, created_at, updated_at')
          .eq('space_id', spaceId)
          .order('updated_at', { ascending: false }), 'wishes select') ?? []
        const wishIds = wishRows.map((wish) => wish.id)
        const rewardPoolItems = requireOk(await supabase.from('reward_pool_items').select('id').eq('space_id', spaceId), 'reward_pool_items select') ?? []
        const rewardClaims = requireOk(await supabase.from('reward_claims').select('id').eq('space_id', spaceId), 'reward_claims select') ?? []
        const threadRows = requireOk(await supabase.from('wish_threads').select('id').eq('space_id', spaceId).order('created_at', { ascending: true }), 'wish_threads select') ?? []
        const threadReactions = requireOk(await supabase.from('thread_reactions').select('id').eq('space_id', spaceId), 'thread_reactions select') ?? []
        const snapshots = requireOk(await supabase.from('monthly_journal_snapshots').select('id').eq('space_id', spaceId), 'monthly_journal_snapshots select') ?? []
        const coins = requireOk(await supabase.from('wish_coins').select('id').eq('space_id', spaceId), 'wish_coins select') ?? []
        const steps = wishIds.length
          ? requireOk(await supabase.from('wish_steps').select('id').in('wish_id', wishIds), 'wish_steps select') ?? []
          : []
        const wishImages = wishIds.length
          ? requireOk(await supabase.from('wish_images').select('id, storage_path').in('wish_id', wishIds), 'wish_images select') ?? []
          : []
        const threadImages = threadRows.length
          ? requireOk(await supabase.from('wish_thread_images').select('id, storage_path').in('thread_id', threadRows.map((thread) => thread.id)), 'wish_thread_images select') ?? []
          : []

        if (wishImages.length) {
          requireOk(await supabase.storage.from('wish-images').createSignedUrls(wishImages.map((image) => image.storage_path), 60 * 60), 'wish image signed urls')
        }

        if (threadImages.length) {
          requireOk(await supabase.storage.from('wish-comment-images').createSignedUrls(threadImages.map((image) => image.storage_path), 60 * 60), 'thread image signed urls')
        }

        counts.capabilities = Object.keys(capabilities ?? {}).length
        counts.wishes = wishRows.length
        counts.rewardPoolItems = rewardPoolItems.length
        counts.rewardClaims = rewardClaims.length
        counts.threads = threadRows.length
        counts.threadReactions = threadReactions.length
        counts.snapshots = snapshots.length
        counts.coins = coins.length
        counts.steps = steps.length
        counts.wishImages = wishImages.length
        counts.threadImages = threadImages.length
        return counts
      }

      const session = await timed('auth.getUser', async () => {
        const user = requireOk(await supabase.auth.getUser(), 'auth.getUser')?.user

        if (!user?.id) {
          throw new Error('没有拿到当前 Supabase 用户。')
        }

        return { userId: user.id, email: user.email }
      }, { critical: true })
      const userId = session.userId
      const spaceId = authState.currentSpaceId

      await timed('space.members.select', async () => {
        const rows = requireOk(await supabase.from('space_members').select('space_id, user_id, role').eq('space_id', spaceId), 'space_members select') ?? []
        return { rows: rows.length }
      }, { critical: true })

      await timed('capabilities.rpc', async () => requireOk(await supabase.rpc('get_app_capabilities'), 'get_app_capabilities'))
      await timed('full_sync.before', () => fullSync(spaceId), { critical: true })

      const countWish = await timed('wish.insert.count', async () => {
        const row = requireOk(await supabase.from('wishes').insert({
          category: '测速',
          note: `${benchPrefix} count wish`,
          owner_id: userId,
          priority: 'low',
          progress_current: 0,
          progress_mode: 'count',
          progress_target: 3,
          progress_unit: '次',
          scope: 'shared',
          space_id: spaceId,
          title: `${benchPrefix} count`,
        }).select('id').single(), 'wish insert')
        return { id: row.id }
      }, { critical: true })

      await timed('wish.update', async () => {
        requireOk(await supabase.from('wishes').update({ title: `${benchPrefix} count updated`, note: `${benchPrefix} updated note` }).eq('id', countWish.id), 'wish update')
      })

      await timed('wish.progress.count.update', async () => {
        requireOk(await supabase.from('wishes').update({ progress_current: 2 }).eq('id', countWish.id), 'count progress update')
      })

      await timed('wish.coin.cast.rpc', async () => {
        const coin = requireOk(await supabase.rpc('cast_wish_coin', { target_wish_id: countWish.id }), 'cast_wish_coin')
        return { id: coin?.id }
      })

      const dailyReward = await timed('reward_pool.insert.daily', async () => {
        const row = requireOk(await supabase.from('reward_pool_items').insert({
          is_archived: false,
          note: `${benchPrefix} daily reward`,
          owner_id: userId,
          space_id: spaceId,
          star_coin_cost: 0,
          tier: 'daily',
          title: `${benchPrefix} daily`,
        }).select('id').single(), 'daily reward insert')
        return { id: row.id }
      })

      if (dailyReward?.id) {
        await timed('reward_pool.update', async () => {
          requireOk(await supabase.from('reward_pool_items').update({ title: `${benchPrefix} daily updated`, note: `${benchPrefix} daily updated note` }).eq('id', dailyReward.id), 'reward update')
        })
      }

      await timed('reward.claim_count_star.rpc', async () => {
        const claim = requireOk(await supabase.rpc('claim_count_progress_reward', {
          claim_quantity: 1,
          claim_star_coin: true,
          target_reward_item_id: null,
          target_wish_id: countWish.id,
        }), 'claim_count_progress_reward')
        return { id: claim?.id }
      })

      const premiumReward = await timed('reward_pool.insert.premium', async () => {
        const row = requireOk(await supabase.from('reward_pool_items').insert({
          is_archived: false,
          note: `${benchPrefix} premium reward`,
          owner_id: userId,
          space_id: spaceId,
          star_coin_cost: 1,
          tier: 'premium',
          title: `${benchPrefix} premium`,
        }).select('id').single(), 'premium reward insert')
        return { id: row.id }
      })

      if (premiumReward?.id) {
        await timed('reward.redeem_premium.rpc', async () => {
          const claim = requireOk(await supabase.rpc('redeem_premium_reward', { target_reward_item_id: premiumReward.id }), 'redeem_premium_reward')
          return { id: claim?.id }
        })
      }

      if (dailyReward?.id) {
        await timed('reward_pool.archive', async () => {
          requireOk(await supabase.from('reward_pool_items').update({ is_archived: true }).eq('id', dailyReward.id), 'reward archive')
        })
      }

      const stepWish = await timed('wish.insert.steps', async () => {
        const row = requireOk(await supabase.from('wishes').insert({
          category: '测速',
          note: `${benchPrefix} step wish`,
          owner_id: userId,
          priority: 'low',
          progress_current: 0,
          progress_mode: 'steps',
          progress_target: 0,
          progress_unit: '',
          scope: 'shared',
          space_id: spaceId,
          title: `${benchPrefix} steps`,
        }).select('id').single(), 'step wish insert')
        return { id: row.id }
      }, { critical: true })

      const step = await timed('wish_step.insert', async () => {
        const row = requireOk(await supabase.from('wish_steps').insert({
          is_done: false,
          sort_order: 1,
          title: `${benchPrefix} step`,
          wish_id: stepWish.id,
        }).select('id').single(), 'wish step insert')
        return { id: row.id }
      })

      if (step?.id) {
        await timed('wish_step.toggle_done', async () => {
          requireOk(await supabase.from('wish_steps').update({ is_done: true }).eq('id', step.id).eq('wish_id', stepWish.id), 'wish step toggle')
        })

        await timed('reward.claim_step_star.rpc', async () => {
          const claim = requireOk(await supabase.rpc('claim_completed_step_reward', {
            claim_star_coin: true,
            target_reward_item_id: null,
            target_step_id: step.id,
            target_wish_id: stepWish.id,
          }), 'claim_completed_step_reward')
          return { id: claim?.id }
        })
      }

      await timed('wish.toggle_done.update', async () => {
        requireOk(await supabase.from('wishes').update({ completed_at: new Date().toISOString(), status: 'done' }).eq('id', stepWish.id), 'wish toggle done')
      })

      const completeReward = await timed('reward_pool.insert.complete_premium', async () => {
        const row = requireOk(await supabase.from('reward_pool_items').insert({
          is_archived: false,
          note: `${benchPrefix} complete reward`,
          owner_id: userId,
          space_id: spaceId,
          star_coin_cost: 0,
          tier: 'premium',
          title: `${benchPrefix} complete premium`,
        }).select('id').single(), 'complete premium reward insert')
        return { id: row.id }
      })

      const completeWish = await timed('wish.insert.complete_target', async () => {
        const row = requireOk(await supabase.from('wishes').insert({
          category: '测速',
          note: `${benchPrefix} complete target`,
          owner_id: userId,
          priority: 'low',
          progress_current: 0,
          progress_mode: 'none',
          progress_target: 0,
          progress_unit: '',
          scope: 'shared',
          space_id: spaceId,
          title: `${benchPrefix} complete target`,
        }).select('id').single(), 'complete target wish insert')
        return { id: row.id }
      })

      if (completeWish?.id && completeReward?.id) {
        await timed('wish.complete_with_reward.rpc', async () => {
          const claim = requireOk(await supabase.rpc('complete_wish_with_reward', {
            target_reward_item_id: completeReward.id,
            target_wish_id: completeWish.id,
          }), 'complete_wish_with_reward')
          return { id: claim?.id }
        })
      }

      const comment = await timed('comment.insert', async () => {
        const row = requireOk(await supabase.from('wish_comments').insert({
          author_id: userId,
          body: `${benchPrefix} comment`,
          wish_id: countWish.id,
        }).select('id').single(), 'comment insert')
        return { id: row.id }
      }, { critical: true })

      const thread = await timed('comment.thread.visible', async () => {
        const row = await waitFor('comment thread', async () => {
          const rows = requireOk(await supabase.from('wish_threads').select('id').eq('wish_id', countWish.id).eq('event_kind', 'comment').eq('message_text', `${benchPrefix} comment`).limit(1), 'comment thread select') ?? []
          return rows[0] ?? null
        })
        return { id: row.id }
      })

      await timed('comment.update', async () => {
        requireOk(await supabase.from('wish_comments').update({ body: `${benchPrefix} comment updated` }).eq('id', comment.id).eq('wish_id', countWish.id), 'comment update')
      })

      const throwawayComment = await timed('comment.insert.delete_target', async () => {
        const row = requireOk(await supabase.from('wish_comments').insert({
          author_id: userId,
          body: `${benchPrefix} comment delete target`,
          wish_id: countWish.id,
        }).select('id').single(), 'comment delete target insert')
        return { id: row.id }
      })

      if (throwawayComment?.id) {
        await timed('comment.delete', async () => {
          requireOk(await supabase.from('wish_comments').delete().eq('id', throwawayComment.id).eq('wish_id', countWish.id), 'comment delete')
        })
      }

      const threadForReaction = thread?.id
        ? thread
        : await timed('thread.select.for_reaction', async () => {
            const rows = requireOk(await supabase.from('wish_threads').select('id').eq('wish_id', countWish.id).eq('event_kind', 'comment').limit(1), 'thread select') ?? []
            const row = rows[0]

            if (!row?.id) {
              throw new Error('没有找到可回应的 thread。')
            }

            return { id: row.id }
          }, { critical: true })

      const reaction = await timed('thread_reaction.insert', async () => {
        const row = requireOk(await supabase.from('thread_reactions').insert({
          actor_id: userId,
          emoji: '⏱️',
          space_id: spaceId,
          target_thread_id: threadForReaction.id,
        }).select('id').single(), 'thread reaction insert')
        return { id: row.id }
      })

      if (reaction?.id) {
        await timed('thread_reaction.delete', async () => {
          requireOk(await supabase.from('thread_reactions').delete().eq('id', reaction.id), 'thread reaction delete')
        })
      }

      const image = imageBlob()
      const commentImagePath = createImagePath(comment.id, userId, 'comment')

      await timed('comment_image.storage.upload', async () => {
        requireOk(await supabase.storage.from('wish-comment-images').upload(commentImagePath, image, {
          cacheControl: '3600',
          contentType: 'image/jpeg',
          upsert: false,
        }), 'comment image upload')
        return { bytes: image.size }
      })

      await timed('comment_image.row.insert', async () => {
        const row = requireOk(await supabase.from('wish_comment_images').insert({
          comment_id: comment.id,
          created_by: userId,
          file_name: '0112_7.jpg',
          mime_type: 'image/jpeg',
          size_bytes: image.size,
          sort_order: 1,
          storage_path: commentImagePath,
        }).select('id').single(), 'comment image row insert')
        return { id: row.id }
      })

      await timed('comment_image.signed_url', async () => {
        requireOk(await supabase.storage.from('wish-comment-images').createSignedUrls([commentImagePath], 60 * 60), 'comment image signed url')
      })

      const wishImagePathA = createImagePath(countWish.id, userId, 'wish-a')
      const wishImagePathB = createImagePath(countWish.id, userId, 'wish-b')

      await timed('wish_image.storage.upload.a', async () => {
        requireOk(await supabase.storage.from('wish-images').upload(wishImagePathA, image, {
          cacheControl: '3600',
          contentType: 'image/jpeg',
          upsert: false,
        }), 'wish image upload a')
        return { bytes: image.size }
      })

      const wishImageA = await timed('wish_image.row.insert.a', async () => {
        const row = requireOk(await supabase.from('wish_images').insert({
          created_by: userId,
          file_name: '0112_7.jpg',
          mime_type: 'image/jpeg',
          size_bytes: image.size,
          sort_order: 1,
          storage_path: wishImagePathA,
          wish_id: countWish.id,
        }).select('id').single(), 'wish image row insert a')
        return { id: row.id }
      })

      await timed('wish_image.storage.upload.b', async () => {
        requireOk(await supabase.storage.from('wish-images').upload(wishImagePathB, image, {
          cacheControl: '3600',
          contentType: 'image/jpeg',
          upsert: false,
        }), 'wish image upload b')
        return { bytes: image.size }
      })

      const wishImageB = await timed('wish_image.row.insert.b', async () => {
        const row = requireOk(await supabase.from('wish_images').insert({
          created_by: userId,
          file_name: '0112_7-copy.jpg',
          mime_type: 'image/jpeg',
          size_bytes: image.size,
          sort_order: 2,
          storage_path: wishImagePathB,
          wish_id: countWish.id,
        }).select('id').single(), 'wish image row insert b')
        return { id: row.id }
      })

      await timed('wish_image.signed_url', async () => {
        requireOk(await supabase.storage.from('wish-images').createSignedUrls([wishImagePathA, wishImagePathB], 60 * 60), 'wish image signed url')
      })

      if (wishImageA?.id) {
        await timed('wish_image.note.rpc', async () => {
          requireOk(await supabase.rpc('update_wish_image_note', {
            next_note: `${benchPrefix} image note`,
            target_image_id: wishImageA.id,
            target_wish_id: countWish.id,
          }), 'update_wish_image_note')
        })
      }

      if (wishImageB?.id) {
        await timed('wish_image.set_cover.rpc', async () => {
          requireOk(await supabase.rpc('set_wish_image_cover', {
            target_image_id: wishImageB.id,
            target_wish_id: countWish.id,
          }), 'set_wish_image_cover')
        })
      }

      if (wishImageA?.id && wishImageB?.id) {
        await timed('wish_image.reorder.rpc', async () => {
          requireOk(await supabase.rpc('set_wish_image_order', {
            ordered_image_ids: [wishImageA.id, wishImageB.id],
            target_wish_id: countWish.id,
          }), 'set_wish_image_order')
        })
      }

      if (wishImageB?.id) {
        await timed('wish_image.delete.storage_and_row', async () => {
          requireOk(await supabase.storage.from('wish-images').remove([wishImagePathB]), 'wish image storage delete')
          requireOk(await supabase.from('wish_images').delete().eq('id', wishImageB.id).eq('wish_id', countWish.id), 'wish image row delete')
        })
      }

      const deleteWish = await timed('wish.insert.delete_target', async () => {
        const row = requireOk(await supabase.from('wishes').insert({
          category: '测速',
          note: `${benchPrefix} delete target`,
          owner_id: userId,
          priority: 'low',
          progress_current: 0,
          progress_mode: 'none',
          progress_target: 0,
          progress_unit: '',
          scope: 'shared',
          space_id: spaceId,
          title: `${benchPrefix} delete target`,
        }).select('id').single(), 'delete target wish insert')
        return { id: row.id }
      })

      if (deleteWish?.id) {
        await timed('wish.delete', async () => {
          requireOk(await supabase.from('wishes').delete().eq('id', deleteWish.id), 'wish delete')
        })
      }

      await timed('full_sync.after', () => fullSync(spaceId))

      return {
        benchPrefix,
        spaceId,
        imagePath,
        total: results.length,
        succeeded: results.filter((result) => result.ok).length,
        failed: results.filter((result) => !result.ok).length,
        results,
      }
    }, { authStorageKey, imageBase64, imagePath })

    console.log(JSON.stringify(report, null, 2))
    console.log('\nCloud operation timings:')
    console.table(report.results.map((result) => ({
      operation: result.label,
      ms: result.ms,
      ok: result.ok,
      detail: result.ok ? JSON.stringify(result.detail ?? {}) : result.error,
    })))
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error('CLOUD_BENCHMARK_FAILED')
  console.error(error)
  process.exit(1)
})