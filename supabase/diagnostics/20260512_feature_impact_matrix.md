# Feature Impact Matrix

Project ref: `cimwhpatnazndnnvvfoz`

## Scope

This matrix supersedes the earlier assumption that the browser product was broadly blocked by REST/RPC `416` failures.

Current statuses are now split into three buckets:

- Browser-validated pass: verified through the real browser application path.
- Not revalidated this round: likely still supported by code, but not explicitly rechecked in the latest browser pass.
- Tooling-only issue: currently abnormal in standalone Node diagnostics, but not proven broken in the browser product.

## Summary

| 功能 | 当前状态 | 说明 |
| --- | --- | --- |
| 邮箱验证码发送 | 浏览器已通过 | 浏览器端可正常发码。 |
| 邮箱验证码校验与会话建立 | 浏览器已通过 | 浏览器端可正常登录并建立 Supabase 会话。 |
| 登录后自动进入真实云端空间 | 浏览器已通过 | 浏览器端已能进入真实 Supabase 空间。 |
| 同一邮箱默认回到同一空间 | 浏览器已通过 | 已复验同邮箱重复登录不会继续新建空间。 |
| 成员列表刷新 | 浏览器已通过 | 共享空间已有 owner + member，浏览器端主链路通过。 |
| 邀请码加入空间 | 浏览器已通过 | 第二邮箱加入共享空间已通过浏览器复验。 |
| 固定邮箱绑定到当前空间 | 本轮未专项复验 | 数据库与前端入口存在，但本轮没有单独走一遍 UI 复验。 |
| 愿望新增/编辑/删除 | 浏览器已通过 | 浏览器端新增/删除已确认可用。 |
| 步骤与进度 | 本轮未专项复验 | 代码路径存在，但本轮没有逐项手动验证。 |
| 投币、奖励池、领奖 | 本轮未专项复验 | 代码路径存在，但本轮没有逐项手动验证。 |
| 纯文字评论 | 浏览器已通过 | 评论链路随评论图片验证一并通过。 |
| emoji 表情回应 | 本轮未专项复验 | 代码路径存在，但本轮未单独点测。 |
| 月刊/线程概览 | 本轮未专项复验 | 代码路径存在，但本轮未单独点测。 |
| 愿望图片上传 | 浏览器已通过 | 浏览器端云端图片链路通过。 |
| 评论图片上传 | 浏览器已通过 | 浏览器端评论图片链路通过。 |
| 单张图片云端删除 | 浏览器已通过 | 浏览器端图片删除链路通过。 |
| Realtime 跨端同步 | 浏览器已通过 | 浏览器复验已确认同步正常。 |
| 私密愿望数据库可见性规则 | 浏览器已通过 | 浏览器与 SQL 都已证明 owner 可见、member 不可见。 |
| `probe-owner` Node 探针 | 工具链异常 | 仍可能返回空白 `416`，但不再代表浏览器产品状态。 |

## Browser-Validated Pass

### 1. OTP and authenticated browser session

- OTP send path: [app/src/stores/auth.ts](app/src/stores/auth.ts#L693)
- OTP verify path: [app/src/stores/auth.ts](app/src/stores/auth.ts#L752)
- Session confirmation path: [app/src/stores/auth.ts](app/src/stores/auth.ts#L766)

### 2. Real cloud space usage in browser

- Cloud-mode gate: [app/src/stores/auth.ts](app/src/stores/auth.ts#L279)
- Space bootstrap orchestrator: [app/src/stores/auth.ts](app/src/stores/auth.ts#L448)
- Browser sync label: [app/src/App.vue](app/src/App.vue#L15)

Revalidation outcome:

- localhost:3000 and GitHub Pages are reading/writing the same Supabase-backed data
- the browser is not limited to local mock behavior for the tested mainline flows

### 3. Shared space and private visibility

- Invite join browser entry: [app/src/stores/auth.ts](app/src/stores/auth.ts#L776)
- Shared/private wish RLS baseline: [app/supabase/migrations/202604260001_initial_schema.sql](app/supabase/migrations/202604260001_initial_schema.sql#L248)

Revalidation outcome:

- same email returns to the same space
- second email can join the shared space
- owner can see private wish
- member cannot see private wish

### 4. Media and sync

- Comment images cloud gate: [app/src/stores/wishes.ts](app/src/stores/wishes.ts#L3603)
- Wish image upload path: [app/src/stores/wishes.ts](app/src/stores/wishes.ts#L3959)
- Wish image delete path: [app/src/stores/wishes.ts](app/src/stores/wishes.ts#L4076)
- Realtime subscription gate: [app/src/stores/wishes.ts](app/src/stores/wishes.ts#L4372)

Revalidation outcome:

- wish image upload works
- wish image delete works
- comment image upload works
- cross-browser/page sync works

## Not Revalidated This Round

These items should not be labeled broken; they were simply not the focus of the latest browser pass.

### 1. Fixed email binding

- Owner-only binding entry: [app/src/composables/useSpaceState.ts](app/src/composables/useSpaceState.ts#L46)
- UI section: [app/src/pages/Settings.vue](app/src/pages/Settings.vue#L560)
- RPC entry: [app/src/stores/auth.ts](app/src/stores/auth.ts#L835)

### 2. Steps, rewards, reactions, monthly snapshots

- Steps/progress live in the wishes store main flow.
- Rewards and claims have both cloud and local branches.
- Thread reactions and monthly snapshot derivation also remain in code.

Useful anchors:

- [app/src/stores/wishes.ts](app/src/stores/wishes.ts#L2976)
- [app/src/stores/wishes.ts](app/src/stores/wishes.ts#L3044)
- [app/src/stores/wishes.ts](app/src/stores/wishes.ts#L3142)
- [app/src/stores/wishes.ts](app/src/stores/wishes.ts#L3217)
- [app/src/stores/wishes.ts](app/src/stores/wishes.ts#L3299)
- [app/src/stores/wishes.ts](app/src/stores/wishes.ts#L3876)

## Tooling-Only Issue

### Node probe mismatch

The remaining abnormal item is the standalone Node diagnostic path:

- [app/scripts/private-visibility-regression.mjs](app/scripts/private-visibility-regression.mjs)

That script can still report empty `416 Requested Range Not Satisfiable` responses for raw REST/RPC calls.

Given the browser revalidation now passes, this should be treated as a separate tooling/debugging issue, not as the current product status.

## UI Signals To Watch In Browser

When you open `http://localhost:3000/`, these labels are still the fastest way to sanity-check mode:

- Header sync badge: [app/src/App.vue](app/src/App.vue#L15)
- Space summary label in header: [app/src/App.vue](app/src/App.vue#L31)
- Settings page “进入与邀请” status badge: [app/src/pages/Settings.vue](app/src/pages/Settings.vue#L472)
- Settings page “照片空间与备份” badge showing `云端空间` vs `本地体验空间`: [app/src/pages/Settings.vue](app/src/pages/Settings.vue#L607)

## Current Bottom Line

- The browser product mainline is currently usable.
- The browser product reaches the real Supabase project for the revalidated flows.
- Private wish visibility is behaving correctly.
- The main remaining issue is the mismatch between browser behavior and the standalone Node probe, not a confirmed user-facing outage.