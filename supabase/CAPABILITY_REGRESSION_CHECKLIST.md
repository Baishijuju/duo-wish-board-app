# Supabase Capability Regression Checklist

这份清单用于真实 Supabase 环境回归，不是 migration 教程。

目标只有两个：

1. 确认 `public.get_app_capabilities()` 返回值与环境真实能力一致
2. 确认前端在“能力齐全”和“能力缺失”两种情况下都表现正确

## 使用前提

- 前端已经部署或本地连到目标 Supabase 项目
- 目标环境至少已经执行基础 schema migration
- 已有 1 个可登录账号
- 最好准备 2 个账号，便于验证成员、留言、愿望币、表情回应

## A. RPC 结果先验检查

在 Supabase SQL Editor 先执行：

```sql
select public.get_app_capabilities();
```

确认这些字段是否符合当前环境实际状态：

- `has_bound_space_memberships`
- `has_wish_progress`
- `has_wish_comment_images`
- `has_wish_coins`
- `has_reward_pools`
- `has_unified_threads`
- `has_monthly_snapshots`
- `has_wish_image_note`
- `has_wish_image_cover`
- `has_wish_image_order`
- `has_monthly_snapshot_backfill`

如果这里已经不对，优先修 migration / schema，不要先怀疑前端。

## B. 前端启动检查

登录进入空间后，确认：

- 不会因为 capability RPC 本身报错而卡死
- 有 capability 的环境，前端会进入显式 capability 模式
- 没有 capability RPC 的旧环境，前端仍能进入兼容 fallback 模式

重点观察：

- 首页是否正常加载
- 清单页是否正常加载
- 详情页是否正常加载
- 空间页是否正常加载

## C. 能力齐全环境检查

当 `get_app_capabilities()` 全部返回 true 时，至少验证这些动作：

- 登录后自动进入 Supabase 空间
- 创建愿望
- 创建 `count` 愿望并修改数字进度
- 创建 `steps` 愿望并增删改步骤
- 愿望详情留言
- 留言附图
- 上传愿望图片
- 修改图片备注
- 设为首图
- 调整图片顺序
- 投愿望币
- 新增日常奖励
- 新增高档奖励
- 领取步骤奖励
- 领取数字进度奖励
- 兑换高档奖励
- 手账表情回应
- 月刊快照正常读取

同时确认：

- 写入后数据能重新拉回
- Realtime 更新后页面能自动刷新
- 不出现“请先执行 migration”类错误提示

## D. 能力缺失环境检查

建议至少造 3 类环境分别验证。

### 1. 没有 capability RPC 的旧环境

预期：

- 前端仍可进入
- 旧 fallback 还能工作
- 只有真正碰到缺失能力写入时，才出现兼容提示

### 2. capability RPC 存在，但某个能力明确为 false

建议分别验证：

- `has_wish_progress = false`
- `has_wish_coins = false`
- `has_reward_pools = false`
- `has_unified_threads = false`
- `has_wish_comment_images = false`
- `has_wish_image_note = false`
- `has_wish_image_cover = false`
- `has_wish_image_order = false`
- `has_bound_space_memberships = false`

每一项都确认：

- 读取阶段不应因为前端去查缺失对象而直接炸掉
- 写入阶段不应出现“本地假成功”
- 应直接给出明确提示，说明当前环境缺少哪项能力
- 不应再走“猜错误文案”的长期主路径

### 3. capability 返回 true，但真实对象缺失

这是契约破坏场景。

预期：

- 前端可以报真实错误
- 不应继续把它当作“旧环境兼容情况”吞掉

这是这轮改造里最重要的一条。

## E. 重点观察文案

当 capability 已知缺失时，应该优先出现这类文案：

- 当前 Supabase 环境还没有愿望进度能力
- 当前 Supabase 环境还没有愿望币能力
- 当前 Supabase 环境还没有奖励池能力
- 当前 Supabase 环境还没有手账主链能力
- 当前 Supabase 环境还没有留言图片能力

而不是继续主要依赖：

- 从 Postgres 缺表错误里猜能力
- 从 RPC 不存在错误里猜能力

## F. 回归通过标准

满足以下条件才算通过：

1. capability RPC 返回值与真实 schema 一致
2. capability 为 true 的功能可正常读写
3. capability 为 false 的功能不会假成功
4. capability 为 false 时页面仍能继续使用其他功能
5. capability 未知时旧环境仍能兼容
6. capability 已知时不再长期依赖错误文案 fallback

## G. 建议记录格式

每次回归建议记录：

- Supabase project 名称
- migration 执行到哪一条
- `select public.get_app_capabilities();` 结果
- 前端 commit hash
- 通过项
- 失败项
- 是否属于 capability 返回错误，还是前端消费错误
