# Supabase 数据收敛重构方案（2026-08-04）

## 当前执行状态（2026-08-04）

| 项目 | 状态 | 说明 |
|---|---|---|
| 202608040003 日聚合对齐修复 | 已执行 | 历史 count_star_coin 与 daily 对齐 |
| 202608040004 daily 读策略修复 | 已执行 | 补齐 `wish_count_progress_daily` 的 RLS `SELECT` policy |
| 202608040005 reward_claims -> daily 自动同步 | 已执行 | 已上线 trigger + reconcile，后续自动收敛 |
| 202608040006 reward_claims -> wish_threads 缺口回填 | 已执行 | 历史缺失线程已补齐 |
| 202608050010 baseline_v2 第一批核心 schema | 已执行 | enum + 核心表 + 主外键与关键唯一约束，已完成幂等验证 |
| 202608050020 baseline_v2 第二批索引与触发器 | 已执行 | 性能索引 + 核心触发器护栏，已完成幂等验证 |
| 202608050030 baseline_v2 第三批访问与权限护栏 | 已执行 | 核心访问函数 + RLS + policy/grant，已完成幂等验证 |
| 日常健康审计脚本 | 已提供 | `supabase/diagnostics/20260804_schema_health_audit.sql` |
| 上线后一键验收脚本 | 已提供 | `supabase/diagnostics/20260804_post_migration_acceptance.sql` |

> 备注：当前一键验收结果为 5/5 通过（2026-08-04），其中 `daily drift = 0`、`missing reward_claim threads = 0`。

## 日常执行入口

- 运行一键验收：`npm run db:acceptance`
- 运行健康体检：`npm run db:audit`

建议在每次执行新 migration 后先跑一遍一键验收，再根据需要跑健康体检明细。

## 目标

- 以 `reward_claims` 为事实源，避免多链路口径漂移。
- 把 `wish_count_progress_daily` 明确为可重建投影，数据库层自动维护。
- 保留 `wish_threads` 的叙事价值，但不再承载业务真值。
- 建立上线前一致性门禁，避免 RLS/投影漏配再次发生。

## 现状结论

- 核心风险 1：`wish_count_progress_daily` 带 `owner_id`，但唯一键是 `(wish_id, progress_date)`，语义有冲突隐患。
- 核心风险 2：`reward_claims` 与 `wish_threads` 双链路存在小量缺口（已观察到 `star_coin` 少量未投影）。
- 核心风险 3：`daily` 表缺数据库级自动同步闭环，依赖应用写入与补丁 SQL。
- 核心风险 4：RLS 策略曾缺失，说明 schema 门禁不足。

## 重构原则

- 先加“护栏”（门禁、审计、触发器），再动主键/唯一键。
- 所有变更优先兼容，不做一次性破坏式迁移。
- 迁移每步可回滚，先在影子环境验收后上正式环境。

## Phase A（立即可做，低风险）

1. 保留现有表结构，新增数据库一致性审计脚本。
2. 固化 RLS 策略检查：RLS 开启表必须至少有 `SELECT` policy。
3. 将 `wish_count_progress_daily` 读取失败的前端 fallback 打点上报（而非静默）。

交付物：
- `supabase/diagnostics/20260804_schema_health_audit.sql`
- `supabase/diagnostics/20260804_post_migration_acceptance.sql`

## Phase B（1-2 天，中风险）

1. 新增触发器函数：
- `sync_count_progress_daily_from_claims()`
- 在 `reward_claims` 的 `INSERT/UPDATE/DELETE` 上维护 daily 聚合。
2. 补一条全量 reconcile SQL（幂等）用于历史数据对齐。
3. 增加唯一幂等键策略（如果业务允许）：
- 对自动计数奖励新增 `dedupe` 语义（例如 `source_wish_id + date + owner + claim_kind`）。

已准备草案：
- `supabase/migrations/202608040005_sync_daily_from_reward_claims_trigger.sql`

验收 SQL：
- `daily vs claims mismatch_count = 0`
- `reward_claims missing projection to wish_threads` 在可接受阈值（理想 0）

## Phase C（3-5 天，结构治理）

> 这一步需要先确认产品语义：daily 是“愿望总量/日”还是“成员/愿望/日”。

方案 C1（单人归属愿望，当前更贴近现状）：
- 继续使用唯一键 `(wish_id, progress_date)`。
- 明确 `owner_id` 仅作为冗余字段，不参与唯一语义。
- 增加 check：`owner_id = wishes.owner_id`（触发器或约束函数实现）。

方案 C2（未来支持多人共同推进同一愿望）：
- 唯一键升级为 `(wish_id, progress_date, owner_id)`。
- 所有聚合查询按业务场景选择是否 sum(owner)。
- 前端文案需明确“我今天”或“我们今天”。

## Phase D（并行进行，前后端契约收敛）

1. 将 capability fallback 从“猜错误文案”收敛为“显式 capability + 告警”。
2. `wish_threads` 仅展示 `message_text/meta`，统计类计算全部回到事实表或 daily 投影。
3. 对 `wish_threads` 的 `meta.quantity` 标记为展示字段，不作为统计输入。

## 上线门禁（必须满足）

1. `schema_health_audit.sql` 无 P0 结果：
- RLS 开启但无 policy = 0
- daily drift mismatch = 0
2. 关键路径回归：
- 数字推进
- 自动星币入账
- 线程文案
- 回顾页统计
3. 新老数据共存回归：
- 历史愿望随机抽样 >= 20 条
- 本月高频操作愿望 >= 10 条

## 建议执行顺序

1. 先落 Phase A 审计 + 门禁。
2. 再落 Phase B 自动同步，降低人工修复成本。
3. 最后基于产品决策落 Phase C 唯一键语义。

## 备注

- 当前库已经可以稳定运行，不建议立刻推倒重建。
- 推荐“渐进式收敛”：先把漂移风险打掉，再做结构归一。