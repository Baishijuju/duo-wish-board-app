# Supabase Contract

这份文档只描述当前前端真实依赖的 Supabase 契约。

它不是产品说明，也不是 migration 教程；它的目标是回答：

1. 前端到底依赖哪些数据库对象
2. 哪些对象属于必需契约
3. 哪些对象还处在兼容过渡状态
4. 哪些变更一旦发生，需要同步调整前端

## 当前前端必需表

- `public.spaces`
- `public.space_members`
- `public.wishes`
- `public.wish_steps`
- `public.wish_comments`
- `public.wish_comment_images`
- `public.wish_images`
- `public.wish_coins`
- `public.reward_pool_items`
- `public.reward_claims`
- `public.wish_threads`
- `public.wish_thread_images`
- `public.thread_reactions`
- `public.monthly_journal_snapshots`

## 当前前端必需 Storage bucket

- `wish-images`
- `wish-comment-images`

## 当前前端必需 RPC / function

### 空间与身份

- `create_personal_space(text, text, text)`
- `ensure_bound_space_memberships(text)`
- `join_space_by_invite(text, text)`
- `bind_email_to_space(uuid, text, public.space_role, text)`

### 愿望与图片

- `set_wish_image_cover(uuid, uuid)`
- `set_wish_image_order(uuid, uuid[])`
- `update_wish_image_note(uuid, uuid, text)`

### 愿望币与奖励

- `cast_wish_coin(uuid)`
- `complete_wish_with_reward(uuid, uuid)`
- `claim_completed_step_reward(uuid, uuid, uuid, boolean)`
- `claim_count_progress_reward(uuid, uuid, boolean, integer)`
- `redeem_premium_reward(uuid)`

### 手账与月刊

- `ensure_monthly_journal_snapshots(uuid)`

## 当前前端必需 Realtime publication

前端当前会订阅下面这些表；如果目标环境的 `supabase_realtime` 没包含其中任何一张表，前端虽然可能仍可工作，但行为会变成“写入后回拉”或部分失效。

- `public.wishes`
- `public.wish_steps`
- `public.wish_threads`
- `public.wish_comments`
- `public.wish_images`
- `public.wish_thread_images`
- `public.wish_coins`
- `public.thread_reactions`
- `public.reward_pool_items`
- `public.reward_claims`
- `public.monthly_journal_snapshots`
- `public.wish_comment_images`

## 迁移对应关系

### 基础空间与愿望

- `202604260001_initial_schema.sql`
- `202604260002_harden_search_path.sql`
- `202604260003_enable_realtime.sql`
- `202604260004_grant_authenticated_access.sql`

### 空间自举与邮箱绑定

- `202604270005_create_personal_space_rpc.sql`
- `202604290010_make_personal_space_idempotent.sql`
- `202604290011_bind_space_emails.sql`
- `202605120001_repair_space_bootstrap.sql`
- `202605120002_backfill_owner_memberships.sql`

### 愿望图片

- `202604270006_wish_images_storage.sql`
- `202604270007_set_wish_cover_image.sql`
- `202604270008_reorder_wish_images.sql`
- `202604270009_wish_image_notes.sql`

### 愿望进度

- `202605020001_wish_progress_and_steps.sql`

### 留言图片

- `202605020002_wish_comment_images.sql`

### 愿望币

- `202605020003_wish_coins.sql`

### 奖励体系

- `202605030001_reward_pools_and_claims.sql`
- `202605030002_fix_reward_claim_kind_casts.sql`
- `202605190001_space_small_rewards.sql`

### 手账与月刊

- `202605030003_wish_threads_and_monthly_snapshots.sql`

## 兼容过渡说明

当前前端已经把契约整理为显式模块，但仍保留两类兼容路径：

1. capability 仍有错误消息兜底
2. 如果统一手账链路对象缺失，前端仍能回退到本地派生 thread

这两类兼容路径存在的原因，是为了让旧环境或迁移未补齐环境仍然能工作。

它们不应该被长期依赖。

## 下一阶段优先目标

1. 新增显式 capability function
2. 给 `supabase_realtime` 做最终状态校验
3. 再决定是否继续清理旧字段语义与兼容 fallback
