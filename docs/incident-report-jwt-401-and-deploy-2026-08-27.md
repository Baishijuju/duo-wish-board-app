# 事故报告：JWT 401 拒绝与部署链路混淆（2026-08-27）

## 一句话结论
本次用户侧“上线失败/云端不可用”是两类问题叠加：
1. 外部依赖事故：Supabase 官方事故 `401 errors due to JWT rejections` 导致“新刷新 JWT 被 Data API 拒绝”的间歇性故障。
2. 内部操作偏差：后续应急发布时误走了 Cloudflare Worker deploy 链路，触发 `wrangler.toml` 中本地 KV 配置不适配线上的问题。

两者在时间上连续发生，造成“都像部署失败”的体感，但根因并不相同。

## 事故等级与范围
- 事故等级：SEV-2（核心云端能力可用性下降，存在可行绕行）
- 影响范围：
  - 登录后云端数据读取/同步不稳定（`/rest/v1/*`、部分 RPC）
  - 部署路径切换期间，Cloudflare Worker 发布失败
  - 本地离线/本地空间可继续使用
- 受影响对象：项目 `cimwhpatnazndnnvvfoz` 的云端链路验收与正式发布节奏

## 时间线（UTC）
1. 2026-08-14
Supabase 官方将 `401 errors due to JWT rejections` 标记为 `Identified`，指出“新刷新 JWT 被 API 拒绝”。

2. 2026-08-21
项目实测出现：`/auth/v1/user` 可 `200`，但 Data API 访问失败，浏览器表现为 `Failed to fetch/CORS`，与官方事故现象一致。

3. 2026-08-23
再次复测：JWT 未过期、Auth 侧仍正常，Data API 依旧失败，且项目层日志不完整，符合“请求可能在 API Gateway 前段被拦截”的特征。

4. 2026-08-25
官方更新继续分区 rollout 修复，`ap-southeast-1` 已列入修复区域，但事故状态仍处于持续观察和分批推进。

5. 2026-08-26 ~ 2026-08-27
为规避云端不稳定，团队尝试 Cloudflare 路径；部署阶段发生链路误切换（Worker deploy 而非静态 Pages 构建），出现发布失败。

6. 2026-08-27
明确策略：生产优先回归 Supabase-only 前端直连方案，并使用静态站部署路径完成对外可访问版本。

## 现象与证据
## 1) 与 JWT 401 事故一致的证据
- 官方状态页事故标题：`401 errors due to JWT rejections`，影响组件为 API Gateway。
- 现场验证中出现“Auth 成功、Data API 失败”的分层特征：
  - `auth/v1/user` 返回 `200`
  - `rest/v1/*` 请求在浏览器侧报错，表现为 CORS/网络失败
- JWT 侧检查曾显示：
  - 新刷新令牌可正常签发
  - `kid` 与 JWKS 匹配
  - 角色为 `authenticated`

以上组合说明：并非本地令牌缓存过期，也非单纯 RLS 配置错误。

## 2) 与部署链路配置偏差相关的证据
- `wrangler.toml` 中存在本地开发 KV 配置：
  - `id = "local-dev"`
- 该配置用于本地/测试上下文，若直接走 Worker deploy 到线上，会引发资源绑定不可用或发布报错。
- `workers/space-api.ts` 本身是最小 API 适配代码，不承担 Supabase JWT 校验逻辑，不能解释 Supabase Data API 的 JWT 拒绝。

## 3) 环境开关与发布策略证据
- `.env.production` 仅保留 Supabase 前端公开配置，未启用 Cloudflare API base。
- `.env.local` 中 `VITE_CLOUDFLARE_API_BASE` 当前为空，表明本地已回到 Supabase 主链路验收。

## 根因分析（5 Whys 摘要）
1. 为什么用户感知为“部署失败”？
因为上线前后连续出现“云端不可用 + 发布失败”，外观相似。

2. 为什么云端不可用？
因为 Supabase 侧存在官方已确认的 JWT 拒绝事故，影响 Data API 链路。

3. 为什么后来又出现发布失败？
因为应急切换 Cloudflare 时，误用了 Worker deploy 链路而非静态 Pages 构建链路。

4. 为什么会误切换？
因为“Cloudflare Pages 静态站”和“Cloudflare Worker 后端”在操作入口与配置上容易混用，且当时处于紧急恢复阶段。

5. 为什么未第一时间隔离两类问题？
因为缺少一份固定的“故障分层判定清单”（Auth 成功/Data 失败、部署失败、网络可达性分别诊断）。

## 事故定性
这是一次“外部平台故障触发 + 内部应急流程失配”的复合事故：
- 主触发：外部（Supabase API Gateway/JWT 事故）
- 次触发：内部（Cloudflare 发布链路选择不一致）

## 处置过程与有效动作
1. 先做链路验证，确认不是数据库 schema/RLS 直接损坏。
2. 对 Cloudflare 适配层做最小实现与单测，保证可切换能力。
3. 发布策略回调为 Supabase-only，减少故障面。
4. 部署方式纠偏为静态站路径（构建 `dist`），避免 Worker 绑定差异干扰。
5. 后续对测试数据残留（统计污染）进行定向清理，恢复业务观测面板可信度。

## 影响评估
- 用户体验：登录后偶发无法进入云端空间，造成“像是账号坏了”的强负面感知。
- 发布效率：多次重试与切链导致发布时间推迟。
- 工程风险：应急分支多、开关切换频繁，提升回归验证成本。

## 预防与改进项
## P0（立即）
1. 建立并固化“分层诊断脚本”：
   - Auth 健康检查
   - Data API 健康检查
   - 网络/CORS 快速判定
2. 发布前门禁增加“部署目标确认”：
   - Cloudflare Pages（静态）
   - Cloudflare Worker（函数）
   - 二选一必须明确。
3. 统一环境开关审计：发布前打印 `VITE_CLOUDFLARE_API_BASE`、Supabase URL、构建目标。

## P1（短期）
1. 增加“云端不可用降级策略”文档：
   - 临时切本地只读提示
   - 重试与刷新指引
2. 新增事故 runbook：
   - 当官方状态页有 `identified/degraded` 时，团队默认进入“外部事故模式”，暂停高风险配置改动。

## P2（中期）
1. 评估后端中转方案（仅关键接口），降低前端直连 Data API 的平台耦合风险。
2. 增加发布后自动探测（SLA smoke test）：登录、空间读取、愿望列表、推进写入。

## 本次可复用经验
1. `Auth 200` 不代表数据链路健康，必须拆分验证。
2. 浏览器看到 CORS 报错时，要先判断是否“上游在返回前就被拒绝”。
3. 发布失败先看“部署形态是否选错”，再看代码。

## 附录：关键文件
- Cloudflare Worker 配置：`wrangler.toml`
- Cloudflare 最小 API 适配：`workers/space-api.ts`
- 生产环境变量：`.env.production`
- 本地环境变量：`.env.local`

## 结案判断
截至 2026-08-27，本项目已经完成：
1. 事故归因拆分（外部 JWT 事故 vs 内部部署链路选择）
2. 发布策略收敛（Supabase-only + 静态发布）
3. 数据面板污染清理（与测试愿望删除相关）

后续仍需持续观察 Supabase 官方事故彻底 `Resolved` 后的稳定性表现。