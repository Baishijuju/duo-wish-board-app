 # P1 详细落地计划（已归档）

P1 已结束并归档，当前不再作为活跃上下文。

请转用：
- [项目计划归档 2026-07-05](project-plan-archive-2026-07-05.md)
- [P1 跨页收尾回归清单](p1-cross-page-closeout-regression-checklist-2026-07-05.md)
- [星币一致性回归清单](star-coin-consistency-regression-2026-07-05.md)

如需重新开始新的规划，请直接新建文档，不再沿用 P1 旧上下文。

建议新增文件：
- src/components/page/PageModeFrame.vue
- src/components/page/ActionCard.vue
- src/components/page/ManagePanel.vue

建议组件接口方向：
- PageModeFrame
	- props: `mode`, `defaultMode`, `allowManage`, `storageKey?`
	- slots: `hero`, `action`, `manage`
- ActionCard
	- props: `title`, `eyebrow?`, `summary?`, `tone?`
	- slots: `actions`, `default`
- ManagePanel
	- props: `title`, `eyebrow?`, `summary?`, `defaultOpen?`
	- slots: `actions`, `default`

首轮验收附加要求：
- 切到 Manage 层后，默认态主任务不能消失得过深，必须一眼能回到 Action 层。
- 页面级 mode 只允许 1 个主入口，不再出现多个“管理 / 更多 / 工具”分散按钮抢层级。
- Settings 与 Wish Detail 两页先统一，List 与 Home 允许保留轻差异。

实施步骤：
1. 统一定义 Action 层与 Manage 层的视觉和交互边界。
2. 空间页、详情页先作为双态模板页收敛。
3. 清单页与首页只做轻量跟随，不强行增加切换器。
4. 保证每页默认态只出现一个同级 Primary。

验收标准：
- 用户在不同页面切换时，对“主任务在哪、管理入口在哪”的预期一致。
- 默认态控件数和层级不回弹。
- 新增管理能力优先进入 ManagePanel，而不是回灌到主页面默认态。

风险：
- 把双态做成新的认知负担。
- 页面为了统一而牺牲局部效率。

回滚点：
- 保留页面级 fallback 布局类，支持对个别页面禁用双态壳层。

---

## TP1-2 状态语义中心化
目标：同一状态在不同页面保持同文案、同色彩、同提示语义。

涉及文件（预计）：
- src/pages/List.vue
- src/pages/WishDetailAtelier.vue
- src/pages/Settings.vue
- src/pages/MonthlyReviewPreview.vue
- src/composables/*
- src/shared/*（建议新增状态映射模块）
- src/style.css

建议新增共享模块：
- src/shared/statusSemantics.ts

模块职责：
- status -> label
- status -> tone
- status -> icon
- status -> actionHint

实施步骤：
1. 梳理当前全站状态词：进行中 / 已完成 / 可领取 / 在途 / 未进入 / 暂未同步 等。
2. 建立统一映射字典，禁止页面内硬写重复状态语义。
3. 将清单页、详情页、空间页先切到统一映射。
4. 回顾页只跟随展示层，不自行创造新词。

验收标准：
- 同一状态在不同页面不再出现多套近义写法。
- 调整状态文案时，只改共享映射，不改多个页面模板。
- 颜色和文案语义不再冲突。

风险：
- 状态抽象过头，导致页面失去场景感。

回滚点：
- 保留页面局部 override，但必须显式标注原因。

---

## TP1-3 回顾页信息层级重排
目标：保留复盘价值，但减少解释负担，突出核心三指标与下一步建议。

涉及文件（预计）：
- src/pages/MonthlyReviewPreview.vue
- src/composables/useReviewPageState.ts（如后续需要）
- src/style.css

改造原则：
- 不重写整页叙事语言
- 不新增大段常驻说明
- 保留“有温度”的语气，但减少同屏解释密度

实施步骤：
1. 固定回顾页首屏只保留：热力概览、核心三指标、当期一句结论。
2. 分类推进、留言册、领奖统计、已完本愿望进入次级区块。
3. 对说明性段落优先做层级重排，再决定是否需要折叠。
4. 输出“本期最值得继续做的一件事”作为回顾页动作出口。

验收标准：
- 首屏信息层级比当前更清楚。
- 用户能在 10 秒内说出“这个周期主要发生了什么”。
- 不破坏现有回顾页的叙事质感。

风险：
- 为了收敛层级，误伤回顾页的情绪价值。

回滚点：
- 保留现有板块数据结构，只调整展示顺序与默认展开层级。

---

## 4. 依赖与并行关系
可并行：
- TP1-1 与 TP1-2 可并行。
- TP1-3 可在 TP1-2 状态语义基础稳定后接入。

弱依赖：
- TP0-5 不作为 P1 前置。
- 如果后续需要更严格验证 P1 效果，再补轻量行为记录即可。

---

## 5. 研发交付要求
P1 进入开发前，每个任务包必须补齐：
- 默认态与管理态边界
- 共享组件接口契约
- 状态映射表
- 页面回归范围

没有这些，不进入开发。

---

## 6. P1 发布前回归清单
- 空间页：默认态 / 管理态切换后主任务是否仍清晰
- 清单页：状态语义是否与详情页一致
- 详情页：低频工具是否仍然被稳妥后置
- 回顾页：首屏能否快速读懂本期重点
- 全局：主按钮层级、状态颜色、折叠语气是否一致

---

## 7. 最终判断
P1 不是继续“哪里乱改哪里”，而是把 P0 已经证明有效的局部改造，提升为可复用、可维护、可持续扩展的系统能力。

先结构化，再增长；先一致，再扩张。
