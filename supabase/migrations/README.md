# Migrations 索引与分层约定

本文件用于解决两个现实问题：

1. 历史迁移很多，阅读成本高。
2. 部分 SQL 是一次性补丁，不应作为新环境默认链路。

## 分层原则

- default-chain：新环境默认执行链路，代表当前产品能力演进主线。
- historical-patch：历史修复/回填/定向补丁，只在特定环境按需执行。
- deprecated-history：已被后续迁移移除的历史能力，保留用于审计和老环境追溯。

## default-chain（建议新环境主链）

- 202604260001_initial_schema.sql
- 202604260002_harden_search_path.sql
- 202604260003_enable_realtime.sql
- 202604260004_grant_authenticated_access.sql
- 202604270005_create_personal_space_rpc.sql
- 202604270006_wish_images_storage.sql
- 202604270007_set_wish_cover_image.sql
- 202604270008_reorder_wish_images.sql
- 202604270009_wish_image_notes.sql
- 202604290010_make_personal_space_idempotent.sql
- 202604290011_bind_space_emails.sql
- 202605020001_wish_progress_and_steps.sql
- 202605020002_wish_comment_images.sql
- 202605030001_reward_pools_and_claims.sql
- 202605030002_fix_reward_claim_kind_casts.sql
- 202605030003_wish_threads_and_monthly_snapshots.sql
- 202605120001_repair_space_bootstrap.sql
- 202605120002_backfill_owner_memberships.sql
- 202605190001_space_small_rewards.sql
- 202606060001_app_capabilities_contract.sql
- 202606070001_thread_reactions_text_target.sql
- 202606080000_reward_claim_kind_values.sql
- 202606080001_star_coin_wish_rewards.sql
- 202606080002_reward_deposits.sql
- 202606080003_reward_assists.sql
- 202606080004_shared_rewards.sql
- 202606250001_remove_wish_coins.sql
- 202606250002_remove_wish_priority_due_date.sql
- 202607060001_fix_sync_reward_claim_to_thread_upsert_signature.sql
- 202608010001_fix_monthly_snapshot_text_uuid_compare.sql
- 202608040001_fix_count_progress_auto_claim_delta.sql
- 202608040004_add_select_policy_wish_count_progress_daily.sql
- 202608040005_sync_daily_from_reward_claims_trigger.sql
- 202608040006_backfill_missing_reward_claim_threads.sql

## historical-patch（按需执行）

- 202608040002_backfill_daily_progress_and_fix_20260803.sql
  - 说明：包含具体 wish_id 与日期的定向修复，仅适用于当时故障。
- 202608040003_reconcile_daily_progress_from_claims.sql
  - 说明：一次性全量对齐补丁。现在已有 202608040005 的自动同步与内置 reconcile，不建议每次新环境重复执行。

## deprecated-history（保留但不建议新功能依赖）

- 202605020003_wish_coins.sql
  - 说明：历史愿望币模型，后续由 202606250001_remove_wish_coins.sql 移除。

## 新增迁移命名规范

- 普通能力迭代：<timestamp>_<feature>.sql
- 一次性修复：<timestamp>_patch_<scope>.sql
- 回填脚本：<timestamp>_backfill_<scope>.sql
- 触发器/约束补强：<timestamp>_guardrail_<scope>.sql

## 执行建议

1. 新环境：优先走 default-chain。
2. 老环境修复：先跑 `npm run db:acceptance`，只对失败项执行对应 historical-patch。
3. 上线后：固定跑 `npm run db:acceptance`，必要时再跑 `npm run db:audit`。

## Baseline v2

已新增骨架文件：
- 202608050000_baseline_v2_schema_skeleton.sql
- 202608050010_baseline_v2_phase1_core_schema.sql
- 202608050020_baseline_v2_phase2_indexes_triggers.sql
- 202608050030_baseline_v2_phase3_access_rls.sql

说明：该文件用于后续“新环境快速初始化”的合并版本，不用于直接替代现有历史链路。

当前进度：
- phase1 已具备可执行 SQL（enum + 核心表 + 主外键 + 关键唯一约束）。
- 已在现网做幂等执行验证，并通过 `npm run db:acceptance` 回归。
- phase2 已具备可执行 SQL（性能索引 + 关键触发器护栏）。
- 已在现网做幂等执行验证，并通过 `npm run db:acceptance` 回归。
- phase3 已具备可执行 SQL（访问函数 + RLS + policy/grant 护栏）。
- 已在现网做幂等执行验证，并通过 `npm run db:acceptance` 与 `npm run db:audit` 回归。

生成建议：
1. 首选：`supabase db dump --linked --schema public --file <baseline.sql>`
2. 若本机缺 Docker 导致 dump 失败：先使用当前骨架文件的对象清单继续人工合并（enum/table/function 按块迁移），并在每次合并后运行 `npm run db:acceptance`。