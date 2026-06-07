# 系统文案盘点表

生成时间：2026/6/3 22:29:25

范围说明：主表包含应用内所有系统可见或可感知文案，包括标题、按钮、表单占位、空态、toast/状态/错误、校验提示、aria/屏幕阅读器文案与动态系统文案骨架。真实用户输入内容本体不进入主表；动态变量以 `{变量}` 标出。

确认建议：逐条修改“确认状态”和“备注”。如果需要改文案，可直接在备注栏写新文案。

## 主表：系统文案（1240 条）

| 序号 | 文案原文 | 页面/模块 | 类型 | 出现位置/情形 | 文件与行号 | 动态变量 | 辅助感知 | 确认状态 | 备注 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | 首页 | 全局壳层 / 导航 | 标签 / 选项 | 在 全局壳层 / 导航 的 navItems 区域展示。 | src/App.vue:21 | 无 | 否 | 待确认 |  |
| 2 | 清单 | 全局壳层 / 导航 | 标签 / 选项 | 在 全局壳层 / 导航 的 navItems 区域展示。 | src/App.vue:22 | 无 | 否 | 待确认 |  |
| 3 | 写下 | 全局壳层 / 导航 | 标签 / 选项 | 在 全局壳层 / 导航 的 navItems 区域展示。 | src/App.vue:23 | 无 | 否 | 待确认 |  |
| 4 | 回顾 | 全局壳层 / 导航 | 标签 / 选项 | 在 全局壳层 / 导航 的 navItems 区域展示。 | src/App.vue:24 | 无 | 否 | 待确认 |  |
| 5 | 空间 | 全局壳层 / 导航 | 空态 / 缺省 | 在 全局壳层 / 导航 的 navItems 区域数据为空、不可用或尚未开始时出现。 | src/App.vue:25 | 无 | 否 | 待确认 |  |
| 6 | 暂未同步 | 全局壳层 / 导航 | 正文 / 说明 | 在 全局壳层 / 导航 的 syncLabel 区域展示。；另见 空间页状态/文案构造。 | src/App.vue:32；src/composables/useSpaceState.ts:109 | 无 | 否 | 待确认 |  |
| 7 | 失败 | 全局壳层 / 导航 | 状态 / 反馈 / 错误 | 在 全局壳层 / 导航 的 syncLabel 触发成功、失败、加载或状态更新时出现。；另见 空间页状态/文案构造。 | src/App.vue:35；src/composables/useSpaceState.ts:112 | 无 | 否 | 待确认 |  |
| 8 | 同步异常 | 全局壳层 / 导航 | 状态 / 反馈 / 错误 | 在 全局壳层 / 导航 的 syncLabel 触发成功、失败、加载或状态更新时出现。；另见 空间页状态/文案构造。 | src/App.vue:36；src/composables/useSpaceState.ts:113 | 无 | 否 | 待确认 |  |
| 9 | 同步中 | 全局壳层 / 导航 | 正文 / 说明 | 在 全局壳层 / 导航 的 syncLabel 区域展示。；另见 空间页状态/文案构造。 | src/App.vue:40；src/composables/useSpaceState.ts:117 | 无 | 否 | 待确认 |  |
| 10 | 同步正常 | 全局壳层 / 导航 | 正文 / 说明 | 在 全局壳层 / 导航 的 syncLabel 区域展示。；另见 空间页状态/文案构造。 | src/App.vue:43；src/composables/useSpaceState.ts:120 | 无 | 否 | 待确认 |  |
| 11 | 当前成员 | 全局壳层 / 导航 | 正文 / 说明 | 在 全局壳层 / 导航 的 currentMemberName 区域展示。；另见 写下页状态/文案构造。；另见 详情页。 | src/App.vue:47；src/composables/useComposePreviewState.ts:71；src/pages/WishDetailAtelier.vue:324 | 无 | 否 | 待确认 |  |
| 12 | {currentMemberName} 已进入共享愿望空间 · {syncLabel} · {authStore.members.length} 位成员 | 全局壳层 / 导航 | 空态 / 缺省 | 在 全局壳层 / 导航 的 currentMemberName 区域数据为空、不可用或尚未开始时出现。 | src/App.vue:50 | currentMemberName；syncLabel；authStore.members.length | 否 | 待确认 |  |
| 13 | {currentMemberName} 当前在本地演示空间 · {syncLabel} · {authStore.members.length} 位成员 | 全局壳层 / 导航 | 空态 / 缺省 | 在 全局壳层 / 导航 的 currentMemberName 区域数据为空、不可用或尚未开始时出现。 | src/App.vue:53 | currentMemberName；syncLabel；authStore.members.length | 否 | 待确认 |  |
| 14 | Two Hearts, One Horizon | 全局壳层 / 导航 | 正文 / 说明 | 在 全局壳层 / 导航 的 <p> 区域展示。 | src/App.vue:70 | 无 | 否 | 待确认 |  |
| 15 | 人生愿望清单 | 全局壳层 / 导航 | 标题 | 在 全局壳层 / 导航 的 <h1> 区域展示。 | src/App.vue:72 | 无 | 否 | 待确认 |  |
| 16 | 桌面端主导航 | 全局壳层 / 导航 | 可访问性 / aria | 在 全局壳层 / 导航 的 <nav> 区域供屏幕阅读器或辅助技术感知。 | src/App.vue:77 | 无 | 是 | 待确认 |  |
| 17 | 移动端主导航 | 全局壳层 / 导航 | 可访问性 / aria | 在 全局壳层 / 导航 的 <nav> 区域供屏幕阅读器或辅助技术感知。 | src/App.vue:95 | 无 | 是 | 待确认 |  |
| 18 | 金描边大星按 10 颗计，另有 {wishBottleHiddenStarCount} 颗收起 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:196；src/pages/HomeAtelier.vue:282 | wishBottleHiddenStarCount | 否 | 待确认 |  |
| 19 | 金描边大星按 10 颗计 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:198；src/pages/HomeAtelier.vue:284 | 无 | 否 | 待确认 |  |
| 20 | 数字推进和完成步骤都会落成星星 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:199；src/pages/HomeAtelier.vue:285 | 无 | 否 | 待确认 |  |
| 21 | 在路上 | 愿望瓶组件 | 标签 / 选项 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:203；src/pages/HomeAtelier.vue:289 | 无 | 否 | 待确认 |  |
| 22 | 今天还在推进中的愿望 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:204；src/pages/HomeAtelier.vue:290 | 无 | 否 | 待确认 |  |
| 23 | {snapshot.activeWishCount} 个 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:205；src/pages/HomeAtelier.vue:291 | snapshot.activeWishCount | 否 | 待确认 |  |
| 24 | 等待开始 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:205；src/pages/HomeAtelier.vue:291 | 无 | 否 | 待确认 |  |
| 25 | 已点亮 | 愿望瓶组件 | 标签 / 选项 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:208；src/pages/HomeAtelier.vue:294 | 无 | 否 | 待确认 |  |
| 26 | {displayStarCount} 颗 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:210；src/pages/HomeAtelier.vue:296 | displayStarCount | 否 | 待确认 |  |
| 27 | 等待第一颗 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:210；src/pages/HomeAtelier.vue:296 | 无 | 否 | 待确认 |  |
| 28 | 最近更新 | 愿望瓶组件 | 标签 / 选项 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:213；src/pages/HomeAtelier.vue:299 | 无 | 否 | 待确认 |  |
| 29 | {latestMoment.actorLabel} 刚留下了一笔新记录 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 页面/模块渲染或状态计算时 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:215；src/pages/HomeAtelier.vue:301 | latestMoment.actorLabel | 否 | 待确认 |  |
| 30 | 下一次推进会留在这里 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 页面/模块渲染或状态计算时 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:216；src/pages/HomeAtelier.vue:302 | 无 | 否 | 待确认 |  |
| 31 | 等待更新 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 页面/模块渲染或状态计算时 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:217；src/pages/HomeAtelier.vue:303 | 无 | 否 | 待确认 |  |
| 32 | 下一条愿望会住进来 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 displayStarCount 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:226；src/pages/HomeAtelier.vue:312 | 无 | 否 | 待确认 |  |
| 33 | 第一颗星星会在这里亮起 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 displayStarCount 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:226；src/pages/HomeAtelier.vue:312 | 无 | 否 | 待确认 |  |
| 34 | 先从一件小事开始 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 displayStarCount 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:226；src/pages/HomeAtelier.vue:312 | 无 | 否 | 待确认 |  |
| 35 | {snapshot.activeWishCount} 个愿望在路上 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 chips 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:233；src/pages/HomeAtelier.vue:319 | snapshot.activeWishCount | 否 | 待确认 |  |
| 36 | 已点亮 {displayStarCount} 颗星星 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 chips 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:234；src/pages/HomeAtelier.vue:320 | displayStarCount | 否 | 待确认 |  |
| 37 | 第一颗星星还在路上 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 chips 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:234；src/pages/HomeAtelier.vue:320 | 无 | 否 | 待确认 |  |
| 38 | {approachingWishCount} 条愿望正在靠近 | 愿望瓶组件 | 状态 / 反馈 / 错误 | 在 愿望瓶组件 的 chips 触发成功、失败、加载或状态更新时出现。；另见 首页。 | src/components/WishBottlePreviewCard.vue:235；src/pages/HomeAtelier.vue:321 | approachingWishCount | 否 | 待确认 |  |
| 39 | 金描边大星 = 10 颗 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 chips 区域展示。 | src/components/WishBottlePreviewCard.vue:239 | 无 | 否 | 待确认 |  |
| 40 | 另有 {wishBottleHiddenStarCount} 颗星星收起 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 chips 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:243；src/pages/HomeAtelier.vue:325 | wishBottleHiddenStarCount | 否 | 待确认 |  |
| 41 | 一起 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 getThreadActorLabel 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:251；src/pages/HomeAtelier.vue:489 | 无 | 否 | 待确认 |  |
| 42 | 我们 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 getThreadActorLabel 区域展示。；另见 写下页状态/文案构造。；另见 详情页状态/文案构造。；另见 首页。；另见 清单页。 | src/components/WishBottlePreviewCard.vue:254；src/composables/useComposePreviewState.ts:67；src/composables/useWishDetailPageState.ts:18；src/pages/HomeAtelier.vue:171；src/pages/HomeAtelier.vue:492；src/pages/List.vue:43 | 无 | 否 | 待确认 |  |
| 43 | 愿望瓶正在等新的愿望住进来 | 愿望瓶组件 | 状态 / 反馈 / 错误 | 在 愿望瓶组件 的 displayStarCount 触发成功、失败、加载或状态更新时出现。；另见 首页。 | src/components/WishBottlePreviewCard.vue:282；src/pages/HomeAtelier.vue:416 | 无 | 否 | 待确认 |  |
| 44 | 愿望瓶正在等第一颗星星落下来 | 愿望瓶组件 | 状态 / 反馈 / 错误 | 在 愿望瓶组件 的 displayStarCount 触发成功、失败、加载或状态更新时出现。；另见 首页。 | src/components/WishBottlePreviewCard.vue:286；src/pages/HomeAtelier.vue:420 | 无 | 否 | 待确认 |  |
| 45 | 愿望瓶已经亮起 {displayStarCount} 颗星星 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 displayStarCount 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:289；src/pages/HomeAtelier.vue:423 | displayStarCount | 否 | 待确认 |  |
| 46 | 等下一条愿望写下后，这里会先亮起来。 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 snapshot 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:296；src/pages/HomeAtelier.vue:430 | 无 | 否 | 待确认 |  |
| 47 | {snapshot.activeWishCount} 个愿望还在路上。 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 snapshot 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:299；src/pages/HomeAtelier.vue:433 | snapshot.activeWishCount | 否 | 待确认 |  |
| 48 | 下一次推进会让这里亮起来。 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 approachingWishCount 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:308；src/pages/HomeAtelier.vue:442 | 无 | 否 | 待确认 |  |
| 49 | {approachingWishCount} 个愿望正在靠近。 | 愿望瓶组件 | 状态 / 反馈 / 错误 | 在 愿望瓶组件 的 approachingWishCount 触发成功、失败、加载或状态更新时出现。；另见 首页。 | src/components/WishBottlePreviewCard.vue:311；src/pages/HomeAtelier.vue:445 | approachingWishCount | 否 | 待确认 |  |
| 50 | 时间待同步 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 now 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:352；src/pages/HomeAtelier.vue:652 | 无 | 否 | 待确认 |  |
| 51 | 今天 {target.hour}:{target.minute} | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 now 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:356；src/pages/HomeAtelier.vue:656 | target.hour；target.minute | 否 | 待确认 |  |
| 52 | {target.month}月{target.day}日 {target.hour}:{target.minute} | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 now 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:360；src/pages/HomeAtelier.vue:660 | target.month；target.day；target.hour；target.minute | 否 | 待确认 |  |
| 53 | {target.year}年{target.month}月{target.day}日 {target.hour}:{target.minute} | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 now 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:363；src/pages/HomeAtelier.vue:663 | target.year；target.month；target.day；target.hour；target.minute | 否 | 待确认 |  |
| 54 | 愿望瓶 Wish Bottle | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 <p> 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:381；src/pages/HomeAtelier.vue:724 | 无 | 否 | 待确认 |  |
| 55 | 手工细丝带软木塞玻璃愿望瓶 | 愿望瓶组件 | 可访问性 / aria | 在 愿望瓶组件 的 <svg> 区域供屏幕阅读器或辅助技术感知。；另见 首页。 | src/components/WishBottlePreviewCard.vue:395；src/pages/HomeAtelier.vue:738 | 无 | 是 | 待确认 |  |
| 56 | userSpaceOnUse | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 <linearGradient> 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:397；src/components/WishBottlePreviewCard.vue:404；src/components/WishBottlePreviewCard.vue:410；src/components/WishBottlePreviewCard.vue:415；src/components/WishBottlePreviewCard.vue:420；src/components/WishBottlePreviewCard.vue:430；src/components/WishBottlePreviewCard.vue:435；src/components/WishBottlePreviewCard.vue:440；src/pages/HomeAtelier.vue:740；src/pages/HomeAtelier.vue:747；src/pages/HomeAtelier.vue:753；src/pages/HomeAtelier.vue:758；src/pages/HomeAtelier.vue:763；src/pages/HomeAtelier.vue:773；src/pages/HomeAtelier.vue:778；src/pages/HomeAtelier.vue:783 | 无 | 否 | 待确认 |  |
| 57 | 现在的愿望瓶 Now in Bottle | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 <p> 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:581；src/pages/HomeAtelier.vue:924 | 无 | 否 | 待确认 |  |
| 58 | 一起看见 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 scopeOptions 区域展示。 | src/composables/useComposePreviewState.ts:7 | 无 | 否 | 待确认 |  |
| 59 | 这条愿望会一起被看见，也更容易一起往前推。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 scopeOptions 区域展示。 | src/composables/useComposePreviewState.ts:8 | 无 | 否 | 待确认 |  |
| 60 | 先留给自己 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 scopeOptions 区域展示。 | src/composables/useComposePreviewState.ts:12 | 无 | 否 | 待确认 |  |
| 61 | 先只留给自己，等想公开的时候再说。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 scopeOptions 区域展示。 | src/composables/useComposePreviewState.ts:13 | 无 | 否 | 待确认 |  |
| 62 | 最想先靠近 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 priorityOptions 区域展示。 | src/composables/useComposePreviewState.ts:20 | 无 | 否 | 待确认 |  |
| 63 | 想尽快把它放到最近会去碰的一层。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 priorityOptions 区域展示。 | src/composables/useComposePreviewState.ts:21 | 无 | 否 | 待确认 |  |
| 64 | 稳稳往前 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 priorityOptions 区域展示。 | src/composables/useComposePreviewState.ts:25 | 无 | 否 | 待确认 |  |
| 65 | 不着急，但希望它一直在往前走。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 priorityOptions 区域展示。 | src/composables/useComposePreviewState.ts:26 | 无 | 否 | 待确认 |  |
| 66 | 先替它留位 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 priorityOptions 区域展示。 | src/composables/useComposePreviewState.ts:30 | 无 | 否 | 待确认 |  |
| 67 | 先认真放进生活里，之后再慢慢把它提近。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 priorityOptions 区域展示。 | src/composables/useComposePreviewState.ts:31 | 无 | 否 | 待确认 |  |
| 68 | 先只写下来 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 progressOptions 区域展示。 | src/composables/useComposePreviewState.ts:38 | 无 | 否 | 待确认 |  |
| 69 | 先把愿望放稳，进度以后再补。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressOptions 区域展示。 | src/composables/useComposePreviewState.ts:39 | 无 | 否 | 待确认 |  |
| 70 | 按数字靠近 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 progressOptions 区域展示。 | src/composables/useComposePreviewState.ts:43 | 无 | 否 | 待确认 |  |
| 71 | 适合次数、公里、章节这类能慢慢累计的目标。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressOptions 区域展示。 | src/composables/useComposePreviewState.ts:44 | 无 | 否 | 待确认 |  |
| 72 | 按步骤慢慢走 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 progressOptions 区域展示。 | src/composables/useComposePreviewState.ts:48 | 无 | 否 | 待确认 |  |
| 73 | 先拆成几步，再一小步一小步走完。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressOptions 区域展示。 | src/composables/useComposePreviewState.ts:49 | 无 | 否 | 待确认 |  |
| 74 | 这条愿望还在等名字 | 写下页状态/文案构造 | 标题 | 在 写下页状态/文案构造 的 draftTitlePreview 区域展示。 | src/composables/useComposePreviewState.ts:104 | 无 | 否 | 待确认 |  |
| 75 | 等你留下一句为什么想实现，它才更像会被回看的那一页。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 draftNotePreview 区域展示。 | src/composables/useComposePreviewState.ts:107 | 无 | 否 | 待确认 |  |
| 76 | 把这条愿望整理成它现在最像的样子 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 composerHeadline 区域展示。 | src/composables/useComposePreviewState.ts:111 | 无 | 否 | 待确认 |  |
| 77 | 把一个愿望认真写进今天 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 composerHeadline 区域展示。 | src/composables/useComposePreviewState.ts:111 | 无 | 否 | 待确认 |  |
| 78 | 这一页只整理基本信息，让标题、范围和进度方式重新对齐。 | 写下页状态/文案构造 | 标题 | 在 写下页状态/文案构造 的 composerLead 区域展示。 | src/composables/useComposePreviewState.ts:115 | 无 | 否 | 待确认 |  |
| 79 | 不用一次写满，先写名字、方向和一点想实现它的心情。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 composerLead 区域展示。 | src/composables/useComposePreviewState.ts:118 | 无 | 否 | 待确认 |  |
| 80 | 先等一个目标数 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressSummary 区域展示。 | src/composables/useComposePreviewState.ts:123 | 无 | 否 | 待确认 |  |
| 81 | 现在 {draft.progressCurrent}/{draft.progressTarget} {unitText} | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 unitText 区域展示。 | src/composables/useComposePreviewState.ts:127 | draft.progressCurrent；draft.progressTarget；unitText | 否 | 待确认 |  |
| 82 | 步骤继续留在详情页 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 unitText 区域展示。 | src/composables/useComposePreviewState.ts:132 | 无 | 否 | 待确认 |  |
| 83 | 先拆成 {initialStepCount} 步 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 unitText 区域展示。 | src/composables/useComposePreviewState.ts:135 | initialStepCount | 否 | 待确认 |  |
| 84 | 还没写起步步骤 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 unitText 区域展示。 | src/composables/useComposePreviewState.ts:135 | 无 | 否 | 待确认 |  |
| 85 | 先只写愿望本身 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 unitText 区域展示。 | src/composables/useComposePreviewState.ts:138 | 无 | 否 | 待确认 |  |
| 86 | 它会按数字记下每次靠近，后面还能继续改。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressDetail 区域展示。 | src/composables/useComposePreviewState.ts:143 | 无 | 否 | 待确认 |  |
| 87 | 先给它一个大于 0 的目标数。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressDetail 区域展示。 | src/composables/useComposePreviewState.ts:144 | 无 | 否 | 待确认 |  |
| 88 | 这条愿望已经有步骤区了，这里只整理基本信息。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressDetail 区域展示。 | src/composables/useComposePreviewState.ts:149 | 无 | 否 | 待确认 |  |
| 89 | 先写第一批步骤，写下后再去详情页补全和勾选。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressDetail 区域展示。 | src/composables/useComposePreviewState.ts:150 | 无 | 否 | 待确认 |  |
| 90 | 先把愿望本身写稳，进度以后再补。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressDetail 区域展示。 | src/composables/useComposePreviewState.ts:153 | 无 | 否 | 待确认 |  |
| 91 | 还没定下日子 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 dueTimestamp 区域展示。 | src/composables/useComposePreviewState.ts:205 | 无 | 否 | 待确认 |  |
| 92 | 已经过了 {Math.abs} 天 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 dayDifference 区域展示。 | src/composables/useComposePreviewState.ts:213 | Math.abs | 否 | 待确认 |  |
| 93 | 就定在今天 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 dayDifference 区域展示。 | src/composables/useComposePreviewState.ts:217 | 无 | 否 | 待确认 |  |
| 94 | 还有 1 天 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 dayDifference 区域展示。 | src/composables/useComposePreviewState.ts:221 | 无 | 否 | 待确认 |  |
| 95 | 还有 {dayDifference} 天 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 dayDifference 区域展示。 | src/composables/useComposePreviewState.ts:224 | dayDifference | 否 | 待确认 |  |
| 96 | 旅行 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 categorySuggestions 区域展示。 | src/composables/useComposeWishForm.ts:21 | 无 | 否 | 待确认 |  |
| 97 | 生活 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 categorySuggestions 区域展示。 | src/composables/useComposeWishForm.ts:21；src/pages/ComposeAtelier.vue:279 | 无 | 否 | 待确认 |  |
| 98 | 成长 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 categorySuggestions 区域展示。 | src/composables/useComposeWishForm.ts:21 | 无 | 否 | 待确认 |  |
| 99 | 健康 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 categorySuggestions 区域展示。 | src/composables/useComposeWishForm.ts:21 | 无 | 否 | 待确认 |  |
| 100 | 纪念 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 categorySuggestions 区域展示。 | src/composables/useComposeWishForm.ts:21 | 无 | 否 | 待确认 |  |
| 101 | 先写下这条愿望是什么。 | 写下页状态/文案构造 | 状态 / 反馈 / 错误 | 在 写下页状态/文案构造 的 submitWish 触发成功、失败、加载或状态更新时出现。 | src/composables/useComposeWishForm.ts:115 | 无 | 否 | 待确认 |  |
| 102 | 如果想按数字记进度，先写一个大于 0 的目标值。 | 写下页状态/文案构造 | 状态 / 反馈 / 错误 | 在 写下页状态/文案构造 的 submitWish 触发成功、失败、加载或状态更新时出现。 | src/composables/useComposeWishForm.ts:121 | 无 | 否 | 待确认 |  |
| 103 | 这条愿望已经按现在的样子改好了。 | 写下页状态/文案构造 | 状态 / 反馈 / 错误 | 在 写下页状态/文案构造 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/composables/useComposeWishForm.ts:138 | 无 | 否 | 待确认 |  |
| 104 | 这个愿望暂时还没写进去。 | 写下页状态/文案构造 | 状态 / 反馈 / 错误 | 在 写下页状态/文案构造 的 createdWishId 触发成功、失败、加载或状态更新时出现。 | src/composables/useComposeWishForm.ts:147 | 无 | 否 | 待确认 |  |
| 105 | 这条愿望和 {initialSteps.length} 个起步步骤已经放进清单了。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 createdWishId 区域展示。 | src/composables/useComposeWishForm.ts:153 | initialSteps.length | 否 | 待确认 |  |
| 106 | 这条愿望已经放进清单了，步骤后面还可以慢慢补。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 createdWishId 区域展示。 | src/composables/useComposeWishForm.ts:153 | 无 | 否 | 待确认 |  |
| 107 | 这条愿望已经放进清单了。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 createdWishId 区域展示。 | src/composables/useComposeWishForm.ts:154 | 无 | 否 | 待确认 |  |
| 108 | 很想靠近 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 priorityLabels 区域展示。；另见 详情页。 | src/composables/useListWishBoardState.ts:9；src/pages/WishDetailAtelier.vue:9 | 无 | 否 | 待确认 |  |
| 109 | 慢慢靠近 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 priorityLabels 区域展示。；另见 详情页。 | src/composables/useListWishBoardState.ts:10；src/pages/WishDetailAtelier.vue:10 | 无 | 否 | 待确认 |  |
| 110 | 先放在这里 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 priorityLabels 区域展示。；另见 详情页。 | src/composables/useListWishBoardState.ts:11；src/pages/WishDetailAtelier.vue:11 | 无 | 否 | 待确认 |  |
| 111 | 只属于我 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 scopeLabels 区域展示。；另见 回顾页状态/文案构造。；另见 详情页。 | src/composables/useListWishBoardState.ts:15；src/composables/useReviewPageState.ts:270；src/pages/List.vue:29；src/pages/WishDetailAtelier.vue:122 | 无 | 否 | 待确认 |  |
| 112 | 我们一起 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 scopeLabels 区域展示。；另见 回顾页状态/文案构造。；另见 详情页。 | src/composables/useListWishBoardState.ts:16；src/composables/useReviewPageState.ts:270；src/pages/List.vue:28；src/pages/WishDetailAtelier.vue:122 | 无 | 否 | 待确认 |  |
| 113 | 未命名成员 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 getMemberName 区域展示。；另见 回顾页状态/文案构造。；另见 空间页状态/文案构造。；另见 详情页状态/文案构造。；另见 愿望/奖励/同步状态。 | src/composables/useListWishBoardState.ts:58；src/composables/useReviewPageState.ts:210；src/composables/useSpaceState.ts:87；src/composables/useWishDetailState.ts:216；src/stores/wishes.ts:2391 | 无 | 否 | 待确认 |  |
| 114 | 没有设定日期，慢慢来 | 清单页状态/文案构造 | 空态 / 缺省 | 在 清单页状态/文案构造 的 dueTimestamp 区域数据为空、不可用或尚未开始时出现。；另见 首页。 | src/composables/useListWishBoardState.ts:89；src/pages/HomeAtelier.vue:355 | 无 | 否 | 待确认 |  |
| 115 | 这个愿望已经在这里等了我们 {Math.abs} 天。 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 dayDifference 区域展示。 | src/composables/useListWishBoardState.ts:97 | Math.abs | 否 | 待确认 |  |
| 116 | 就是今天 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 dayDifference 区域展示。；另见 首页。 | src/composables/useListWishBoardState.ts:101；src/pages/HomeAtelier.vue:367 | 无 | 否 | 待确认 |  |
| 117 | 明天就到约定的日子 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 dayDifference 区域展示。；另见 首页。 | src/composables/useListWishBoardState.ts:105；src/pages/HomeAtelier.vue:371 | 无 | 否 | 待确认 |  |
| 118 | 还剩 {dayDifference} 天 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 dayDifference 区域展示。 | src/composables/useListWishBoardState.ts:108 | dayDifference | 否 | 待确认 |  |
| 119 | 已经实现 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 getWishMood 区域展示。 | src/composables/useListWishBoardState.ts:117；src/pages/List.vue:35 | 无 | 否 | 待确认 |  |
| 120 | 快要靠近了 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 daysLeft 区域展示。 | src/composables/useListWishBoardState.ts:128 | 无 | 否 | 待确认 |  |
| 121 | 集齐七龙珠 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 coinSnapshot 区域展示。 | src/composables/useListWishBoardState.ts:135 | 无 | 否 | 待确认 |  |
| 122 | {coinSnapshot.total} 枚愿望币 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 coinSnapshot 区域展示。 | src/composables/useListWishBoardState.ts:139 | coinSnapshot.total | 否 | 待确认 |  |
| 123 | 已经留下痕迹 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 coinSnapshot 区域展示。 | src/composables/useListWishBoardState.ts:143 | 无 | 否 | 待确认 |  |
| 124 | 正在路上 | 清单页状态/文案构造 | 状态 / 反馈 / 错误 | 在 清单页状态/文案构造 的 coinSnapshot 触发成功、失败、加载或状态更新时出现。 | src/composables/useListWishBoardState.ts:146 | 无 | 否 | 待确认 |  |
| 125 | 数字上已经走满了，等你亲手把它收进回忆里。 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 progress 区域展示。 | src/composables/useListWishBoardState.ts:158 | 无 | 否 | 待确认 |  |
| 126 | 每次往前走一点点，这里都会记住。 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 progress 区域展示。 | src/composables/useListWishBoardState.ts:161 | 无 | 否 | 待确认 |  |
| 127 | 还没有拆成小步骤，可以去详情页慢慢补。 | 清单页状态/文案构造 | 空态 / 缺省 | 在 清单页状态/文案构造 的 progress 区域数据为空、不可用或尚未开始时出现。 | src/composables/useListWishBoardState.ts:166 | 无 | 否 | 待确认 |  |
| 128 | 这些小步骤都走完了，只差你轻轻确认，把它收进已实现。 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 progress 区域展示。 | src/composables/useListWishBoardState.ts:170 | 无 | 否 | 待确认 |  |
| 129 | 下一步已经在路上。 | 清单页状态/文案构造 | 标题 | 在 清单页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useListWishBoardState.ts:173 | 无 | 否 | 待确认 |  |
| 130 | 卷首摘要 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHighlights 区域展示。 | src/composables/useReviewPageState.ts:40 | 无 | 否 | 待确认 |  |
| 131 | 已经写下 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 reviewHighlights 区域展示。 | src/composables/useReviewPageState.ts:43 | 无 | 否 | 待确认 |  |
| 132 | {wishStore.stats.active} 个还在继续往前走 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHighlights 区域展示。 | src/composables/useReviewPageState.ts:44 | wishStore.stats.active | 否 | 待确认 |  |
| 133 | 这一周 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHighlights 区域展示。 | src/composables/useReviewPageState.ts:49 | 无 | 否 | 待确认 |  |
| 134 | 已经投出 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 reviewHighlights 区域展示。 | src/composables/useReviewPageState.ts:52 | 无 | 否 | 待确认 |  |
| 135 | 手里还留着 {wishStore.stats.currentCycleCoinsRemaining} 枚愿望币 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHighlights 区域展示。 | src/composables/useReviewPageState.ts:53 | wishStore.stats.currentCycleCoinsRemaining | 否 | 待确认 |  |
| 136 | 七龙珠 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。；另见 详情页状态/文案构造。 | src/composables/useReviewPageState.ts:58；src/composables/useReviewPageState.ts:243；src/composables/useWishDetailState.ts:248 | 无 | 否 | 待确认 |  |
| 137 | 已经集齐 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:61 | 无 | 否 | 待确认 |  |
| 138 | {topCoinWish.title} 现在有 {topCoinWishSummary.total} 枚愿望币 | 回顾页状态/文案构造 | 标题 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:63 | topCoinWish.title；topCoinWishSummary.total；title | 否 | 待确认 |  |
| 139 | 先集到 {DRAGON_BALL_COIN_TARGET} 枚愿望币再召唤神龙 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:64 | DRAGON_BALL_COIN_TARGET | 否 | 待确认 |  |
| 140 | 照片记忆 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:69 | 无 | 否 | 待确认 |  |
| 141 | 已经存下 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:72 | 无 | 否 | 待确认 |  |
| 142 | 这段时间已经开始有能翻出来看的画面了 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:73 | 无 | 否 | 待确认 |  |
| 143 | 还在等第一张照片把这一页翻开 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:73 | 无 | 否 | 待确认 |  |
| 144 | 先替未来翻开第一期月刊 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHeroTitle 区域展示。 | src/composables/useReviewPageState.ts:80 | 无 | 否 | 待确认 |  |
| 145 | 把正在发生的靠近翻成这一期月刊 | 回顾页状态/文案构造 | 状态 / 反馈 / 错误 | 在 回顾页状态/文案构造 的 reviewHeroTitle 触发成功、失败、加载或状态更新时出现。 | src/composables/useReviewPageState.ts:84 | 无 | 否 | 待确认 |  |
| 146 | 把一起走过的日子翻成一册册月刊 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHeroTitle 区域展示。 | src/composables/useReviewPageState.ts:87 | 无 | 否 | 待确认 |  |
| 147 | 这里以后不会只是统计，它会慢慢收住你们写下、推进、回应和完成的全部痕迹。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHeroLead 区域展示。 | src/composables/useReviewPageState.ts:91 | 无 | 否 | 待确认 |  |
| 148 | 回顾页不负责催促，它只把已经发生过的靠近、回应和完成整理成一册册可以慢慢翻看的记录。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHeroLead 区域展示。 | src/composables/useReviewPageState.ts:94 | 无 | 否 | 待确认 |  |
| 149 | 这一期里，{topCoinWish.title} 暂时最被偏爱，还差 {topCoinWishSummary.remainingToDragonBall} 枚愿望币就能把七龙珠集齐。 | 回顾页状态/文案构造 | 标题 | 在 回顾页状态/文案构造 的 reviewHeroAside 区域展示。 | src/composables/useReviewPageState.ts:98 | topCoinWish.title；topCoinWishSummary.remainingToDragonBall；title | 否 | 待确认 |  |
| 150 | 已经完成的 {wishStore.stats.done} 个愿望会先在这里安静排好，提醒你们这段时间并没有白白过去。 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 reviewHeroAside 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:102 | wishStore.stats.done | 否 | 待确认 |  |
| 151 | 现在先翻看也好，回清单继续推进也好，这一页都会慢慢替你们把过程接住。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHeroAside 区域展示。 | src/composables/useReviewPageState.ts:105 | 无 | 否 | 待确认 |  |
| 152 | {completedWishJournals.length} 本 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:110；src/pages/Stats.vue:140 | completedWishJournals.length | 否 | 待确认 |  |
| 153 | 已经定稿 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:111 | 无 | 否 | 待确认 |  |
| 154 | 完成愿望手账 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:112 | 无 | 否 | 待确认 |  |
| 155 | 已经走完整条路的愿望，会在这里留下更完整的册页。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:113 | 无 | 否 | 待确认 |  |
| 156 | {liveMonthlyThreads.length} 条 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:117；src/pages/Stats.vue:216 | liveMonthlyThreads.length | 否 | 待确认 |  |
| 157 | 这一期正在写 | 回顾页状态/文案构造 | 状态 / 反馈 / 错误 | 在 回顾页状态/文案构造 的 reviewTabOptions 触发成功、失败、加载或状态更新时出现。 | src/composables/useReviewPageState.ts:118 | 无 | 否 | 待确认 |  |
| 158 | 本月实时回顾 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:119 | 无 | 否 | 待确认 |  |
| 159 | {currentMonthLabel} 里正在发生的推进、留言和回应，会先留在这一栏。 | 回顾页状态/文案构造 | 状态 / 反馈 / 错误 | 在 回顾页状态/文案构造 的 reviewTabOptions 触发成功、失败、加载或状态更新时出现。 | src/composables/useReviewPageState.ts:120 | currentMonthLabel | 否 | 待确认 |  |
| 160 | {monthlySnapshots.length} 本 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:124；src/pages/Stats.vue:271 | monthlySnapshots.length | 否 | 待确认 |  |
| 161 | 已经封存 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:125 | 无 | 否 | 待确认 |  |
| 162 | 冻结月刊 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:126 | 无 | 否 | 待确认 |  |
| 163 | 月份过去之后，它会在这里变成不再变化的固定月刊。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:127 | 无 | 否 | 待确认 |  |
| 164 | 这一册还没有写进愿望。先从一个很小的开始，让未来先有一个可以靠近的方向。 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 monthlyNote 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:137 | 无 | 否 | 待确认 |  |
| 165 | 这段时间，你们已经写下了 {wishStore.stats.total} 个愿望。本周的 {WISH_COIN_BUDGET_PER_CYCLE} 枚愿望币还在等着落下，先挑一个最想先靠近的试试看。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 monthlyNote 区域展示。 | src/composables/useReviewPageState.ts:141 | wishStore.stats.total；WISH_COIN_BUDGET_PER_CYCLE | 否 | 待确认 |  |
| 166 | 这段时间，{topCoinWish.title} 已经收到 {topCoinWishSummary.total} 枚愿望币，还差 {topCoinWishSummary.remainingToDragonBall} 枚就能集齐七龙珠。 | 回顾页状态/文案构造 | 标题 | 在 回顾页状态/文案构造 的 monthlyNote 区域展示。 | src/composables/useReviewPageState.ts:145 | topCoinWish.title；topCoinWishSummary.total；topCoinWishSummary.remainingToDragonBall；title | 否 | 待确认 |  |
| 167 | 这段时间，已经有 {wishStore.stats.dragonBallReady} 个愿望集齐了七龙珠。愿望币还可以继续往上投，谁最想先实现，现在会变得更清楚。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 monthlyNote 区域展示。 | src/composables/useReviewPageState.ts:149 | wishStore.stats.dragonBallReady | 否 | 待确认 |  |
| 168 | 这段时间，你们已经写下了 {wishStore.stats.total} 个愿望。虽然还没有哪一条正式完成，但方向已经在那里，先挑一个最容易开始的，在这个周末做一点点就很好。 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 monthlyNote 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:153 | wishStore.stats.total | 否 | 待确认 |  |
| 169 | 这段时间，你们已经把 {wishStore.stats.done} 个愿望收进回忆里，还有 {wishStore.stats.active} 个愿望正在路上。慢慢来，重要的事并没有被日常淹没。 | 回顾页状态/文案构造 | 状态 / 反馈 / 错误 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/composables/useReviewPageState.ts:156 | wishStore.stats.done；wishStore.stats.active | 否 | 待确认 |  |
| 170 | 你这边 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewMembers 区域展示。 | src/composables/useReviewPageState.ts:162 | 无 | 否 | 待确认 |  |
| 171 | 对方这边 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewMembers 区域展示。 | src/composables/useReviewPageState.ts:162 | 无 | 否 | 待确认 |  |
| 172 | {completedCount} 条完成愿望 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:182 | completedCount | 否 | 待确认 |  |
| 173 | 已经有 {completedCount} 条愿望走完整条路。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:184 | completedCount | 否 | 待确认 |  |
| 174 | 这一栏还在等第一条完成愿望。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:185 | 无 | 否 | 待确认 |  |
| 175 | {liveCount} 条本月记录 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:187 | liveCount | 否 | 待确认 |  |
| 176 | 这期已经留下 {liveCount} 条近况。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:189 | liveCount | 否 | 待确认 |  |
| 177 | 这期还没有落下新的近况。 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 latestLiveThread 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:190 | 无 | 否 | 待确认 |  |
| 178 | {snapshotCount} 条封存片段 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:192 | snapshotCount | 否 | 待确认 |  |
| 179 | 已经有 {snapshotCount} 条片段被收进月刊。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:194 | snapshotCount | 否 | 待确认 |  |
| 180 | 这边还没有被封进月刊的片段。 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:195 | 无 | 否 | 待确认 |  |
| 181 | 本月还没有新的动作 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:203 | 无 | 否 | 待确认 |  |
| 182 | 系统 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getThreadActorName 区域展示。；另见 详情页状态/文案构造。；另见 愿望/奖励/同步状态。 | src/composables/useReviewPageState.ts:222；src/composables/useReviewPageState.ts:301；src/composables/useWishDetailState.ts:220；src/stores/wishes.ts:2388 | 无 | 否 | 待确认 |  |
| 183 | 留言 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getThreadEventLabel 区域展示。；另见 详情页状态/文案构造。；另见 愿望/奖励/同步状态。 | src/composables/useReviewPageState.ts:227；src/composables/useWishDetailState.ts:232；src/pages/Stats.vue:299；src/stores/wishes.ts:2541；src/stores/wishes.ts:2546 | 无 | 否 | 待确认 |  |
| 184 | 写下愿望 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getThreadEventLabel 区域展示。 | src/composables/useReviewPageState.ts:231 | 无 | 否 | 待确认 |  |
| 185 | 步骤完成 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getThreadEventLabel 区域展示。；另见 详情页状态/文案构造。 | src/composables/useReviewPageState.ts:235；src/composables/useWishDetailState.ts:240 | 无 | 否 | 待确认 |  |
| 186 | 愿望币 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getThreadEventLabel 区域展示。；另见 愿望/奖励/同步状态。 | src/composables/useReviewPageState.ts:239；src/stores/wishes.ts:2640 | 无 | 否 | 待确认 |  |
| 187 | 愿望完成 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:247 | 无 | 否 | 待确认 |  |
| 188 | 兑换奖励 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。；另见 空间页状态/文案构造。；另见 详情页状态/文案构造。 | src/composables/useReviewPageState.ts:251；src/composables/useSpaceState.ts:524；src/composables/useWishDetailState.ts:256 | 无 | 否 | 待确认 |  |
| 189 | 每周发币 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:255 | 无 | 否 | 待确认 |  |
| 190 | 领取奖励 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:258 | 无 | 否 | 待确认 |  |
| 191 | 空间记录 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 getWishTitle 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:263 | 无 | 否 | 待确认 |  |
| 192 | 已经归档的愿望 | 回顾页状态/文案构造 | 标题 | 在 回顾页状态/文案构造 的 getWishTitle 区域展示。 | src/composables/useReviewPageState.ts:266 | 无 | 否 | 待确认 |  |
| 193 | 记录 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getSnapshotBlockLabel 区域展示。 | src/composables/useReviewPageState.ts:297；src/pages/Stats.vue:295 | 无 | 否 | 待确认 |  |
| 194 | 这页月刊里保存了一条固定记录。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getSnapshotBlockMessage 区域展示。 | src/composables/useReviewPageState.ts:309 | 无 | 否 | 待确认 |  |
| 195 | {year} 年 {month} 月 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 formatMonthLabel 区域展示。 | src/composables/useReviewPageState.ts:381 | year；month | 否 | 待确认 |  |
| 196 | ./useSpaceState | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:2 | 无 | 否 | 待确认 |  |
| 197 | 这间空间还在等第一个名字出现 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 names 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:12 | 无 | 否 | 待确认 |  |
| 198 | 两个人都在 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 heroBadges 区域展示。 | src/composables/useSpacePageState.ts:31 | 无 | 否 | 待确认 |  |
| 199 | 等对方进来 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 heroBadges 区域展示。 | src/composables/useSpacePageState.ts:31 | 无 | 否 | 待确认 |  |
| 200 | {memberNamesLabel} 已经在同一页里碰头。先看现在的节奏，再决定下一步。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 heroCopy 区域展示。 | src/composables/useSpacePageState.ts:38 | memberNamesLabel | 否 | 待确认 |  |
| 201 | {viewerName} 先把这里收好，等对方进来后再一起用。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 heroCopy 区域展示。 | src/composables/useSpacePageState.ts:42 | viewerName | 否 | 待确认 |  |
| 202 | 先从这里进来，这间空间才会慢慢收起两个人的日常。 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 heroCopy 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:45 | 无 | 否 | 待确认 |  |
| 203 | 两个人都已经在这里，可以从节奏或奖励账页继续往下看。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 identitySummary 区域展示。 | src/composables/useSpacePageState.ts:50 | 无 | 否 | 待确认 |  |
| 204 | {viewerName} 先在这里等着，对方拿到邀请口令后就能进来。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 identitySummary 区域展示。 | src/composables/useSpacePageState.ts:54 | viewerName | 否 | 待确认 |  |
| 205 | 先用邮箱进来，这页才会慢慢变成共同空间。 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 identitySummary 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:57 | 无 | 否 | 待确认 |  |
| 206 | 先认人，再看愿望币；邀请、照片和备份都在后面。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryGuide 区域展示。 | src/composables/useSpacePageState.ts:62 | 无 | 否 | 待确认 |  |
| 207 | 先认人，再写奖励；邀请、照片和备份都在后面。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryGuide 区域展示。 | src/composables/useSpacePageState.ts:66 | 无 | 否 | 待确认 |  |
| 208 | 先用邮箱进来，再认人、写奖励。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryGuide 区域展示。 | src/composables/useSpacePageState.ts:69 | 无 | 否 | 待确认 |  |
| 209 | 把名字、成员和加入时间收在一起；现在是{space.currentRoleLabel}，本周还剩 {space.wishStore.currentMemberRemainingCoins} 枚愿望币。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 overviewSummary 区域展示。 | src/composables/useSpacePageState.ts:74 | space.currentRoleLabel；space.wishStore.currentMemberRemainingCoins | 否 | 待确认 |  |
| 210 | 把空间名字、邀请码和加入时间收在一起；现在是{space.currentRoleLabel}，本周还剩 {space.wishStore.currentMemberRemainingCoins} 枚愿望币。 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 overviewSummary 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:77 | space.currentRoleLabel；space.wishStore.currentMemberRemainingCoins | 否 | 待确认 |  |
| 211 | 先看怎么进来和怎么邀请，再看照片余量；概览和同步细节都在后面。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 utilityBandLead 区域展示。 | src/composables/useSpacePageState.ts:82 | 无 | 否 | 待确认 |  |
| 212 | 先把进入方式理顺，再看邀请和照片余量。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 utilityBandLead 区域展示。 | src/composables/useSpacePageState.ts:85 | 无 | 否 | 待确认 |  |
| 213 | 愿望币 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 summaryCards 区域展示。；另见 详情页状态/文案构造。 | src/composables/useSpacePageState.ts:93；src/composables/useWishDetailPageState.ts:40 | 无 | 否 | 待确认 |  |
| 214 | 这周还能投 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:94 | 无 | 否 | 待确认 |  |
| 215 | 想把高档奖励都换一遍，还差 {space.pendingStarCoinSpend} 枚 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:100 | space.pendingStarCoinSpend | 否 | 待确认 |  |
| 216 | 已经够换手边至少一部分大奖励了 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:102 | 无 | 否 | 待确认 |  |
| 217 | 先写几条奖励 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:103 | 无 | 否 | 待确认 |  |
| 218 | 星星币 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 summaryCards 区域展示。；另见 详情页状态/文案构造。 | src/composables/useSpacePageState.ts:104；src/composables/useWishDetailPageState.ts:45 | 无 | 否 | 待确认 |  |
| 219 | 手里已经攒下 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:105 | 无 | 否 | 待确认 |  |
| 220 | {space.currentMemberStarCoins} 枚 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:106；src/composables/useSpacePageState.ts:151 | space.currentMemberStarCoins | 否 | 待确认 |  |
| 221 | 步骤 {space.pendingStepRewards.length} 条 · 数字进度 {space.pendingCountRewardUnits} 点 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:111 | space.pendingStepRewards.length；space.pendingCountRewardUnits | 否 | 待确认 |  |
| 222 | 新的推进会先把小奖励留在这里 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:112 | 无 | 否 | 待确认 |  |
| 223 | 待领取 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:113 | 无 | 否 | 待确认 |  |
| 224 | 空间页统一接住 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:114 | 无 | 否 | 待确认 |  |
| 225 | {space.pendingSmallRewardUnits} 份 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:115 | space.pendingSmallRewardUnits | 否 | 待确认 |  |
| 226 | 最近记下 {space.recentRewardClaims.length} 笔领取记录 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:120 | space.recentRewardClaims.length | 否 | 待确认 |  |
| 227 | 第一笔领取记录会记在这里 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:121 | 无 | 否 | 待确认 |  |
| 228 | 奖励账页 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:122 | 无 | 否 | 待确认 |  |
| 229 | 写下的奖励 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:123 | 无 | 否 | 待确认 |  |
| 230 | {totalRewardCount} 条 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:124 | totalRewardCount | 否 | 待确认 |  |
| 231 | 邀请口令 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 spaceFacts 区域展示。 | src/composables/useSpacePageState.ts:132 | 无 | 否 | 待确认 |  |
| 232 | 登录后把这串口令发给对方。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 spaceFacts 区域展示。 | src/composables/useSpacePageState.ts:133 | 无 | 否 | 待确认 |  |
| 233 | 加入时间 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 spaceFacts 区域展示。 | src/composables/useSpacePageState.ts:137 | 无 | 否 | 待确认 |  |
| 234 | 你进来时的记录。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 spaceFacts 区域展示。 | src/composables/useSpacePageState.ts:138 | 无 | 否 | 待确认 |  |
| 235 | 当前愿望币周期 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 spaceFacts 区域展示。 | src/composables/useSpacePageState.ts:142 | 无 | 否 | 待确认 |  |
| 236 | 本周还可投 {space.wishStore.currentMemberRemainingCoins} 枚。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 spaceFacts 区域展示。 | src/composables/useSpacePageState.ts:143 | space.wishStore.currentMemberRemainingCoins | 否 | 待确认 |  |
| 237 | 我的星星币 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 spaceFacts 区域展示。 | src/composables/useSpacePageState.ts:147 | 无 | 否 | 待确认 |  |
| 238 | 可以拿来换大奖励。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:149 | 无 | 否 | 待确认 |  |
| 239 | 先把奖励写起来。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:150 | 无 | 否 | 待确认 |  |
| 240 | 看看最近谁在推进，谁也该被接一下。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 relationshipLead 区域展示。 | src/composables/useSpacePageState.ts:158 | 无 | 否 | 待确认 |  |
| 241 | 先把这里收好，等对方进来。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 relationshipLead 区域展示。 | src/composables/useSpacePageState.ts:161 | 无 | 否 | 待确认 |  |
| 242 | 本周还剩 {item.currentCycleRemaining} 枚愿望币，照片约 {space.formatStorageBytes}。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:167 | item.currentCycleRemaining；space.formatStorageBytes | 否 | 待确认 |  |
| 243 | 在路上 {item.active} | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:170 | item.active | 否 | 待确认 |  |
| 244 | 已实现 {item.done} | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:171 | item.done | 否 | 待确认 |  |
| 245 | 一起 {item.sharedCount} | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:172 | item.sharedCount | 否 | 待确认 |  |
| 246 | 私密 {item.privateCount} | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:173 | item.privateCount | 否 | 待确认 |  |
| 247 | 有 {item.overdue} 个愿望慢了一点。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:176 | item.overdue | 否 | 待确认 |  |
| 248 | {item.active} 个愿望在往前走。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:178 | item.active | 否 | 待确认 |  |
| 249 | 可以写下一条新愿望。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:179 | 无 | 否 | 待确认 |  |
| 250 | 留言 {item.comments} · 照片 {item.imageCount} · 已投 {item.currentCycleCoins} | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:180 | item.comments；item.imageCount；item.currentCycleCoins | 否 | 待确认 |  |
| 251 | 已进入 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountBadges 区域展示。 | src/composables/useSpacePageState.ts:186；src/composables/useSpacePageState.ts:186；src/pages/Settings.vue:814 | 无 | 否 | 待确认 |  |
| 252 | 可记住邮箱 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountBadges 区域展示。 | src/composables/useSpacePageState.ts:186 | 无 | 否 | 待确认 |  |
| 253 | 可邀请对方 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountBadges 区域展示。 | src/composables/useSpacePageState.ts:186 | 无 | 否 | 待确认 |  |
| 254 | 待进入 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountBadges 区域展示。 | src/composables/useSpacePageState.ts:189 | 无 | 否 | 待确认 |  |
| 255 | 准备邀请对方 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountBadges 区域展示。 | src/composables/useSpacePageState.ts:189 | 无 | 否 | 待确认 |  |
| 256 | 已经进来了，先把邀请口令交给对方；常用邮箱也能记在这里。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountSummary 区域展示。 | src/composables/useSpacePageState.ts:195 | 无 | 否 | 待确认 |  |
| 257 | 已经进来了，下一步把邀请口令交给对方就好。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountSummary 区域展示。 | src/composables/useSpacePageState.ts:196 | 无 | 否 | 待确认 |  |
| 258 | 先用邮箱进来，再把邀请口令交给对方。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountSummary 区域展示。 | src/composables/useSpacePageState.ts:199 | 无 | 否 | 待确认 |  |
| 259 | 把这串邀请口令发给对方，对方就能进来。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 inviteSummary 区域展示。 | src/composables/useSpacePageState.ts:204 | 无 | 否 | 待确认 |  |
| 260 | 先把自己带进来，这里的邀请口令才接得上。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 inviteSummary 区域展示。 | src/composables/useSpacePageState.ts:207 | 无 | 否 | 待确认 |  |
| 261 | 照片已经有点多了，先留一份备份更安心。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 storageLead 区域展示。 | src/composables/useSpacePageState.ts:212 | 无 | 否 | 待确认 |  |
| 262 | 照片快接近上限了，现在顺手备份最合适。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 storageLead 区域展示。 | src/composables/useSpacePageState.ts:216 | 无 | 否 | 待确认 |  |
| 263 | 照片余量和备份都放在这里，需要时翻开就好。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 storageLead 区域展示。 | src/composables/useSpacePageState.ts:219 | 无 | 否 | 待确认 |  |
| 264 | 已用 {space.storageSummary.usagePercent}% · 还没开始留照片 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 storageSummaryLabel 区域展示。 | src/composables/useSpacePageState.ts:224 | space.storageSummary.usagePercent | 否 | 待确认 |  |
| 265 | 已用 {space.storageSummary.usagePercent}% · 已留下 {space.wishStore.stats.totalImages} 张照片 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 storageSummaryLabel 区域展示。 | src/composables/useSpacePageState.ts:227 | space.storageSummary.usagePercent；space.wishStore.stats.totalImages | 否 | 待确认 |  |
| 266 | 已经留下 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 storageFacts 区域展示。 | src/composables/useSpacePageState.ts:233 | 无 | 否 | 待确认 |  |
| 267 | 照片已占用的空间。 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 storageFacts 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:234 | 无 | 否 | 待确认 |  |
| 268 | 还能放下 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 storageFacts 区域展示。 | src/composables/useSpacePageState.ts:238 | 无 | 否 | 待确认 |  |
| 269 | 按总容量估算的剩余空间。 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 storageFacts 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:239 | 无 | 否 | 待确认 |  |
| 270 | 照片空间 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 storageFacts 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:243 | 无 | 否 | 待确认 |  |
| 271 | 当前总照片额度。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 storageFacts 区域展示。 | src/composables/useSpacePageState.ts:244 | 无 | 否 | 待确认 |  |
| 272 | 照片数量 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 storageFacts 区域展示。 | src/composables/useSpacePageState.ts:248 | 无 | 否 | 待确认 |  |
| 273 | 愿望里的照片总数。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:249 | 无 | 否 | 待确认 |  |
| 274 | {space.wishStore.stats.totalImages} 张 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:250 | space.wishStore.stats.totalImages | 否 | 待确认 |  |
| 275 | Supabase 提示 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 advancedInfoRows 区域展示。 | src/composables/useSpacePageState.ts:258 | 无 | 否 | 待确认 |  |
| 276 | 当前配置 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 advancedInfoRows 区域展示。 | src/composables/useSpacePageState.ts:262 | 无 | 否 | 待确认 |  |
| 277 | Realtime 详细状态 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 advancedInfoRows 区域展示。 | src/composables/useSpacePageState.ts:266 | 无 | 否 | 待确认 |  |
| 278 | Realtime 状态说明 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 advancedInfoRows 区域展示。 | src/composables/useSpacePageState.ts:270 | 无 | 否 | 待确认 |  |
| 279 | 同步摘要 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:274 | 无 | 否 | 待确认 |  |
| 280 | 同步状态、排查信息和退出入口都收在最后。 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 advancedSummary 区域展示。 | src/composables/useSpacePageState.ts:282 | 无 | 否 | 待确认 |  |
| 281 | 现在还是本地体验，这里的信息主要留给排查和退出时看。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 advancedSummary 区域展示。 | src/composables/useSpacePageState.ts:285 | 无 | 否 | 待确认 |  |
| 282 | 创建者 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 roleLabels 区域展示。 | src/composables/useSpaceState.ts:12 | 无 | 否 | 待确认 |  |
| 283 | 成员 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 roleLabels 区域展示。；另见 认证与空间状态。 | src/composables/useSpaceState.ts:13；src/stores/auth.ts:222；src/stores/auth.ts:375 | 无 | 否 | 待确认 |  |
| 284 | 还没有记录加入时间 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 joinedSpaceLabel 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpaceState.ts:93 | 无 | 否 | 待确认 |  |
| 285 | {formatBeijingDateTime} 到 {formatBeijingDateTime} | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 currentWishCoinCycleLabel 区域展示。 | src/composables/useSpaceState.ts:104 | formatBeijingDateTime | 否 | 待确认 |  |
| 286 | 当前环境暂时不能直接复制邀请口令，请手动复制。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 copyInviteCode 区域展示。 | src/composables/useSpaceState.ts:228 | 无 | 否 | 待确认 |  |
| 287 | 邀请口令已经复制好了。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 copyInviteCode 区域展示。 | src/composables/useSpaceState.ts:234 | 无 | 否 | 待确认 |  |
| 288 | 当前环境不支持下载备份文件。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 downloadBackup 区域展示。 | src/composables/useSpaceState.ts:297 | 无 | 否 | 待确认 |  |
| 289 | 这份清单已经备份好了。建议两个人都各自留一份。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 anchor 区域展示。 | src/composables/useSpaceState.ts:313 | 无 | 否 | 待确认 |  |
| 290 | {units} 点 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getPendingCountUnitLabel 区域展示。 | src/composables/useSpaceState.ts:470 | units | 否 | 待确认 |  |
| 291 | 完成愿望 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getRewardClaimLabel 区域展示。 | src/composables/useSpaceState.ts:509 | 无 | 否 | 待确认 |  |
| 292 | 完成步骤 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getRewardClaimLabel 区域展示。 | src/composables/useSpaceState.ts:513 | 无 | 否 | 待确认 |  |
| 293 | 数字进度 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getRewardClaimLabel 区域展示。；另见 详情页。 | src/composables/useSpaceState.ts:517；src/pages/WishDetailAtelier.vue:353 | 无 | 否 | 待确认 |  |
| 294 | 存星星币 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getRewardClaimLabel 区域展示。 | src/composables/useSpaceState.ts:521 | 无 | 否 | 待确认 |  |
| 295 | 这条愿望 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 sourceWishTitle 区域展示。；另见 首页。 | src/composables/useSpaceState.ts:534；src/composables/useSpaceState.ts:534；src/pages/HomeAtelier.vue:532 | 无 | 否 | 待确认 |  |
| 296 | 这份奖励 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useSpaceState.ts:535 | 无 | 否 | 待确认 |  |
| 297 | 因为「{sourceWishTitle}」的小步骤完成了，接住了「{rewardTitle}」。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useSpaceState.ts:538 | sourceWishTitle；rewardTitle | 否 | 待确认 |  |
| 298 | 因为「{sourceWishTitle}」推进了 {Math.max} 点，接住了「{rewardTitle}」。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useSpaceState.ts:542 | sourceWishTitle；Math.max；rewardTitle | 否 | 待确认 |  |
| 299 | 因为「{sourceWishTitle}」整条完成了，接住了「{rewardTitle}」。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useSpaceState.ts:546 | sourceWishTitle；rewardTitle | 否 | 待确认 |  |
| 300 | 因为「{sourceWishTitle}」的小步骤完成了，这次先存成了 {Math.max} 枚星星币。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useSpaceState.ts:551 | sourceWishTitle；Math.max | 否 | 待确认 |  |
| 301 | 因为「{sourceWishTitle}」数字进度推进了 {Math.max} 点，这次先存成了 {Math.max} 枚星星币。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useSpaceState.ts:552 | sourceWishTitle；Math.max | 否 | 待确认 |  |
| 302 | 用星星币兑换到了「{rewardTitle}」。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpaceState.ts:555 | rewardTitle | 否 | 待确认 |  |
| 303 | 还没有定日子 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 dueDateLabel 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailPageState.ts:22 | 无 | 否 | 待确认 |  |
| 304 | {selectedWish.dueDate} 前 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 dueDateLabel 区域展示。 | src/composables/useWishDetailPageState.ts:25 | selectedWish.dueDate | 否 | 待确认 |  |
| 305 | 手账记录 | 详情页状态/文案构造 | 标签 / 选项 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:30 | 无 | 否 | 待确认 |  |
| 306 | 留言、投币和完成痕迹，都会顺着这一页留下。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:31 | 无 | 否 | 待确认 |  |
| 307 | {wishJournalEntries.length} 条 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:32 | wishJournalEntries.length | 否 | 待确认 |  |
| 308 | 图片与纪念 | 详情页状态/文案构造 | 标签 / 选项 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:35 | 无 | 否 | 待确认 |  |
| 309 | 首图会先替这一页把记忆翻开。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:36 | 无 | 否 | 待确认 |  |
| 310 | 还没上传图片，也可以先把过程写下来。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:36 | 无 | 否 | 待确认 |  |
| 311 | {selectedWish} 张 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:37 | selectedWish | 否 | 待确认 |  |
| 312 | {coinSnapshot} 枚 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:42 | coinSnapshot | 否 | 待确认 |  |
| 313 | 已经把「{wishRewardClaim.titleSnapshot}」接住了 | 详情页状态/文案构造 | 标题 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailPageState.ts:46 | wishRewardClaim.titleSnapshot；titleSnapshot；title | 否 | 待确认 |  |
| 314 | 完成时会在这里接住奖励。 | 详情页状态/文案构造 | 标题 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailPageState.ts:46 | 无 | 否 | 待确认 |  |
| 315 | 这条愿望还没决定要怎么记进度，也没关系，先挑一种顺手的记法就能继续往前。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 progressLead 区域展示。 | src/composables/useWishDetailPageState.ts:53 | 无 | 否 | 待确认 |  |
| 316 | 数字进度适合那些一点点累起来的靠近，页数、公里和次数，都能在这里慢慢记下。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 progressLead 区域展示。 | src/composables/useWishDetailPageState.ts:57 | 无 | 否 | 待确认 |  |
| 317 | 步骤进度适合那些要一件件推进的靠近，每做完一步，这一页都会替你记住。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 progressLead 区域展示。 | src/composables/useWishDetailPageState.ts:60 | 无 | 否 | 待确认 |  |
| 318 | 愿望币会在这里慢慢把偏爱、鼓励和推进感攒起来。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 coinLead 区域展示。 | src/composables/useWishDetailPageState.ts:64 | 无 | 否 | 待确认 |  |
| 319 | 七龙珠已经集齐，这条愿望会继续留在更该先靠近的位置。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 coinLead 区域展示。 | src/composables/useWishDetailPageState.ts:68 | 无 | 否 | 待确认 |  |
| 320 | 再投 {coinSnapshot.remainingToDragonBall} 枚，这条愿望就能把七龙珠集齐，也会更靠近最前面。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 coinLead 区域展示。 | src/composables/useWishDetailPageState.ts:69 | coinSnapshot.remainingToDragonBall | 否 | 待确认 |  |
| 321 | 这条愿望完成时，已经把「{wishRewardClaim.titleSnapshot}」好好接住了 | 详情页状态/文案构造 | 标题 | 在 详情页状态/文案构造 的 rewardHeadline 区域展示。 | src/composables/useWishDetailPageState.ts:73 | wishRewardClaim.titleSnapshot；titleSnapshot；title | 否 | 待确认 |  |
| 322 | 推进、投币、留言和领奖，会在这里慢慢长成同一页手账。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 rewardHeadline 区域展示。 | src/composables/useWishDetailPageState.ts:77 | 无 | 否 | 待确认 |  |
| 323 | 这周的愿望币已经投完，但这一页还会继续替你收住过程。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 rewardHeadline 区域展示。 | src/composables/useWishDetailPageState.ts:78 | 无 | 否 | 待确认 |  |
| 324 | 喜欢 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:117 | 无 | 否 | 待确认 |  |
| 325 | 笑出声 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:118 | 无 | 否 | 待确认 |  |
| 326 | 有点惊喜 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:119 | 无 | 否 | 待确认 |  |
| 327 | 太有感觉了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:120 | 无 | 否 | 待确认 |  |
| 328 | 值得庆祝 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:121 | 无 | 否 | 待确认 |  |
| 329 | 好有灵光 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:122 | 无 | 否 | 待确认 |  |
| 330 | 被接住了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:123 | 无 | 否 | 待确认 |  |
| 331 | 真想鼓掌 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:124 | 无 | 否 | 待确认 |  |
| 332 | 有点感动 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:125 | 无 | 否 | 待确认 |  |
| 333 | 好想抱一下 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:126 | 无 | 否 | 待确认 |  |
| 334 | 一起加油 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:127 | 无 | 否 | 待确认 |  |
| 335 | 这刻在发光 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:128 | 无 | 否 | 待确认 |  |
| 336 | 太喜欢了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:129 | 无 | 否 | 待确认 |  |
| 337 | 心都软了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:130 | 无 | 否 | 待确认 |  |
| 338 | 太好了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:131 | 无 | 否 | 待确认 |  |
| 339 | 一起记住 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:132 | 无 | 否 | 待确认 |  |
| 340 | 很安心 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:133 | 无 | 否 | 待确认 |  |
| 341 | 刚刚好 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:134 | 无 | 否 | 待确认 |  |
| 342 | 有点想哭 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:135 | 无 | 否 | 待确认 |  |
| 343 | 好热闹 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:136 | 无 | 否 | 待确认 |  |
| 344 | 想把这刻收起来 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:137 | 无 | 否 | 待确认 |  |
| 345 | 认真谢谢你 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:138 | 无 | 否 | 待确认 |  |
| 346 | 写下 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 sourceStepId 区域展示。 | src/composables/useWishDetailState.ts:236 | 无 | 否 | 待确认 |  |
| 347 | 投币 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 sourceStepId 区域展示。 | src/composables/useWishDetailState.ts:244 | 无 | 否 | 待确认 |  |
| 348 | 完成 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:252 | 无 | 否 | 待确认 |  |
| 349 | 本周发放 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:260 | 无 | 否 | 待确认 |  |
| 350 | 数字奖励 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。；另见 空间页。 | src/composables/useWishDetailState.ts:264；src/composables/useWishDetailState.ts:552；src/pages/Settings.vue:243 | 无 | 否 | 待确认 |  |
| 351 | 进度存币 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:268 | 无 | 否 | 待确认 |  |
| 352 | 领奖 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:271 | 无 | 否 | 待确认 |  |
| 353 | 留下了一句此刻的话 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 sourceStepId 区域展示。 | src/composables/useWishDetailState.ts:279 | 无 | 否 | 待确认 |  |
| 354 | 这条愿望被认真写下 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 sourceStepId 区域展示。 | src/composables/useWishDetailState.ts:283 | 无 | 否 | 待确认 |  |
| 355 | 又往前走完了一小步 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 sourceStepId 区域展示。 | src/composables/useWishDetailState.ts:287 | 无 | 否 | 待确认 |  |
| 356 | 有人替它轻轻投下一枚币 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 sourceStepId 区域展示。 | src/composables/useWishDetailState.ts:291 | 无 | 否 | 待确认 |  |
| 357 | 七龙珠已经集齐 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:295；src/composables/useWishDetailState.ts:489 | 无 | 否 | 待确认 |  |
| 358 | 它被正式收进回忆里 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:299 | 无 | 否 | 待确认 |  |
| 359 | 星星币换成了一份奖励 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:303 | 无 | 否 | 待确认 |  |
| 360 | 这一周的新愿望币到了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:307 | 无 | 否 | 待确认 |  |
| 361 | 数字进度接住了一份小奖励 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:311 | 无 | 否 | 待确认 |  |
| 362 | 数字进度先存成了星星币 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:315 | 无 | 否 | 待确认 |  |
| 363 | 一份奖励被认真接住了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:318 | 无 | 否 | 待确认 |  |
| 364 | 留个回应 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getThreadReactionLabel 区域展示。 | src/composables/useWishDetailState.ts:326 | 无 | 否 | 待确认 |  |
| 365 | ，你已经点过了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 activeCopy 区域展示。 | src/composables/useWishDetailState.ts:331 | 无 | 否 | 待确认 |  |
| 366 | ，目前有 {count} 个回应 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 countCopy 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:332 | count | 否 | 待确认 |  |
| 367 | ，目前还没有回应 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 countCopy 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:332 | 无 | 否 | 待确认 |  |
| 368 | ，正在发送 | 详情页状态/文案构造 | 状态 / 反馈 / 错误 | 在 详情页状态/文案构造 的 pendingCopy 触发成功、失败、加载或状态更新时出现。 | src/composables/useWishDetailState.ts:333 | 无 | 否 | 待确认 |  |
| 369 | 更多表情 · {hiddenReactionKinds} 种回应 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 hiddenReactionKinds 区域展示。 | src/composables/useWishDetailState.ts:397 | hiddenReactionKinds | 否 | 待确认 |  |
| 370 | 更多表情 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 hiddenReactionKinds 区域展示。 | src/composables/useWishDetailState.ts:397 | 无 | 否 | 待确认 |  |
| 371 | 同一条记录里，每位成员最多保留 3 个表情回应。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 thread 区域展示。 | src/composables/useWishDetailState.ts:424 | 无 | 否 | 待确认 |  |
| 372 | 离七龙珠还差 {DRAGON_BALL_COIN_TARGET} 枚 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getCoinStatusLabel 区域展示。 | src/composables/useWishDetailState.ts:486 | DRAGON_BALL_COIN_TARGET | 否 | 待确认 |  |
| 373 | 离七龙珠还差 {coinSnapshot.remainingToDragonBall} 枚 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getCoinStatusLabel 区域展示。 | src/composables/useWishDetailState.ts:489 | coinSnapshot.remainingToDragonBall | 否 | 待确认 |  |
| 374 | 标记为完成 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getWishActionLabel 区域展示。 | src/composables/useWishDetailState.ts:512 | 无 | 否 | 待确认 |  |
| 375 | 放回进行中 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getWishActionLabel 区域展示。 | src/composables/useWishDetailState.ts:516 | 无 | 否 | 待确认 |  |
| 376 | 放回已完成 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getWishActionLabel 区域展示。 | src/composables/useWishDetailState.ts:519 | 无 | 否 | 待确认 |  |
| 377 | 完成并领奖 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getWishActionLabel 区域展示。 | src/composables/useWishDetailState.ts:519 | 无 | 否 | 待确认 |  |
| 378 | 放回未完成 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getStepActionLabel 区域展示。 | src/composables/useWishDetailState.ts:524 | 无 | 否 | 待确认 |  |
| 379 | 重新标记完成 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getStepActionLabel 区域展示。 | src/composables/useWishDetailState.ts:527 | 无 | 否 | 待确认 |  |
| 380 | 标记完成 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getStepActionLabel 区域展示。 | src/composables/useWishDetailState.ts:527 | 无 | 否 | 待确认 |  |
| 381 | 这个小目标已经走完，小奖励也存成了 {claim.titleSnapshot}。 | 详情页状态/文案构造 | 标题 | 在 详情页状态/文案构造 的 claim 区域展示。 | src/composables/useWishDetailState.ts:535 | claim.titleSnapshot；titleSnapshot；title | 否 | 待确认 |  |
| 382 | 这个小目标已经走完，小奖励也已经接住了「{claim.titleSnapshot}」。 | 详情页状态/文案构造 | 标题 | 在 详情页状态/文案构造 的 claim 区域展示。 | src/composables/useWishDetailState.ts:536 | claim.titleSnapshot；titleSnapshot；title | 否 | 待确认 |  |
| 383 | 这个小目标已经走完了，小奖励先在空间页等你去领。 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 claim 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:540 | 无 | 否 | 待确认 |  |
| 384 | 这一步的小奖励已经领过了；再次完成只会记进度，不会再重复发。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 claim 区域展示。 | src/composables/useWishDetailState.ts:544 | 无 | 否 | 待确认 |  |
| 385 | 它还在路上。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 claim 区域展示。 | src/composables/useWishDetailState.ts:547 | 无 | 否 | 待确认 |  |
| 386 | 星星币 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getClaimToneLabel 区域展示。 | src/composables/useWishDetailState.ts:556 | 无 | 否 | 待确认 |  |
| 387 | 星币兑换 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getClaimToneLabel 区域展示。；另见 空间页。 | src/composables/useWishDetailState.ts:560；src/pages/Settings.vue:338 | 无 | 否 | 待确认 |  |
| 388 | 已领奖 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getClaimToneLabel 区域展示。 | src/composables/useWishDetailState.ts:563 | 无 | 否 | 待确认 |  |
| 389 | 数字进度暂时没有更新。 | 详情页状态/文案构造 | 状态 / 反馈 / 错误 | 在 详情页状态/文案构造 的 updated 触发成功、失败、加载或状态更新时出现。 | src/composables/useWishDetailState.ts:693；src/composables/useWishDetailState.ts:730 | 无 | 否 | 待确认 |  |
| 390 | 数字进度往前推进了 {gainedUnits} 点（现在 {nextCurrent}/{selectedWish.progressTarget}${selectedWish.value.progressUnit ? | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 actorId 区域展示。 | src/composables/useWishDetailState.ts:706 | gainedUnits；nextCurrent；selectedWish.progressTarget | 否 | 待确认 |  |
| 391 | 数字进度先往前走了 {gainedUnits} 点，小奖励已经留到空间页等你去领。 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 actorId 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:713 | gainedUnits | 否 | 待确认 |  |
| 392 | 数字进度已经往回调整，空间页里的待领取数量也会跟着收住。 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 actorId 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:715 | 无 | 否 | 待确认 |  |
| 393 | 数字进度已经更新。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 actorId 区域展示。 | src/composables/useWishDetailState.ts:716；src/composables/useWishDetailState.ts:753 | 无 | 否 | 待确认 |  |
| 394 | 数字进度改到了 {nextCurrent}/{selectedWish.progressTarget}${selectedWish.value.progressUnit ? | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 actorId 区域展示。 | src/composables/useWishDetailState.ts:743 | nextCurrent；selectedWish.progressTarget | 否 | 待确认 |  |
| 395 | : ''}，本次新增 {gainedUnits} 点。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 actorId 区域展示。 | src/composables/useWishDetailState.ts:743 | gainedUnits | 否 | 待确认 |  |
| 396 | 数字进度已经补到现在的位置，新增的 {gainedUnits} 点小奖励先在空间页等你。 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 actorId 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:750 | gainedUnits | 否 | 待确认 |  |
| 397 | 数字进度已经重新校正，空间页里的待领取数量也会跟着收住。 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 actorId 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:752 | 无 | 否 | 待确认 |  |
| 398 | 先去空间页给自己准备至少一个高档奖励，再来完成这条愿望。 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 handleWishCompletionAction 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:781 | 无 | 否 | 待确认 |  |
| 399 | 先选一个高档奖励。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 confirmWishCompletionReward 区域展示。 | src/composables/useWishDetailState.ts:792 | 无 | 否 | 待确认 |  |
| 400 | 这个步骤重新记成完成了；小奖励不会重复发，但推进会继续记下。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 updated 区域展示。 | src/composables/useWishDetailState.ts:832 | 无 | 否 | 待确认 |  |
| 401 | 这个步骤已经记成完成了，小奖励先去空间页接住就好。 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 updated 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:833 | 无 | 否 | 待确认 |  |
| 402 | 这个步骤已经放回路上；之前领过的小奖励会保留。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 updated 区域展示。 | src/composables/useWishDetailState.ts:841 | 无 | 否 | 待确认 |  |
| 403 | 这个步骤已经放回路上，空间页里对应的小奖励也会先收住。 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:842 | 无 | 否 | 待确认 |  |
| 404 | 这里只改基本信息；步骤、图片和留言继续回详情页。 | 写下页 | 正文 / 说明 | 在 写下页 的 sideLead 区域展示。 | src/pages/ComposeAtelier.vue:46 | 无 | 否 | 待确认 |  |
| 405 | 这里只留下必要字段，让内容比说明更先被看见。 | 写下页 | 正文 / 说明 | 在 写下页 的 sideLead 区域展示。 | src/pages/ComposeAtelier.vue:49 | 无 | 否 | 待确认 |  |
| 406 | 先不改了 | 写下页 | 正文 / 说明 | 在 写下页 的 resetButtonLabel 区域展示。 | src/pages/ComposeAtelier.vue:53 | 无 | 否 | 待确认 |  |
| 407 | 重置草稿 | 写下页 | 正文 / 说明 | 在 写下页 的 resetButtonLabel 区域展示。 | src/pages/ComposeAtelier.vue:53 | 无 | 否 | 待确认 |  |
| 408 | 保存这次整理 | 写下页 | 正文 / 说明 | 在 写下页 的 submitButtonLabel 区域展示。 | src/pages/ComposeAtelier.vue:57 | 无 | 否 | 待确认 |  |
| 409 | 把这条愿望收进清单 | 写下页 | 正文 / 说明 | 在 写下页 的 submitButtonLabel 区域展示。 | src/pages/ComposeAtelier.vue:57 | 无 | 否 | 待确认 |  |
| 410 | 愿望名字 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:79 | 无 | 否 | 待确认 |  |
| 411 | 例如：一起去看海边的日出 | 写下页 | 输入占位符 | 在 写下页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/ComposeAtelier.vue:80 | 无 | 否 | 待确认 |  |
| 412 | 分类建议 | 写下页 | 可访问性 / aria | 在 写下页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/ComposeAtelier.vue:83 | 无 | 是 | 待确认 |  |
| 413 | 分类 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:97 | 无 | 否 | 待确认 |  |
| 414 | 旅行 / 生活 / 成长 | 写下页 | 输入占位符 | 在 写下页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/ComposeAtelier.vue:98 | 无 | 否 | 待确认 |  |
| 415 | 一句心情 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:102 | 无 | 否 | 待确认 |  |
| 416 | 只留一句就够，比如为什么现在想把它写下来。 | 写下页 | 输入占位符 | 在 写下页 的 <textarea> 表单输入框为空时作为占位提示出现。 | src/pages/ComposeAtelier.vue:107 | 无 | 否 | 待确认 |  |
| 417 | 给它一个被看见的方式 | 写下页 | 标题 | 在 写下页 的 <h2> 区域展示。 | src/pages/ComposeAtelier.vue:115 | 无 | 否 | 待确认 |  |
| 418 | 想把它放在哪一层 | 写下页 | 标题 | 在 写下页 的 <h2> 区域展示。 | src/pages/ComposeAtelier.vue:138 | 无 | 否 | 待确认 |  |
| 419 | Progress | 写下页 | 正文 / 说明 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:160 | 无 | 否 | 待确认 |  |
| 420 | 推进方式 | 写下页 | 标题 | 在 写下页 的 <h2> 区域展示。 | src/pages/ComposeAtelier.vue:161 | 无 | 否 | 待确认 |  |
| 421 | {selectedProgressLabel} | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:163 | 无 | 否 | 待确认 |  |
| 422 | 当前 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:181；src/pages/ComposeAtelier.vue:185 | 无 | 否 | 待确认 |  |
| 423 | 目标 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:189 | 无 | 否 | 待确认 |  |
| 424 | 单位 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:193 | 无 | 否 | 待确认 |  |
| 425 | 次 / 公里 / 页 | 写下页 | 输入占位符 | 在 写下页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/ComposeAtelier.vue:194 | 无 | 否 | 待确认 |  |
| 426 | 起步步骤 {initialStepCount} | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:200 | 无 | 否 | 待确认 |  |
| 427 | 再加一步 | 写下页 | 按钮 / 链接 | 在 写下页 的 <button> 区域作为可点击操作出现。 | src/pages/ComposeAtelier.vue:201 | 无 | 否 | 待确认 |  |
| 428 | 第 {index} 步 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:206 | 无 | 否 | 待确认 |  |
| 429 | 写一个很小的起步动作 | 写下页 | 输入占位符 | 在 写下页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/ComposeAtelier.vue:212 | 无 | 否 | 待确认 |  |
| 430 | 这条愿望已经有步骤管理区了 | 写下页 | 正文 / 说明 | 在 写下页 的 <strong> 区域展示。 | src/pages/ComposeAtelier.vue:223 | 无 | 否 | 待确认 |  |
| 431 | 写下页只改基本信息；如果要继续拆步骤，回详情页会更顺。 | 写下页 | 正文 / 说明 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:224 | 无 | 否 | 待确认 |  |
| 432 | 想在什么时候开始靠近 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:233 | 无 | 否 | 待确认 |  |
| 433 | 实时预览 | 写下页 | 正文 / 说明 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:249 | 无 | 否 | 待确认 |  |
| 434 | 归属 | 写下页 | 正文 / 说明 | 在 写下页 的 <dt> 区域展示。 | src/pages/ComposeAtelier.vue:255 | 无 | 否 | 待确认 |  |
| 435 | 范围 | 写下页 | 标签 / 选项 | 在 写下页 的 <dt> 区域展示。 | src/pages/ComposeAtelier.vue:259 | 无 | 否 | 待确认 |  |
| 436 | 优先级 | 写下页 | 正文 / 说明 | 在 写下页 的 <dt> 区域展示。 | src/pages/ComposeAtelier.vue:263 | 无 | 否 | 待确认 |  |
| 437 | 进度 | 写下页 | 正文 / 说明 | 在 写下页 的 <dt> 区域展示。 | src/pages/ComposeAtelier.vue:267 | 无 | 否 | 待确认 |  |
| 438 | 日期 | 写下页 | 正文 / 说明 | 在 写下页 的 <dt> 区域展示。 | src/pages/ComposeAtelier.vue:271 | 无 | 否 | 待确认 |  |
| 439 | 收进首页时会更像这样 | 写下页 | 标签 / 选项 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:277 | 无 | 否 | 待确认 |  |
| 440 | {draft.category \|\| '生活'} | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:279 | category | 否 | 待确认 |  |
| 441 | 起步步骤 | 写下页 | 标签 / 选项 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:286 | 无 | 否 | 待确认 |  |
| 442 | 你刚刚捎来一句 | 首页 | 正文 / 说明 | 在 首页 的 isViewer 区域展示。 | src/pages/HomeAtelier.vue:230 | 无 | 否 | 待确认 |  |
| 443 | 对方刚刚捎来一句 | 首页 | 正文 / 说明 | 在 首页 的 isViewer 区域展示。 | src/pages/HomeAtelier.vue:230 | 无 | 否 | 待确认 |  |
| 444 | 先写下一条愿望，今天最该关心的事就会先出现在这里。 | 首页 | 正文 / 说明 | 在 首页 的 heroLead 区域展示。 | src/pages/HomeAtelier.vue:241 | 无 | 否 | 待确认 |  |
| 445 | 先把今天最该推进的一条放到眼前，再去看清单、愿望瓶和最近的变化。 | 首页 | 正文 / 说明 | 在 首页 的 heroLead 区域展示。 | src/pages/HomeAtelier.vue:244 | 无 | 否 | 待确认 |  |
| 446 | 先写下一条愿望，让今天先有一件值得关心的事。 | 首页 | 正文 / 说明 | 在 首页 的 heroPrimaryWishCaption 区域展示。 | src/pages/HomeAtelier.vue:248 | 无 | 否 | 待确认 |  |
| 447 | 去清单继续推进 | 首页 | 正文 / 说明 | 在 首页 的 homePrimaryActionLabel 区域展示。 | src/pages/HomeAtelier.vue:261 | 无 | 否 | 待确认 |  |
| 448 | 写下第一条愿望 | 首页 | 正文 / 说明 | 在 首页 的 homePrimaryActionLabel 区域展示。 | src/pages/HomeAtelier.vue:261；src/pages/HomeAtelier.vue:276 | 无 | 否 | 待确认 |  |
| 449 | 打开这条愿望 | 首页 | 正文 / 说明 | 在 首页 的 heroPrimaryActionLabel 区域展示。 | src/pages/HomeAtelier.vue:276 | 无 | 否 | 待确认 |  |
| 450 | 已经过了约定的日子 {Math.abs} 天 | 首页 | 正文 / 说明 | 在 首页 的 dayDifference 区域展示。 | src/pages/HomeAtelier.vue:363 | Math.abs | 否 | 待确认 |  |
| 451 | 离希望完成的日子还有 {dayDifference} 天 | 首页 | 正文 / 说明 | 在 首页 的 dayDifference 区域展示。 | src/pages/HomeAtelier.vue:374 | dayDifference | 否 | 待确认 |  |
| 452 | 已经集齐七龙珠，现在有 {coinSnapshot.total} 枚愿望币。 | 首页 | 正文 / 说明 | 在 首页 的 coinSnapshot 区域展示。 | src/pages/HomeAtelier.vue:381 | coinSnapshot.total | 否 | 待确认 |  |
| 453 | 现在有 {coinSnapshot.total} 枚愿望币，还差 {coinSnapshot.remainingToDragonBall} 枚召唤神龙。 | 首页 | 正文 / 说明 | 在 首页 的 coinSnapshot 区域展示。 | src/pages/HomeAtelier.vue:385 | coinSnapshot.total；coinSnapshot.remainingToDragonBall | 否 | 待确认 |  |
| 454 | 还没有收到愿望币，距离召唤神龙还差 {DRAGON_BALL_COIN_TARGET} 枚。 | 首页 | 空态 / 缺省 | 在 首页 的 coinSnapshot 区域数据为空、不可用或尚未开始时出现。 | src/pages/HomeAtelier.vue:388 | DRAGON_BALL_COIN_TARGET | 否 | 待确认 |  |
| 455 | 留下了一条新的记录。 | 首页 | 正文 / 说明 | 在 首页 的 normalizedText 区域展示。 | src/pages/HomeAtelier.vue:458 | 无 | 否 | 待确认 |  |
| 456 | 在「{wishTitle}」这页，刚好又说到你们了 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:507 | wishTitle | 否 | 待确认 |  |
| 457 | 刚好又捎来了一句新的近况 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:507 | 无 | 否 | 待确认 |  |
| 458 | 「{wishTitle}」这页，终于能笑着合上了 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:511 | wishTitle | 否 | 待确认 |  |
| 459 | 刚刚有一条愿望，终于能笑着合上了 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:511 | 无 | 否 | 待确认 |  |
| 460 | 「{wishTitle}」这边，又悄悄往前拱了一点 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:515 | wishTitle | 否 | 待确认 |  |
| 461 | 刚刚又把手上的一件事往前拱了一点 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:515 | 无 | 否 | 待确认 |  |
| 462 | 「{wishTitle}」刚被认真写进以后 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:519 | wishTitle | 否 | 待确认 |  |
| 463 | 刚刚又把一个新的以后写下来了 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:519 | 无 | 否 | 待确认 |  |
| 464 | 「{wishTitle}」刚被轻轻推了一把 | 首页 | 标题 | 在 首页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/HomeAtelier.vue:523 | wishTitle | 否 | 待确认 |  |
| 465 | 刚刚又替一条愿望轻轻推了一把 | 首页 | 标题 | 在 首页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/HomeAtelier.vue:523 | 无 | 否 | 待确认 |  |
| 466 | 「{wishTitle}」已经被摆到最想先实现的位置 | 首页 | 标题 | 在 首页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/HomeAtelier.vue:527 | wishTitle | 否 | 待确认 |  |
| 467 | 刚刚有一条愿望，被摆到最想先实现的位置 | 首页 | 标题 | 在 首页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/HomeAtelier.vue:527 | 无 | 否 | 待确认 |  |
| 468 | 「{wishTarget}」推进后，刚领到「{rewardTitle}」 | 首页 | 标题 | 在 首页 的 wishTarget 区域展示。 | src/pages/HomeAtelier.vue:533 | wishTarget；rewardTitle | 否 | 待确认 |  |
| 469 | 「{wishTarget}」推进后，刚接住一份奖励 | 首页 | 标题 | 在 首页 的 wishTarget 区域展示。 | src/pages/HomeAtelier.vue:533 | wishTarget | 否 | 待确认 |  |
| 470 | 攒下来的星星币，刚刚换成了一份想要的东西 | 首页 | 正文 / 说明 | 在 首页 的 wishTarget 区域展示。 | src/pages/HomeAtelier.vue:537 | 无 | 否 | 待确认 |  |
| 471 | 这周新的愿望币，已经先送到手边了 | 首页 | 正文 / 说明 | 在 首页 的 wishTarget 区域展示。 | src/pages/HomeAtelier.vue:541 | 无 | 否 | 待确认 |  |
| 472 | 「{wishTitle}」这页，又多了一句可以告诉对方的话 | 首页 | 标题 | 在 首页 的 wishTarget 区域展示。 | src/pages/HomeAtelier.vue:545 | wishTitle | 否 | 待确认 |  |
| 473 | 刚刚又多了一句想让对方先看到的话 | 首页 | 正文 / 说明 | 在 首页 的 wishTarget 区域展示。 | src/pages/HomeAtelier.vue:548 | 无 | 否 | 待确认 |  |
| 474 | 这句近况在说：{messageSummary} | 首页 | 正文 / 说明 | 在 首页 的 stepTitle 区域展示。 | src/pages/HomeAtelier.vue:565 | messageSummary；message | 否 | 待确认 |  |
| 475 | 这次先推进了「{stepTitle}」，像是在跟对方报一声平安。 | 首页 | 标题 | 在 首页 的 stepTitle 区域展示。 | src/pages/HomeAtelier.vue:569 | stepTitle | 否 | 待确认 |  |
| 476 | 这次先往前拱了一点，也够让对方安心一下。 | 首页 | 标题 | 在 首页 的 stepTitle 区域展示。 | src/pages/HomeAtelier.vue:569 | 无 | 否 | 待确认 |  |
| 477 | 这一次是真的走到了页尾，可以回头一起笑着看了。 | 首页 | 正文 / 说明 | 在 首页 的 stepTitle 区域展示。 | src/pages/HomeAtelier.vue:573 | 无 | 否 | 待确认 |  |
| 478 | 新的愿望「{wishTitle}」已经住进清单里，也算先和对方打了个招呼。 | 首页 | 标题 | 在 首页 的 stepTitle 区域展示。 | src/pages/HomeAtelier.vue:577 | wishTitle | 否 | 待确认 |  |
| 479 | 一个新的愿望已经住进清单里，先被轻轻说出口了。 | 首页 | 标题 | 在 首页 的 stepTitle 区域展示。 | src/pages/HomeAtelier.vue:577 | 无 | 否 | 待确认 |  |
| 480 | 这一枚愿望币像一句“我记得这件事”，把它往前轻轻推了一下。 | 首页 | 正文 / 说明 | 在 首页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/HomeAtelier.vue:581 | 无 | 否 | 待确认 |  |
| 481 | 它已经被放到更靠前的位置，像在提醒彼此：先把这个实现掉。 | 首页 | 正文 / 说明 | 在 首页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/HomeAtelier.vue:585 | 无 | 否 | 待确认 |  |
| 482 | 因为这条愿望推进了 {quantity} 点，这次领到了「{rewardTitle}」共 {quantity} 份。 | 首页 | 标题 | 在 首页 的 quantity 区域展示。 | src/pages/HomeAtelier.vue:594 | quantity；rewardTitle | 否 | 待确认 |  |
| 483 | 因为这条愿望往前推进了一步，这次领到了「{rewardTitle}」。 | 首页 | 标题 | 在 首页 的 quantity 区域展示。 | src/pages/HomeAtelier.vue:595 | rewardTitle | 否 | 待确认 |  |
| 484 | 因为这条愿望推进了 {quantity} 点，这次接住了 {quantity} 份奖励。 | 首页 | 正文 / 说明 | 在 首页 的 quantity 区域展示。 | src/pages/HomeAtelier.vue:599 | quantity | 否 | 待确认 |  |
| 485 | 因为这条愿望往前推进了一步，这次接住了一份奖励。 | 首页 | 正文 / 说明 | 在 首页 的 quantity 区域展示。 | src/pages/HomeAtelier.vue:600 | 无 | 否 | 待确认 |  |
| 486 | 把慢慢攒下来的星星币，换成了一份想要的奖励，也算给最近的努力一个回应。 | 首页 | 正文 / 说明 | 在 首页 的 quantity 区域展示。 | src/pages/HomeAtelier.vue:604 | 无 | 否 | 待确认 |  |
| 487 | 这一周又多了新的愿望币，可以继续把偏爱投向更想靠近的方向。 | 首页 | 正文 / 说明 | 在 首页 的 quantity 区域展示。 | src/pages/HomeAtelier.vue:608 | 无 | 否 | 待确认 |  |
| 488 | 今天先做 Today First | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:671 | 无 | 否 | 待确认 |  |
| 489 | 今天先把最想推进的一条愿望 | 首页 | 正文 / 说明 | 在 首页 的 <span> 区域展示。 | src/pages/HomeAtelier.vue:675 | 无 | 否 | 待确认 |  |
| 490 | 摆到眼前。 | 首页 | 正文 / 说明 | 在 首页 的 <span> 区域展示。 | src/pages/HomeAtelier.vue:676 | 无 | 否 | 待确认 |  |
| 491 | 今天先推进 | 首页 | 标签 / 选项 | 在 首页 的 <span> 区域展示。 | src/pages/HomeAtelier.vue:689 | 无 | 否 | 待确认 |  |
| 492 | 先写下一条愿望 | 首页 | 标题 | 在 首页 的 <h2> 区域展示。 | src/pages/HomeAtelier.vue:693 | 无 | 否 | 待确认 |  |
| 493 | {heroPrimaryWish?.title ?? '先写下一条愿望'} | 首页 | 标题 | 在 首页 的 <h2> 区域展示。 | src/pages/HomeAtelier.vue:693 | title | 否 | 待确认 |  |
| 494 | 最近发生 Recent Journal | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:957 | 无 | 否 | 待确认 |  |
| 495 | 刚刚，你们又先跟彼此说了什么 | 首页 | 标题 | 在 首页 的 <h2> 区域展示。 | src/pages/HomeAtelier.vue:958 | 无 | 否 | 待确认 |  |
| 496 | 先看看这两句近况，再决定下一步往哪条愿望靠。 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:959 | 无 | 否 | 待确认 |  |
| 497 | 再补一句 | 首页 | 标签 / 选项 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:983 | 无 | 否 | 待确认 |  |
| 498 | 最近 14 天还没有新的近况 | 首页 | 空态 / 缺省 | 在 首页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/HomeAtelier.vue:991 | 无 | 否 | 待确认 |  |
| 499 | 等下一次推进发生，这里会先替你们把这句招呼留住。 | 首页 | 标题 | 在 首页 的 <h3> 区域展示。 | src/pages/HomeAtelier.vue:992 | 无 | 否 | 待确认 |  |
| 500 | 只要有一笔留言、投币或完成步骤，对方就会先从这里看到。 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:993 | 无 | 否 | 待确认 |  |
| 501 | 一起捎来 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:998 | 无 | 否 | 待确认 |  |
| 502 | 下一步往哪里靠 | 首页 | 标题 | 在 首页 的 <h2> 区域展示。 | src/pages/HomeAtelier.vue:1009 | 无 | 否 | 待确认 |  |
| 503 | 离约定最近 | 首页 | 标题 | 在 首页 的 <h3> 区域展示。 | src/pages/HomeAtelier.vue:1025 | 无 | 否 | 待确认 |  |
| 504 | 先把最靠近日期的几条挑出来。 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:1026 | 无 | 否 | 待确认 |  |
| 505 | 这里还没有靠近日期的愿望 | 首页 | 标题 | 在 首页 的 <h3> 区域展示。 | src/pages/HomeAtelier.vue:1043 | 无 | 否 | 待确认 |  |
| 506 | 等你给愿望设下日期，这里就会先放出来。 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:1044 | 无 | 否 | 待确认 |  |
| 507 | 愿望币先投向哪里 | 首页 | 标题 | 在 首页 的 <h3> 区域展示。 | src/pages/HomeAtelier.vue:1057 | 无 | 否 | 待确认 |  |
| 508 | 先看哪几条最值得把愿望币投进去。 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:1058 | 无 | 否 | 待确认 |  |
| 509 | 这里还没有被愿望币点亮的愿望 | 首页 | 标题 | 在 首页 的 <h3> 区域展示。 | src/pages/HomeAtelier.vue:1075 | 无 | 否 | 待确认 |  |
| 510 | 等第一枚愿望币落下后，这里就会亮起来。 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:1076 | 无 | 否 | 待确认 |  |
| 511 | 全部愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 visibilityLabels 区域展示。 | src/pages/List.vue:27 | 无 | 否 | 待确认 |  |
| 512 | 全部状态 | 清单页 | 标签 / 选项 | 在 清单页 的 statusLabels 区域展示。 | src/pages/List.vue:33 | 无 | 否 | 待确认 |  |
| 513 | 正在推进 | 清单页 | 状态 / 反馈 / 错误 | 在 清单页 的 statusLabels 触发成功、失败、加载或状态更新时出现。 | src/pages/List.vue:34 | 无 | 否 | 待确认 |  |
| 514 | 按时间 | 清单页 | 正文 / 说明 | 在 清单页 的 sortLabels 区域展示。 | src/pages/List.vue:39 | 无 | 否 | 待确认 |  |
| 515 | 按进度 | 清单页 | 正文 / 说明 | 在 清单页 的 sortLabels 区域展示。 | src/pages/List.vue:40 | 无 | 否 | 待确认 |  |
| 516 | 这里只看 {viewerName} 已经实现的私藏愿望。 | 清单页 | 正文 / 说明 | 在 清单页 的 archiveSummary 区域展示。 | src/pages/List.vue:50 | viewerName | 否 | 待确认 |  |
| 517 | 这里只看 {viewerName} 写下的私藏愿望。 | 清单页 | 正文 / 说明 | 在 清单页 的 archiveSummary 区域展示。 | src/pages/List.vue:54 | viewerName | 否 | 待确认 |  |
| 518 | 这里只看 {viewerName} 还在路上的私藏愿望。 | 清单页 | 正文 / 说明 | 在 清单页 的 archiveSummary 区域展示。 | src/pages/List.vue:57 | viewerName | 否 | 待确认 |  |
| 519 | 现在只看已经实现的愿望，共 {wishStore.stats.done} 条。 | 清单页 | 正文 / 说明 | 在 清单页 的 archiveSummary 区域展示。 | src/pages/List.vue:62 | wishStore.stats.done | 否 | 待确认 |  |
| 520 | 这里会收下已经实现的愿望。 | 清单页 | 正文 / 说明 | 在 清单页 的 archiveSummary 区域展示。 | src/pages/List.vue:63 | 无 | 否 | 待确认 |  |
| 521 | 现在把不同状态放在一起看，已完成 {wishStore.stats.done} 条。 | 清单页 | 标签 / 选项 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:68 | wishStore.stats.done | 否 | 待确认 |  |
| 522 | 现在会把不同状态一起显示。 | 清单页 | 标签 / 选项 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:69 | 无 | 否 | 待确认 |  |
| 523 | 已完成 {wishStore.stats.done} 条，继续收进回顾页。 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:73 | wishStore.stats.done | 否 | 待确认 |  |
| 524 | 这里只放还在推进的愿望。 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:74 | 无 | 否 | 待确认 |  |
| 525 | 正在搜「{query}」· 找到 {filteredWishes.length} 条。 | 清单页 | 状态 / 反馈 / 错误 | 在 清单页 的 query 触发成功、失败、加载或状态更新时出现。 | src/pages/List.vue:83 | query；filteredWishes.length | 否 | 待确认 |  |
| 526 | 和「{query}」有关的愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 query 区域展示。 | src/pages/List.vue:89 | query | 否 | 待确认 |  |
| 527 | 已经一起实现的愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 query 区域展示。 | src/pages/List.vue:94 | 无 | 否 | 待确认 |  |
| 528 | {viewerName} 已经实现的私藏愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 query 区域展示。 | src/pages/List.vue:98 | viewerName | 否 | 待确认 |  |
| 529 | 已经实现的愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 query 区域展示。 | src/pages/List.vue:101 | 无 | 否 | 待确认 |  |
| 530 | 一起写下的全部愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:106 | 无 | 否 | 待确认 |  |
| 531 | {viewerName} 只留给自己的愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:110 | viewerName | 否 | 待确认 |  |
| 532 | 这一阵子的全部愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:113 | 无 | 否 | 待确认 |  |
| 533 | 一起推进的愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:117 | 无 | 否 | 待确认 |  |
| 534 | {viewerName} 想自己慢慢靠近的事 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:121 | viewerName | 否 | 待确认 |  |
| 535 | 今天继续往前的愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:124 | 无 | 否 | 待确认 |  |
| 536 | 还没有分类 | 清单页 | 空态 / 缺省 | 在 清单页 的 getWishCaption 区域数据为空、不可用或尚未开始时出现。；另见 详情页。 | src/pages/List.vue:131；src/pages/WishDetailAtelier.vue:123 | 无 | 否 | 待确认 |  |
| 537 | 还没有写第一个步骤 | 清单页 | 空态 / 缺省 | 在 清单页 的 progress 区域数据为空、不可用或尚未开始时出现。 | src/pages/List.vue:142 | 无 | 否 | 待确认 |  |
| 538 | 先把愿望本身写清楚 | 清单页 | 正文 / 说明 | 在 清单页 的 progress 区域展示。 | src/pages/List.vue:145 | 无 | 否 | 待确认 |  |
| 539 | 已把 1 枚愿望币投给「{wish.title}」。 | 清单页 | 标题 | 在 清单页 的 isSuccess 区域展示。 | src/pages/List.vue:164 | wish.title；title | 否 | 待确认 |  |
| 540 | 这次没能把愿望币投给「{wish.title}」。 | 清单页 | 状态 / 反馈 / 错误 | 在 清单页 的 isSuccess 触发成功、失败、加载或状态更新时出现。 | src/pages/List.vue:165 | wish.title；title | 否 | 待确认 |  |
| 541 | 愿望清单 Wish Board | 清单页 | 正文 / 说明 | 在 清单页 的 <p> 区域展示。 | src/pages/List.vue:177 | 无 | 否 | 待确认 |  |
| 542 | 把正在路上的愿望，排成今天能继续推进的顺序。 | 清单页 | 状态 / 反馈 / 错误 | 在 清单页 的 <span> 触发成功、失败、加载或状态更新时出现。 | src/pages/List.vue:180 | 无 | 否 | 待确认 |  |
| 543 | 写下新愿望 | 清单页 | 按钮 / 链接 | 在 清单页 的 <RouterLink> 区域作为可点击操作出现。；另见 详情页。 | src/pages/List.vue:183；src/pages/List.vue:385；src/pages/WishDetailAtelier.vue:703 | 无 | 否 | 待确认 |  |
| 544 | 打开回顾页 | 清单页 | 按钮 / 链接 | 在 清单页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/List.vue:184 | 无 | 否 | 待确认 |  |
| 545 | 筛选工作台 Filters | 清单页 | 标签 / 选项 | 在 清单页 的 <p> 区域展示。 | src/pages/List.vue:191 | 无 | 否 | 待确认 |  |
| 546 | 先把眼前这批愿望理清楚 | 清单页 | 标题 | 在 清单页 的 <h2> 区域展示。 | src/pages/List.vue:192 | 无 | 否 | 待确认 |  |
| 547 | 先选范围和状态，再往下看。 | 清单页 | 标签 / 选项 | 在 清单页 的 <p> 区域展示。 | src/pages/List.vue:193 | 无 | 否 | 待确认 |  |
| 548 | 收起筛选 | 清单页 | 标签 / 选项 | 在 清单页 的 <button> 区域展示。 | src/pages/List.vue:197 | 无 | 否 | 待确认 |  |
| 549 | 展开筛选 | 清单页 | 标签 / 选项 | 在 清单页 的 <button> 区域展示。 | src/pages/List.vue:197 | 无 | 否 | 待确认 |  |
| 550 | 搜索愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 <span> 区域展示。 | src/pages/List.vue:201 | 无 | 否 | 待确认 |  |
| 551 | 搜索标题、分类或写下的原因 | 清单页 | 输入占位符 | 在 清单页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/List.vue:202 | 无 | 否 | 待确认 |  |
| 552 | 按范围看 | 清单页 | 标签 / 选项 | 在 清单页 的 <span> 区域展示。 | src/pages/List.vue:208 | 无 | 否 | 待确认 |  |
| 553 | 按状态看 | 清单页 | 标签 / 选项 | 在 清单页 的 <span> 区域展示。 | src/pages/List.vue:238 | 无 | 否 | 待确认 |  |
| 554 | 排序方式 | 清单页 | 标签 / 选项 | 在 清单页 的 <span> 区域展示。 | src/pages/List.vue:268 | 无 | 否 | 待确认 |  |
| 555 | 当前结果 | 清单页 | 标签 / 选项 | 在 清单页 的 <span> 区域展示。 | src/pages/List.vue:292 | 无 | 否 | 待确认 |  |
| 556 | {filteredWishes.length} 条 | 清单页 | 正文 / 说明 | 在 清单页 的 <strong> 区域展示。 | src/pages/List.vue:293 | 无 | 否 | 待确认 |  |
| 557 | 重置筛选 | 清单页 | 按钮 / 链接 | 在 清单页 的 <button> 区域作为可点击操作出现。 | src/pages/List.vue:297 | 无 | 否 | 待确认 |  |
| 558 | 去回顾页 | 清单页 | 按钮 / 链接 | 在 清单页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/List.vue:298 | 无 | 否 | 待确认 |  |
| 559 | 收起 | 清单页 | 按钮 / 链接 | 在 清单页 的 <button> 区域作为可点击操作出现。 | src/pages/List.vue:307 | 无 | 否 | 待确认 |  |
| 560 | 今天这批 Wish List | 清单页 | 正文 / 说明 | 在 清单页 的 <p> 区域展示。 | src/pages/List.vue:312 | 无 | 否 | 待确认 |  |
| 561 | {selectedStatusLabel} · {filteredWishes.length} 条 | 清单页 | 正文 / 说明 | 在 清单页 的 <span> 区域展示。 | src/pages/List.vue:318 | 无 | 否 | 待确认 |  |
| 562 | { 'has-image': !!getCoverImageUrl(wish) } | 清单页 | 正文 / 说明 | 在 清单页 的 <div> 区域展示。 | src/pages/List.vue:336 | 无 | 否 | 待确认 |  |
| 563 | 还没写下原因。 | 清单页 | 正文 / 说明 | 在 清单页 的 <p> 区域展示。 | src/pages/List.vue:339 | 无 | 否 | 待确认 |  |
| 564 | {wish.note \|\| '还没写下原因。'} | 清单页 | 正文 / 说明 | 在 清单页 的 <p> 区域展示。 | src/pages/List.vue:339 | note | 否 | 待确认 |  |
| 565 | getCoverImageUrl(wish) | 清单页 | 标题 | 在 清单页 的 <img> 区域展示。 | src/pages/List.vue:342；src/pages/List.vue:342 | 无 | 否 | 待确认 |  |
| 566 | `{wish.title} 首图` | 清单页 | 标题 | 在 清单页 的 <img> 区域展示。 | src/pages/List.vue:342 | wish.title；title | 否 | 待确认 |  |
| 567 | 打开详情页进度区域 | 清单页 | 可访问性 / aria | 在 清单页 的 <RouterLink> 区域供屏幕阅读器或辅助技术感知。 | src/pages/List.vue:346 | 无 | 是 | 待确认 |  |
| 568 | 当前进度 | 清单页 | 正文 / 说明 | 在 清单页 的 <span> 区域展示。 | src/pages/List.vue:347 | 无 | 否 | 待确认 |  |
| 569 | {getProgressCopy(wish)} | 清单页 | 正文 / 说明 | 在 清单页 的 <strong> 区域展示。 | src/pages/List.vue:348 | 无 | 否 | 待确认 |  |
| 570 | 还没补进度说明。 | 清单页 | 正文 / 说明 | 在 清单页 的 <p> 区域展示。 | src/pages/List.vue:349 | 无 | 否 | 待确认 |  |
| 571 | {getWishProgressHint(wish) \|\| '还没补进度说明。'} | 清单页 | 正文 / 说明 | 在 清单页 的 <p> 区域展示。 | src/pages/List.vue:349 | 无 | 否 | 待确认 |  |
| 572 | {getMemberName(wish.ownerId)} 写下于 {formatDateLabel(wish.createdAt)} | 清单页 | 正文 / 说明 | 在 清单页 的 <span> 区域展示。 | src/pages/List.vue:355 | 无 | 否 | 待确认 |  |
| 573 | 详情 | 清单页 | 按钮 / 链接 | 在 清单页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/List.vue:359 | 无 | 否 | 待确认 |  |
| 574 | 正在投币... | 清单页 | 状态 / 反馈 / 错误 | 在 清单页 的 <button> 触发成功、失败、加载或状态更新时出现。 | src/pages/List.vue:368 | 无 | 否 | 待确认 |  |
| 575 | 愿望已实现 | 清单页 | 正文 / 说明 | 在 清单页 的 <button> 区域展示。；另见 详情页。 | src/pages/List.vue:370；src/pages/WishDetailAtelier.vue:229 | 无 | 否 | 待确认 |  |
| 576 | 投 1 币 | 清单页 | 正文 / 说明 | 在 清单页 的 <button> 区域展示。；另见 详情页。 | src/pages/List.vue:372；src/pages/WishDetailAtelier.vue:229 | 无 | 否 | 待确认 |  |
| 577 | 本周已投完 | 清单页 | 正文 / 说明 | 在 清单页 的 <button> 区域展示。；另见 详情页。 | src/pages/List.vue:373；src/pages/WishDetailAtelier.vue:229 | 无 | 否 | 待确认 |  |
| 578 | 这次筛选后还没有结果 | 清单页 | 标题 | 在 清单页 的 <h3> 区域展示。 | src/pages/List.vue:381 | 无 | 否 | 待确认 |  |
| 579 | 可以先清空筛选，或者写下一条新愿望。 | 清单页 | 空态 / 缺省 | 在 清单页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/List.vue:382 | 无 | 否 | 待确认 |  |
| 580 | 清空筛选 | 清单页 | 按钮 / 链接 | 在 清单页 的 <button> 区域作为可点击操作出现。 | src/pages/List.vue:384 | 无 | 否 | 待确认 |  |
| 581 | ../composables/useSpacePageState | 空间页 | 正文 / 说明 | 在 空间页 的 <script> 区域展示。 | src/pages/Settings.vue:4 | 无 | 否 | 待确认 |  |
| 582 | 领奖 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardHubTabs 区域展示。 | src/pages/Settings.vue:15 | 无 | 否 | 待确认 |  |
| 583 | 待领 / 兑换 / 记录 | 空间页 | 正文 / 说明 | 在 空间页 的 rewardHubTabs 区域展示。 | src/pages/Settings.vue:16 | 无 | 否 | 待确认 |  |
| 584 | 编辑 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardHubTabs 区域展示。 | src/pages/Settings.vue:20 | 无 | 否 | 待确认 |  |
| 585 | 写入 / 整理 / 奖池 | 空间页 | 正文 / 说明 | 在 空间页 的 rewardHubTabs 区域展示。 | src/pages/Settings.vue:21 | 无 | 否 | 待确认 |  |
| 586 | 领奖与兑换 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubTitle 区域展示。 | src/pages/Settings.vue:27 | 无 | 否 | 待确认 |  |
| 587 | 编辑奖励池 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubTitle 区域展示。 | src/pages/Settings.vue:27 | 无 | 否 | 待确认 |  |
| 588 | 待领 {space.pendingSmallRewardUnits} 份，兑换和最近记录也都收在这里。 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubLead 区域展示。 | src/pages/Settings.vue:33 | space.pendingSmallRewardUnits | 否 | 待确认 |  |
| 589 | 待领、兑换和最近记录都收在这里。 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubLead 区域展示。 | src/pages/Settings.vue:36 | 无 | 否 | 待确认 |  |
| 590 | 写新奖励、改旧奖励、整理奖池，都在这里。 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubLead 区域展示。 | src/pages/Settings.vue:40 | 无 | 否 | 待确认 |  |
| 591 | 先写下一条会让自己开心的奖励。 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubLead 区域展示。 | src/pages/Settings.vue:43 | 无 | 否 | 待确认 |  |
| 592 | 待领 {space.pendingSmallRewardUnits} | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubPills 区域展示。 | src/pages/Settings.vue:49 | space.pendingSmallRewardUnits | 否 | 待确认 |  |
| 593 | 可换 {space.currentMemberPremiumExchangeRewards.length} | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubPills 区域展示。 | src/pages/Settings.vue:50 | space.currentMemberPremiumExchangeRewards.length | 否 | 待确认 |  |
| 594 | 记录 {space.recentRewardClaims.length} | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubPills 区域展示。 | src/pages/Settings.vue:51 | space.recentRewardClaims.length | 否 | 待确认 |  |
| 595 | 日常 {space.currentMemberDailyRewards.length} | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubPills 区域展示。 | src/pages/Settings.vue:56 | space.currentMemberDailyRewards.length | 否 | 待确认 |  |
| 596 | 高档 {space.currentMemberPremiumRewards.length} | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubPills 区域展示。 | src/pages/Settings.vue:57 | space.currentMemberPremiumRewards.length | 否 | 待确认 |  |
| 597 | 星币 {space.currentMemberStarCoins} | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubPills 区域展示。 | src/pages/Settings.vue:58 | space.currentMemberStarCoins | 否 | 待确认 |  |
| 598 | 共同空间 Space | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:89 | 无 | 否 | 待确认 |  |
| 599 | 把两个人的日常收在同一页 | 空间页 | 标题 | 在 空间页 的 <h1> 区域展示。 | src/pages/Settings.vue:90 | 无 | 否 | 待确认 |  |
| 600 | 成员、邀请、奖励和照片，都从这里往后翻。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:91 | 无 | 否 | 待确认 |  |
| 601 | 空间摘要 | 空间页 | 可访问性 / aria | 在 空间页 的 <aside> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:94 | 无 | 是 | 待确认 |  |
| 602 | {space.currentRoleLabel} · 本周 {space.wishStore.currentMemberRemainingCoins} 枚愿望币 · 奖励 {space.currentMemberRewardCount} 条 · 星币 {space.currentMemberStarCoins} 枚 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:101 | 无 | 否 | 待确认 |  |
| 603 | 奖励中心 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:111 | 无 | 否 | 待确认 |  |
| 604 | 奖励中心切换 | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:121 | 无 | 是 | 待确认 |  |
| 605 | 待领奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:143 | 无 | 否 | 待确认 |  |
| 606 | 先接住这些小奖励 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:144 | 无 | 否 | 待确认 |  |
| 607 | 步骤和数字进度累下来的小奖励，都会先收在这里。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:145 | 无 | 否 | 待确认 |  |
| 608 | 待领 {space.pendingSmallRewardUnits} 份 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:150 | 无 | 否 | 待确认 |  |
| 609 | 步骤 {space.pendingStepRewards.length} 条 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:151 | 无 | 否 | 待确认 |  |
| 610 | 数字 {space.pendingCountRewardUnits} 点 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:152 | 无 | 否 | 待确认 |  |
| 611 | 展开 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:156；src/pages/Settings.vue:180；src/pages/Settings.vue:254；src/pages/Settings.vue:351；src/pages/Settings.vue:413；src/pages/Settings.vue:579；src/pages/Settings.vue:625；src/pages/Settings.vue:714；src/pages/Settings.vue:767；src/pages/Settings.vue:899；src/pages/Settings.vue:958 | 无 | 否 | 待确认 |  |
| 612 | 收起 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:157；src/pages/Settings.vue:181；src/pages/Settings.vue:255；src/pages/Settings.vue:352；src/pages/Settings.vue:414；src/pages/Settings.vue:579；src/pages/Settings.vue:625；src/pages/Settings.vue:715；src/pages/Settings.vue:768；src/pages/Settings.vue:900；src/pages/Settings.vue:959 | 无 | 否 | 待确认 |  |
| 613 | 步骤奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:169 | 无 | 否 | 待确认 |  |
| 614 | 完成了，还没领的步骤 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:170 | 无 | 否 | 待确认 |  |
| 615 | 完成的小步骤会先排在这里，想领奖励或先存星星币，都从这里开始。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:171 | 无 | 否 | 待确认 |  |
| 616 | {space.pendingStepRewards.length} 条 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:176 | 无 | 否 | 待确认 |  |
| 617 | 来自「{item.wishTitle}」 | 空间页 | 标题 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:192；src/pages/Settings.vue:266 | wishTitle | 否 | 待确认 |  |
| 618 | 这一步已经完成，小奖励现在先在空间页等你慢慢接住。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:194 | 无 | 否 | 待确认 |  |
| 619 | 回详情看这一步 | 空间页 | 按钮 / 链接 | 在 空间页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Settings.vue:199 | 无 | 否 | 待确认 |  |
| 620 | 领哪条日常奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:204 | 无 | 否 | 待确认 |  |
| 621 | 还没准备日常奖励，也可以先把这一笔存成星星币。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:209 | 无 | 否 | 待确认 |  |
| 622 | 领取中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:218；src/pages/Settings.vue:292；src/pages/Settings.vue:301 | 无 | 否 | 待确认 |  |
| 623 | 领日常奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:218 | 无 | 否 | 待确认 |  |
| 624 | 存币中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:226；src/pages/Settings.vue:309；src/pages/Settings.vue:318 | 无 | 否 | 待确认 |  |
| 625 | 存成星星币 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:226 | 无 | 否 | 待确认 |  |
| 626 | 现在没有待领取的步骤奖励 | 空间页 | 空态 / 缺省 | 在 空间页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:234 | 无 | 否 | 待确认 |  |
| 627 | 下一次把小步骤走完，它就会先落到这里。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:235 | 无 | 否 | 待确认 |  |
| 628 | 积下来的进度也在这里 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:244 | 无 | 否 | 待确认 |  |
| 629 | 数字推进累下来的小奖励，可以按 1 点或整批处理。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:245 | 无 | 否 | 待确认 |  |
| 630 | {space.pendingCountRewardUnits} 点 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:250 | 无 | 否 | 待确认 |  |
| 631 | 还有 {space.getPendingCountUnitLabel(item.pendingUnits, item.progressUnit)} 小奖励没去领 | 空间页 | 正文 / 说明 | 在 空间页 的 <strong> 区域展示。 | src/pages/Settings.vue:267 | 无 | 否 | 待确认 |  |
| 632 | 当前已经到 {item.progressCurrent} / {item.progressTarget}{item.progressUnit ? ` {item.progressUnit}` : ''}，可以一次领 1 点，也可以整批接住。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:268 | item.progressUnit | 否 | 待确认 |  |
| 633 | 这页最近更新于 {space.formatBeijingDateTime(item.updatedAt)} | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:272 | 无 | 否 | 待确认 |  |
| 634 | 回详情看进度 | 空间页 | 按钮 / 链接 | 在 空间页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Settings.vue:273 | 无 | 否 | 待确认 |  |
| 635 | 整批领日常奖励时，先选这一条 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:278 | 无 | 否 | 待确认 |  |
| 636 | 还没准备日常奖励时，也可以先按 1 点或整批存成星星币。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:283 | 无 | 否 | 待确认 |  |
| 637 | 领 1 点日常奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:292 | 无 | 否 | 待确认 |  |
| 638 | 整批领日常奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:301 | 无 | 否 | 待确认 |  |
| 639 | 存 1 点星星币 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:309 | 无 | 否 | 待确认 |  |
| 640 | 整批存成星星币 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:318 | 无 | 否 | 待确认 |  |
| 641 | 现在没有待领取的数字进度奖励 | 空间页 | 空态 / 缺省 | 在 空间页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:326 | 无 | 否 | 待确认 |  |
| 642 | 下次把数字往前推一点，这里就会先替你记住。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:327 | 无 | 否 | 待确认 |  |
| 643 | 把星星币换成奖励 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:339 | 无 | 否 | 待确认 |  |
| 644 | 这里只放写了星星币价格的高档奖励。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:340 | 无 | 否 | 待确认 |  |
| 645 | 可换 {space.currentMemberPremiumExchangeRewards.length} 条 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:345 | 无 | 否 | 待确认 |  |
| 646 | 手里 {space.currentMemberStarCoins} 星币 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:346 | 无 | 否 | 待确认 |  |
| 647 | 现在可换 {space.premiumRedeemableNowCount} 条 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:347 | 无 | 否 | 待确认 |  |
| 648 | 高档奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。；另见 详情页。 | src/pages/Settings.vue:364；src/pages/Settings.vue:611；src/pages/WishDetailAtelier.vue:740 | 无 | 否 | 待确认 |  |
| 649 | {item.starCoinCost} 星币 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:367 | 无 | 否 | 待确认 |  |
| 650 | 这条高档奖励还没有补充说明。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:369；src/pages/Settings.vue:613 | 无 | 否 | 待确认 |  |
| 651 | {item.note \|\| '这条高档奖励还没有补充说明。'} | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:369；src/pages/Settings.vue:613 | note | 否 | 待确认 |  |
| 652 | 兑换价 {item.starCoinCost} 星星币 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:371 | 无 | 否 | 待确认 |  |
| 653 | 已领 {space.wishStore.getRewardItemClaimCount(item)} 份 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:372；src/pages/Settings.vue:572；src/pages/Settings.vue:617 | 无 | 否 | 待确认 |  |
| 654 | 兑换中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:382 | 无 | 否 | 待确认 |  |
| 655 | 兑换这份奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:384 | 无 | 否 | 待确认 |  |
| 656 | 还差 {item.starCoinCost - space.currentMemberStarCoins} 枚 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:385 | item.starCoinCost - space.currentMemberStarCoins | 否 | 待确认 |  |
| 657 | 切到编辑 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:387 | 无 | 否 | 待确认 |  |
| 658 | 现在没有可兑换的高档奖励 | 空间页 | 空态 / 缺省 | 在 空间页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:393 | 无 | 否 | 待确认 |  |
| 659 | 切到编辑给高档奖励写上星星币价格，它们就会出现在这里。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:394 | 无 | 否 | 待确认 |  |
| 660 | 最近记录 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:402 | 无 | 否 | 待确认 |  |
| 661 | 最近的领取和兑换 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:403 | 无 | 否 | 待确认 |  |
| 662 | 最近发生过的奖励动作，都会从这里往下记。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:404 | 无 | 否 | 待确认 |  |
| 663 | 最近 {space.recentRewardClaims.length} 笔 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:409 | 无 | 否 | 待确认 |  |
| 664 | 这一笔领了 {item.claim.quantity} 份 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:435 | item.claim.quantity | 否 | 待确认 |  |
| 665 | 这一笔已记下 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:435 | 无 | 否 | 待确认 |  |
| 666 | {item.claim.quantity > 1 ? `这一笔领了 {item.claim.quantity} 份` : '这一笔已记下'} | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:435 | item.claim.quantity | 否 | 待确认 |  |
| 667 | 还没有领取记录 | 空间页 | 空态 / 缺省 | 在 空间页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:443 | 无 | 否 | 待确认 |  |
| 668 | 第一次领取或兑换后会显示在这里。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:444 | 无 | 否 | 待确认 |  |
| 669 | 编辑区 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:454 | 无 | 否 | 待确认 |  |
| 670 | 写下和整理奖励 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:455 | 无 | 否 | 待确认 |  |
| 671 | 领奖和兑换切到“领奖”，这里专心写、改和整理。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:456 | 无 | 否 | 待确认 |  |
| 672 | 这里只写和整理 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:458 | 无 | 否 | 待确认 |  |
| 673 | 日常这一层 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:465 | 无 | 否 | 待确认 |  |
| 674 | 日常奖励 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:466 | 无 | 否 | 待确认 |  |
| 675 | 给小步骤 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:468 | 无 | 否 | 待确认 |  |
| 676 | 写一个适合小推进的轻奖励。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:472 | 无 | 否 | 待确认 |  |
| 677 | 奖励名称 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:477；src/pages/Settings.vue:515 | 无 | 否 | 待确认 |  |
| 678 | 例如：一杯喜欢的奶茶 / 一顿轻松晚餐 | 空间页 | 输入占位符 | 在 空间页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/Settings.vue:478 | 无 | 否 | 待确认 |  |
| 679 | 说明（可选） | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:481；src/pages/Settings.vue:519 | 无 | 否 | 待确认 |  |
| 680 | 写下这个小奖励为什么值得期待 | 空间页 | 输入占位符 | 在 空间页 的 <textarea> 表单输入框为空时作为占位提示出现。 | src/pages/Settings.vue:482 | 无 | 否 | 待确认 |  |
| 681 | 正在修改日常奖励。 | 空间页 | 按钮 / 链接 | 在 空间页 的 <p> 区域作为可点击操作出现。 | src/pages/Settings.vue:487 | 无 | 否 | 待确认 |  |
| 682 | 保存后会进入日常奖池。 | 空间页 | 按钮 / 链接 | 在 空间页 的 <p> 区域作为可点击操作出现。 | src/pages/Settings.vue:487 | 无 | 否 | 待确认 |  |
| 683 | {space.editingDailyRewardId ? '正在修改日常奖励。' : '保存后会进入日常奖池。'} | 空间页 | 按钮 / 链接 | 在 空间页 的 <p> 区域作为可点击操作出现。 | src/pages/Settings.vue:487 | 无 | 否 | 待确认 |  |
| 684 | 保存中... | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:491；src/pages/Settings.vue:533 | 无 | 否 | 待确认 |  |
| 685 | 更新日常奖励 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:491 | 无 | 否 | 待确认 |  |
| 686 | 加入日常奖励 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:491 | 无 | 否 | 待确认 |  |
| 687 | 取消编辑 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:493；src/pages/Settings.vue:535 | 无 | 否 | 待确认 |  |
| 688 | 留给大日子 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:503 | 无 | 否 | 待确认 |  |
| 689 | 高档奖励 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:504 | 无 | 否 | 待确认 |  |
| 690 | 给大日子 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:506 | 无 | 否 | 待确认 |  |
| 691 | 留给大事，也可以写上星星币价格慢慢换。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:510 | 无 | 否 | 待确认 |  |
| 692 | 例如：心仪很久的大件 / 一次认真放松的体验 | 空间页 | 输入占位符 | 在 空间页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/Settings.vue:516 | 无 | 否 | 待确认 |  |
| 693 | 写下这个高档奖励真正吸引你的地方 | 空间页 | 输入占位符 | 在 空间页 的 <textarea> 表单输入框为空时作为占位提示出现。 | src/pages/Settings.vue:520 | 无 | 否 | 待确认 |  |
| 694 | 星星币兑换价 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:523 | 无 | 否 | 待确认 |  |
| 695 | 正在修改高档奖励。 | 空间页 | 按钮 / 链接 | 在 空间页 的 <p> 区域作为可点击操作出现。 | src/pages/Settings.vue:529 | 无 | 否 | 待确认 |  |
| 696 | 保存后会进入高档奖池。 | 空间页 | 按钮 / 链接 | 在 空间页 的 <p> 区域作为可点击操作出现。 | src/pages/Settings.vue:529 | 无 | 否 | 待确认 |  |
| 697 | {space.editingPremiumRewardId ? '正在修改高档奖励。' : '保存后会进入高档奖池。'} | 空间页 | 按钮 / 链接 | 在 空间页 的 <p> 区域作为可点击操作出现。 | src/pages/Settings.vue:529 | 无 | 否 | 待确认 |  |
| 698 | 更新高档奖励 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:533 | 无 | 否 | 待确认 |  |
| 699 | 加入高档奖励 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:533 | 无 | 否 | 待确认 |  |
| 700 | 我的奖池 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:547 | 无 | 否 | 待确认 |  |
| 701 | 已经写好的奖励 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:548 | 无 | 否 | 待确认 |  |
| 702 | 这里只做整理 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:550 | 无 | 否 | 待确认 |  |
| 703 | 日常这一格 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:557 | 无 | 否 | 待确认 |  |
| 704 | 随手就能领的小奖励 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:558 | 无 | 否 | 待确认 |  |
| 705 | {space.currentMemberDailyRewards.length} 条 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:560 | 无 | 否 | 待确认 |  |
| 706 | 日常奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:566 | 无 | 否 | 待确认 |  |
| 707 | 这条日常奖励还没有补充说明。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:568 | 无 | 否 | 待确认 |  |
| 708 | {item.note \|\| '这条日常奖励还没有补充说明。'} | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:568 | note | 否 | 待确认 |  |
| 709 | 小推进可领 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:573 | 无 | 否 | 待确认 |  |
| 710 | 编辑 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:577；src/pages/Settings.vue:623 | 无 | 否 | 待确认 |  |
| 711 | 处理中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:587；src/pages/Settings.vue:633 | 无 | 否 | 待确认 |  |
| 712 | 归档 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:587；src/pages/Settings.vue:633 | 无 | 否 | 待确认 |  |
| 713 | 还没有日常奖励 | 空间页 | 空态 / 缺省 | 在 空间页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:594 | 无 | 否 | 待确认 |  |
| 714 | 先准备几条会让你开心的小奖励。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:595 | 无 | 否 | 待确认 |  |
| 715 | 大日子这一格 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:602 | 无 | 否 | 待确认 |  |
| 716 | 留给大日子的奖励 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:603 | 无 | 否 | 待确认 |  |
| 717 | {space.currentMemberPremiumRewards.length} 条 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:605 | 无 | 否 | 待确认 |  |
| 718 | 0">{item.starCoinCost} 星星币兑换 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:618 | 无 | 否 | 待确认 |  |
| 719 | 详情页领取 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:619 | 无 | 否 | 待确认 |  |
| 720 | 还没有高档奖励 | 空间页 | 空态 / 缺省 | 在 空间页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:640 | 无 | 否 | 待确认 |  |
| 721 | 先留给大日子一两条真正想认真奖励自己的事。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:641 | 无 | 否 | 待确认 |  |
| 722 | 一起的奖池 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:650 | 无 | 否 | 待确认 |  |
| 723 | 两个人的奖励 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:651 | 无 | 否 | 待确认 |  |
| 724 | 这里只看奖池本身，领取记录切到“领奖”。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:652 | 无 | 否 | 待确认 |  |
| 725 | 共 {space.totalRewardCount} 条 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:656 | 无 | 否 | 待确认 |  |
| 726 | 双方可见 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:657 | 无 | 否 | 待确认 |  |
| 727 | {item.starCoins} 枚星星币 · {item.dailyRewards.length + item.premiumRewards.length} 条奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:667 | 无 | 否 | 待确认 |  |
| 728 | 成员奖励摘要 | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:671 | 无 | 是 | 待确认 |  |
| 729 | {item.dailyRewards.length} 日常 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:672 | 无 | 否 | 待确认 |  |
| 730 | {item.premiumRewards.length} 高档 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:673 | 无 | 否 | 待确认 |  |
| 731 | {item.starCoins} 星币 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:674 | 无 | 否 | 待确认 |  |
| 732 | 日常：{formatRewardTitlePreview(item.dailyRewards)}{item.dailyRewards.length > 2 ? ' 等' : ''} | 空间页 | 标题 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:678 | 无 | 否 | 待确认 |  |
| 733 | 日常：还没准备 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:679 | 无 | 否 | 待确认 |  |
| 734 | 高档：{formatRewardTitlePreview(item.premiumRewards)}{item.premiumRewards.length > 2 ? ' 等' : ''} | 空间页 | 标题 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:680 | 无 | 否 | 待确认 |  |
| 735 | 高档：还没准备 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:681 | 无 | 否 | 待确认 |  |
| 736 | 后页工具 Space Tools | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:692 | 无 | 否 | 待确认 |  |
| 737 | 需要时再往后翻 | 空间页 | 标题 | 在 空间页 的 <h2> 区域展示。 | src/pages/Settings.vue:693 | 无 | 否 | 待确认 |  |
| 738 | 空间概览 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:702 | 无 | 否 | 待确认 |  |
| 739 | 把底账收在一起 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:703 | 无 | 否 | 待确认 |  |
| 740 | {space.authStore.members.length} 位成员 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:710 | 无 | 否 | 待确认 |  |
| 741 | 进入与邀请 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:756 | 无 | 否 | 待确认 |  |
| 742 | 进入与邀请 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:757 | 无 | 否 | 待确认 |  |
| 743 | 把对方带进来 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:780 | 无 | 否 | 待确认 |  |
| 744 | 邀请对方 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:781 | 无 | 否 | 待确认 |  |
| 745 | 邀请口令 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:789 | 无 | 否 | 待确认 |  |
| 746 | space.joinSpace | 空间页 | 按钮 / 链接 | 在 空间页 的 <form> 区域作为可点击操作出现。 | src/pages/Settings.vue:793 | 无 | 否 | 待确认 |  |
| 747 | 对方发来的邀请口令 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:795 | 无 | 否 | 待确认 |  |
| 748 | 确认后会尝试走进同一间空间，不会盖掉你已经写下的愿望。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:798 | 无 | 否 | 待确认 |  |
| 749 | space.isJoiningSpace | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:800 | 无 | 否 | 待确认 |  |
| 750 | 确认中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:801 | 无 | 否 | 待确认 |  |
| 751 | 确认加入 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:801 | 无 | 否 | 待确认 |  |
| 752 | 复制邀请口令 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:803 | 无 | 否 | 待确认 |  |
| 753 | 邮箱走进来 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:811 | 无 | 否 | 待确认 |  |
| 754 | 邮箱进入 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:812 | 无 | 否 | 待确认 |  |
| 755 | 未进入 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:814 | 无 | 否 | 待确认 |  |
| 756 | {space.authStore.isAuthenticated ? '已进入' : '未进入'} | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:814 | 无 | 否 | 待确认 |  |
| 757 | 如果已经把邮箱和这间空间连上，之后回来就不用每次都靠邀请码。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:817 | 无 | 否 | 待确认 |  |
| 758 | 邮箱 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:821；src/pages/Settings.vue:861 | 无 | 否 | 待确认 |  |
| 759 | 先发验证邮件，再用邮件里的链接或验证码走回来。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:824 | 无 | 否 | 待确认 |  |
| 760 | 发送中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:827 | 无 | 否 | 待确认 |  |
| 761 | 发送验证邮件 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:827 | 无 | 否 | 待确认 |  |
| 762 | 邮箱验证码 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:834 | 无 | 否 | 待确认 |  |
| 763 | 输入邮件里的验证码 | 空间页 | 输入占位符 | 在 空间页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/Settings.vue:835 | 无 | 否 | 待确认 |  |
| 764 | 当前会按 {space.otpTargetEmail} 校验；如果刚换了邮箱，请先重新发送一次。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:837 | 无 | 否 | 待确认 |  |
| 765 | 校验中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:840 | 无 | 否 | 待确认 |  |
| 766 | 确认进入 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:840 | 无 | 否 | 待确认 |  |
| 767 | 记住这个入口 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:851 | 无 | 否 | 待确认 |  |
| 768 | 记住常用邮箱 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:852 | 无 | 否 | 待确认 |  |
| 769 | 仅创建者可用 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:854 | 无 | 否 | 待确认 |  |
| 770 | 把常用邮箱记在这间空间上，后面回来会更快。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:857 | 无 | 否 | 待确认 |  |
| 771 | 显示名称（可选） | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:865 | 无 | 否 | 待确认 |  |
| 772 | 例如：晨光 / 星野 | 空间页 | 输入占位符 | 在 空间页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/Settings.vue:866 | 无 | 否 | 待确认 |  |
| 773 | 这里只是把邮箱和显示名称记在这间空间上，不会替你发送邮件。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:868 | 无 | 否 | 待确认 |  |
| 774 | 保存中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。；另见 详情页。 | src/pages/Settings.vue:871；src/pages/WishDetailAtelier.vue:510；src/pages/WishDetailAtelier.vue:674 | 无 | 否 | 待确认 |  |
| 775 | 记住这个邮箱 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:871 | 无 | 否 | 待确认 |  |
| 776 | 绑定后可直接回到这个空间。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:876 | 无 | 否 | 待确认 |  |
| 777 | 照片与备份 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:887 | 无 | 否 | 待确认 |  |
| 778 | 照片空间与备份 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:888 | 无 | 否 | 待确认 |  |
| 779 | 已用 {space.storageSummary.usagePercent}% | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:894 | 无 | 否 | 待确认 |  |
| 780 | 云端空间 | 空间页 | 空态 / 缺省 | 在 空间页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:895 | 无 | 否 | 待确认 |  |
| 781 | 本地体验空间 | 空间页 | 空态 / 缺省 | 在 空间页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:895 | 无 | 否 | 待确认 |  |
| 782 | {space.authStore.usesSupabaseSpace ? '云端空间' : '本地体验空间'} | 空间页 | 空态 / 缺省 | 在 空间页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:895 | 无 | 否 | 待确认 |  |
| 783 | `照片空间已使用 {space.storageSummary.usagePercent}%` | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:918 | space.storageSummary.usagePercent | 是 | 待确认 |  |
| 784 | 再多传几张后，这里会显示还能放多少。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:928 | 无 | 否 | 待确认 |  |
| 785 | 按现在的大小，大约还能放 {space.estimatedRemainingImageCount} 张。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:929 | space.estimatedRemainingImageCount | 否 | 待确认 |  |
| 786 | 备份会带上当前清单、奖励和记录 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:932 | 无 | 否 | 待确认 |  |
| 787 | 最好两个人都各自留一份 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:933 | 无 | 否 | 待确认 |  |
| 788 | 备份清单 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:936 | 无 | 否 | 待确认 |  |
| 789 | 同步与退出 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:947 | 无 | 否 | 待确认 |  |
| 790 | 同步与退出 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:948 | 无 | 否 | 待确认 |  |
| 791 | 只在排查时翻 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:971 | 无 | 否 | 待确认 |  |
| 792 | 排查时再看 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:972 | 无 | 否 | 待确认 |  |
| 793 | 这些信息主要用于排查同步问题，平时不用反复确认。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:977 | 无 | 否 | 待确认 |  |
| 794 | 离开这台设备 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:990 | 无 | 否 | 待确认 |  |
| 795 | 退出登录 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:991 | 无 | 否 | 待确认 |  |
| 796 | 这里只会退出当前设备上的登录状态，不会删掉这间空间或已经写下的内容。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:995 | 无 | 否 | 待确认 |  |
| 797 | 当前还没有登录中的邮箱会话。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:1001 | 无 | 否 | 待确认 |  |
| 798 | 回顾页 Review | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:44 | 无 | 否 | 待确认 |  |
| 799 | {currentMonthLabel} 正在写这一期 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <span> 区域作为可点击操作出现。 | src/pages/Stats.vue:53 | 无 | 否 | 待确认 |  |
| 800 | 去空间整理奖励 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Stats.vue:55 | 无 | 否 | 待确认 |  |
| 801 | 回清单继续推进 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。；另见 详情页。 | src/pages/Stats.vue:56；src/pages/Stats.vue:349；src/pages/WishDetailAtelier.vue:184 | 无 | 否 | 待确认 |  |
| 802 | 本月小注 Monthly Note | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:78 | 无 | 否 | 待确认 |  |
| 803 | 这一期刚刚写到这里 | 回顾页 | 标题 | 在 回顾页 的 <h3> 区域展示。 | src/pages/Stats.vue:79 | 无 | 否 | 待确认 |  |
| 804 | 翻阅目录 Reading Shelf | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:90 | 无 | 否 | 待确认 |  |
| 805 | 这次想先翻哪一册 | 回顾页 | 标题 | 在 回顾页 的 <h3> 区域展示。 | src/pages/Stats.vue:91 | 无 | 否 | 待确认 |  |
| 806 | 三种视角读的是同一段日子，只是分别看完成、本月和封存。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:92 | 无 | 否 | 待确认 |  |
| 807 | 完成手账 Journals | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:136 | 无 | 否 | 待确认 |  |
| 808 | 已经走完整条路的这些册页 | 回顾页 | 标题 | 在 回顾页 的 <h2> 区域展示。 | src/pages/Stats.vue:137 | 无 | 否 | 待确认 |  |
| 809 | 这些愿望已经完成，更适合回头翻过程。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:138 | 无 | 否 | 待确认 |  |
| 810 | 完成手账 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:146 | 无 | 否 | 待确认 |  |
| 811 | 实现于 {formatDateLabel(wish.completedAt ?? wish.updatedAt)} | 回顾页 | 正文 / 说明 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:147 | 无 | 否 | 待确认 |  |
| 812 | 这条愿望已经完成，适合回头翻过程。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:157 | 无 | 否 | 待确认 |  |
| 813 | 最近摘录 | 回顾页 | 标签 / 选项 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:161 | 无 | 否 | 待确认 |  |
| 814 | 最近翻到的三笔 | 回顾页 | 标签 / 选项 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:167 | 无 | 否 | 待确认 |  |
| 815 | 先从最后几句开始读，会更快想起来。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:168 | 无 | 否 | 待确认 |  |
| 816 | 打开完整手账 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Stats.vue:183 | 无 | 否 | 待确认 |  |
| 817 | 完成手账还在等第一册 | 回顾页 | 空态 / 缺省 | 在 回顾页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Stats.vue:189 | 无 | 否 | 待确认 |  |
| 818 | 还没有愿望被正式收进这册手账 | 回顾页 | 标题 | 在 回顾页 的 <h3> 区域展示。 | src/pages/Stats.vue:190 | 无 | 否 | 待确认 |  |
| 819 | 等第一条愿望完成后，它就会留在这里。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:191 | 无 | 否 | 待确认 |  |
| 820 | 先从清单里挑一条 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <strong> 区域展示。 | src/pages/Stats.vue:194 | 无 | 否 | 待确认 |  |
| 821 | 挑一条最想先看见结果的愿望。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:195 | 无 | 否 | 待确认 |  |
| 822 | 推进、留言、投币 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <strong> 区域展示。 | src/pages/Stats.vue:198 | 无 | 否 | 待确认 |  |
| 823 | 这些过程会先被详情页收住，完成后再翻到这里。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:199 | 无 | 否 | 待确认 |  |
| 824 | 先去清单看看 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Stats.vue:203；src/pages/Stats.vue:258 | 无 | 否 | 待确认 |  |
| 825 | 写下一条新愿望 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Stats.vue:204 | 无 | 否 | 待确认 |  |
| 826 | 本月页 Live | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:212 | 无 | 否 | 待确认 |  |
| 827 | {currentMonthLabel} 还在继续写 | 回顾页 | 标题 | 在 回顾页 的 <h2> 区域展示。 | src/pages/Stats.vue:213 | 无 | 否 | 待确认 |  |
| 828 | 这里先保留这个月还在发生的记录。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:214 | 无 | 否 | 待确认 |  |
| 829 | 这笔记录已经收进本月实时回顾。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:230 | 无 | 否 | 待确认 |  |
| 830 | 去这条愿望 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Stats.vue:238 | 无 | 否 | 待确认 |  |
| 831 | 本月页还很安静 | 回顾页 | 空态 / 缺省 | 在 回顾页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Stats.vue:244 | 无 | 否 | 待确认 |  |
| 832 | 这一期还没有新的实时记录 | 回顾页 | 标题 | 在 回顾页 的 <h3> 区域展示。 | src/pages/Stats.vue:245 | 无 | 否 | 待确认 |  |
| 833 | 评论、投币、完成步骤和领奖都会先落在这里，月后再封存。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:246 | 无 | 否 | 待确认 |  |
| 834 | 先让这一期开始动起来 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <strong> 区域展示。 | src/pages/Stats.vue:249 | 无 | 否 | 待确认 |  |
| 835 | 只要有一条愿望被留言、推进或投币，这里就会开始有内容。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:250 | 无 | 否 | 待确认 |  |
| 836 | 月底会自动封存 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <strong> 区域展示。 | src/pages/Stats.vue:253 | 无 | 否 | 待确认 |  |
| 837 | 现在发生的是实时版本，过了这个月才会成册。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:254 | 无 | 否 | 待确认 |  |
| 838 | 先写下一条愿望 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Stats.vue:259 | 无 | 否 | 待确认 |  |
| 839 | 冻结月刊 Snapshot | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:267 | 无 | 否 | 待确认 |  |
| 840 | 已经封存下来的固定月刊 | 回顾页 | 标题 | 在 回顾页 的 <h2> 区域展示。 | src/pages/Stats.vue:268 | 无 | 否 | 待确认 |  |
| 841 | 这些页面不会再变化，适合回头慢慢翻看。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:269 | 无 | 否 | 待确认 |  |
| 842 | 固定月刊 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:277 | 无 | 否 | 待确认 |  |
| 843 | {formatDateLabel(snapshot.createdAt)} 冻结 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:278 | 无 | 否 | 待确认 |  |
| 844 | 收进本册的记录 | 回顾页 | 标签 / 选项 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:289 | 无 | 否 | 待确认 |  |
| 845 | 卷期 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:303 | 无 | 否 | 待确认 |  |
| 846 | 封面前三段 | 回顾页 | 标签 / 选项 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:310 | 无 | 否 | 待确认 |  |
| 847 | 先看这册最前面的几段，再决定要不要回头翻完整过程。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:311 | 无 | 否 | 待确认 |  |
| 848 | 固定月刊还没有第一册 | 回顾页 | 空态 / 缺省 | 在 回顾页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Stats.vue:334 | 无 | 否 | 待确认 |  |
| 849 | 还没有封存好的月刊 | 回顾页 | 标题 | 在 回顾页 的 <h3> 区域展示。 | src/pages/Stats.vue:335 | 无 | 否 | 待确认 |  |
| 850 | 月份切换时，系统会把已经过去的月份自动冻结成固定版本。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:336 | 无 | 否 | 待确认 |  |
| 851 | 先让这个月留下内容 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <strong> 区域展示。 | src/pages/Stats.vue:339 | 无 | 否 | 待确认 |  |
| 852 | 实时回顾里要先有过程，月底它才有东西能被封存。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:340 | 无 | 否 | 待确认 |  |
| 853 | 等月份切换自动成册 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <strong> 区域展示。 | src/pages/Stats.vue:343 | 无 | 否 | 待确认 |  |
| 854 | 这一步不用手动操作，月份过去后系统会自己归档。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:344 | 无 | 否 | 待确认 |  |
| 855 | 先看本月实时回顾 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <button> 区域作为可点击操作出现。 | src/pages/Stats.vue:348 | 无 | 否 | 待确认 |  |
| 856 | 已完成 | 详情页 | 正文 / 说明 | 在 详情页 的 detailTags 区域展示。 | src/pages/WishDetailAtelier.vue:125 | 无 | 否 | 待确认 |  |
| 857 | 进行中 | 详情页 | 正文 / 说明 | 在 详情页 的 detailTags 区域展示。 | src/pages/WishDetailAtelier.vue:125 | 无 | 否 | 待确认 |  |
| 858 | 这条愿望暂时还没有移走，请稍后再试。 | 详情页 | 状态 / 反馈 / 错误 | 在 详情页 的 deleted 触发成功、失败、加载或状态更新时出现。 | src/pages/WishDetailAtelier.vue:166 | 无 | 否 | 待确认 |  |
| 859 | 这一页愿望 Wish Detail | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:183 | 无 | 否 | 待确认 |  |
| 860 | 先留一个短标题也没关系，后面还可以在这里补充动机、背景和下一步。 | 详情页 | 标题 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:190 | 无 | 否 | 待确认 |  |
| 861 | 写下的人 | 详情页 | 标签 / 选项 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:200 | 无 | 否 | 待确认 |  |
| 862 | 当前标签 | 详情页 | 标签 / 选项 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:204 | 无 | 否 | 待确认 |  |
| 863 | 这页进展 | 详情页 | 标签 / 选项 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:208 | 无 | 否 | 待确认 |  |
| 864 | {selectedWish.images.length} 张图 · {wishJournalEntries.length} 条记录 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:209 | 无 | 否 | 待确认 |  |
| 865 | 创建时间 | 详情页 | 标签 / 选项 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:212 | 无 | 否 | 待确认 |  |
| 866 | 先把这条愿望稳稳放在手边 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:219 | 无 | 否 | 待确认 |  |
| 867 | 投币、完成和手账记录都会接在这一页。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:220 | 无 | 否 | 待确认 |  |
| 868 | 低频操作 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:237 | 无 | 否 | 待确认 |  |
| 869 | 移走这条愿望 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:238 | 无 | 否 | 待确认 |  |
| 870 | 如果这条愿望已经不需要了，再从这里移走就好。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:242 | 无 | 否 | 待确认 |  |
| 871 | 移走后会回到清单页 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:248 | 无 | 否 | 待确认 |  |
| 872 | 先不删 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:249 | 无 | 否 | 待确认 |  |
| 873 | 删除中... | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:251；src/pages/WishDetailAtelier.vue:499 | 无 | 否 | 待确认 |  |
| 874 | 确认删除 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:251 | 无 | 否 | 待确认 |  |
| 875 | 删除愿望 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:254 | 无 | 否 | 待确认 |  |
| 876 | `{selectedWish.title} 首图` | 详情页 | 标题 | 在 详情页 的 <img> 区域展示。 | src/pages/WishDetailAtelier.vue:262 | selectedWish.title；title | 否 | 待确认 |  |
| 877 | 还没有首图 | 详情页 | 空态 / 缺省 | 在 详情页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:264 | 无 | 否 | 待确认 |  |
| 878 | 这条愿望还没放进图片，但详情页仍会完整保留过程和记录。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:265 | 无 | 否 | 待确认 |  |
| 879 | 封面首图 Cover | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:269 | 无 | 否 | 待确认 |  |
| 880 | 已经留住一张首图 | 详情页 | 空态 / 缺省 | 在 详情页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:270 | 无 | 否 | 待确认 |  |
| 881 | 还没有留下首图 | 详情页 | 空态 / 缺省 | 在 详情页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:270 | 无 | 否 | 待确认 |  |
| 882 | {coverImageEntry ? '已经留住一张首图' : '还没有留下首图'} | 详情页 | 空态 / 缺省 | 在 详情页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:270 | 无 | 否 | 待确认 |  |
| 883 | 写一笔近况 New Entry | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:279 | 无 | 否 | 待确认 |  |
| 884 | 先记下一笔近况 | 详情页 | 标题 | 在 详情页 的 <h2> 区域展示。 | src/pages/WishDetailAtelier.vue:280 | 无 | 否 | 待确认 |  |
| 885 | 会落在下面 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:282 | 无 | 否 | 待确认 |  |
| 886 | 先写一句，想带图也可以；发出去后会顺着往下留下。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:285 | 无 | 否 | 待确认 |  |
| 887 | 留言内容 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:289 | 无 | 否 | 待确认 |  |
| 888 | 先写一句今天的近况 | 详情页 | 输入占位符 | 在 详情页 的 <textarea> 表单输入框为空时作为占位提示出现。 | src/pages/WishDetailAtelier.vue:290 | 无 | 否 | 待确认 |  |
| 889 | 图片附件 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:295 | 无 | 否 | 待确认 |  |
| 890 | 可选，会和这笔近况一起留在下面。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:296 | 无 | 否 | 待确认 |  |
| 891 | 连接云端愿望后，就能把图片和这笔近况一起留下。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:296 | 无 | 否 | 待确认 |  |
| 892 | {wishStore.isUsingCloudWishes ? '可选，会和这笔近况一起留在下面。' : '连接云端愿望后，就能把图片和这笔近况一起留下。'} | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:296 | 无 | 否 | 待确认 |  |
| 893 | 已选 {commentImageFiles.length} 张图 | 详情页 | 正文 / 说明 | 在 详情页 的 <input> 区域展示。 | src/pages/WishDetailAtelier.vue:309 | commentImageFiles.length | 否 | 待确认 |  |
| 894 | 给这条留言加图片 | 详情页 | 正文 / 说明 | 在 详情页 的 <input> 区域展示。 | src/pages/WishDetailAtelier.vue:309 | 无 | 否 | 待确认 |  |
| 895 | 清空已选 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:311 | 无 | 否 | 待确认 |  |
| 896 | 图片留言暂需云端同步 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:314 | 无 | 否 | 待确认 |  |
| 897 | 默认以 {authStore.currentMember?.displayName \|\| '当前成员'} 留言 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:324 | displayName | 否 | 待确认 |  |
| 898 | 发送中... | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:328 | 无 | 否 | 待确认 |  |
| 899 | 发送留言 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:328 | 无 | 否 | 待确认 |  |
| 900 | 重试发送 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:330 | 无 | 否 | 待确认 |  |
| 901 | 推进痕迹 Progress | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:343 | 无 | 否 | 待确认 |  |
| 902 | 这条愿望正走到哪里 | 详情页 | 标题 | 在 详情页 的 <h2> 区域展示。 | src/pages/WishDetailAtelier.vue:344 | 无 | 否 | 待确认 |  |
| 903 | 还没开始 | 详情页 | 标签 / 选项 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:346 | 无 | 否 | 待确认 |  |
| 904 | {progressSnapshot?.label \|\| '还没开始'} | 详情页 | 标签 / 选项 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:346 | 无 | 否 | 待确认 |  |
| 905 | 步骤进度 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:353 | 无 | 否 | 待确认 |  |
| 906 | 进度记录 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:353 | 无 | 否 | 待确认 |  |
| 907 | {progressSnapshot?.mode === 'steps' ? '步骤进度' : progressSnapshot?.mode === 'count' ? '数字进度' : '进度记录'} | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:353 | 无 | 否 | 待确认 |  |
| 908 | `当前进度 {progressSnapshot}` | 详情页 | 可访问性 / aria | 在 详情页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/WishDetailAtelier.vue:356 | progressSnapshot | 是 | 待确认 |  |
| 909 | void adjustCountProgress(-1) | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:363 | 无 | 否 | 待确认 |  |
| 910 | void adjustCountProgress(1) | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:364 | 无 | 否 | 待确认 |  |
| 911 | shouldRecordCountProgressLog | 详情页 | 正文 / 说明 | 在 详情页 的 <input> 区域展示。 | src/pages/WishDetailAtelier.vue:370 | 无 | 否 | 待确认 |  |
| 912 | 每次推进数字进度时，顺手记一笔手账记录 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:371 | 无 | 否 | 待确认 |  |
| 913 | 每往前一点，小奖励会先记到空间页；想领的时候，再过去慢慢挑。 | 详情页 | 空态 / 缺省 | 在 详情页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:374 | 无 | 否 | 待确认 |  |
| 914 | 也可以直接改成现在的数值 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:378 | 无 | 否 | 待确认 |  |
| 915 | countProgressDraft | 详情页 | 正文 / 说明 | 在 详情页 的 <input> 区域展示。 | src/pages/WishDetailAtelier.vue:379 | 无 | 否 | 待确认 |  |
| 916 | void saveCountProgress() | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:381 | 无 | 否 | 待确认 |  |
| 917 | 保存当前进度 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:381 | 无 | 否 | 待确认 |  |
| 918 | 删除 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:397 | 无 | 否 | 待确认 |  |
| 919 | 还没有拆出小步骤 | 详情页 | 空态 / 缺省 | 在 详情页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:402 | 无 | 否 | 待确认 |  |
| 920 | 可以先写下第一个很具体的小目标，例如订票、办签证、买装备。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:403 | 无 | 否 | 待确认 |  |
| 921 | 新增一个小步骤 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:408 | 无 | 否 | 待确认 |  |
| 922 | 例如：先确认路线和预算 | 详情页 | 输入占位符 | 在 详情页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/WishDetailAtelier.vue:409 | 无 | 否 | 待确认 |  |
| 923 | 加入步骤 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:411 | 无 | 否 | 待确认 |  |
| 924 | 还没有开始记录进度 | 详情页 | 空态 / 缺省 | 在 详情页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:416 | 无 | 否 | 待确认 |  |
| 925 | 这条愿望还没决定要怎么记进度，晚一点再补上也没关系。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:417 | 无 | 否 | 待确认 |  |
| 926 | 愿望币与奖励 Wish Coins | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:424 | 无 | 否 | 待确认 |  |
| 927 | 把偏爱、鼓励和奖励留在同一页 | 详情页 | 标题 | 在 详情页 的 <h2> 区域展示。 | src/pages/WishDetailAtelier.vue:425 | 无 | 否 | 待确认 |  |
| 928 | 七龙珠进度 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:434 | 无 | 否 | 待确认 |  |
| 929 | {coinProgressPercent}% | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:435 | 无 | 否 | 待确认 |  |
| 930 | `愿望币进度 {coinSnapshot}/{DRAGON_BALL_COIN_TARGET}` | 详情页 | 可访问性 / aria | 在 详情页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/WishDetailAtelier.vue:437 | coinSnapshot；DRAGON_BALL_COIN_TARGET | 是 | 待确认 |  |
| 931 | { width: `{coinProgressPercent}%` } | 详情页 | 正文 / 说明 | 在 详情页 的 <div> 区域展示。 | src/pages/WishDetailAtelier.vue:438 | coinProgressPercent | 否 | 待确认 |  |
| 932 | {member.total} 枚 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:446 | 无 | 否 | 待确认 |  |
| 933 | 你手里现在攒着 {currentMemberStarCoins} 枚星星币，也替自己备下了 {currentMemberPremiumRewards.length} 项高档奖励；步骤和数字进度的小奖励，现在统一去空间页接住。 | 详情页 | 空态 / 缺省 | 在 详情页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:452 | 无 | 否 | 待确认 |  |
| 934 | 已领 {wishRewardClaim.titleSnapshot} | 详情页 | 标题 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:454 | titleSnapshot；title | 否 | 待确认 |  |
| 935 | 完成时就能领奖 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:455 | 无 | 否 | 待确认 |  |
| 936 | 本周还剩 {wishStore.currentMemberRemainingCoins} 枚愿望币 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:456 | 无 | 否 | 待确认 |  |
| 937 | 共同手账 Thread | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:466 | 无 | 否 | 待确认 |  |
| 938 | 这一页已经留下的过程 | 详情页 | 标题 | 在 详情页 的 <h2> 区域展示。 | src/pages/WishDetailAtelier.vue:467 | 无 | 否 | 待确认 |  |
| 939 | 最新在上 · {visibleThreads.length} 笔 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:469 | 无 | 否 | 待确认 |  |
| 940 | 最上面这一笔就是最近一次近况，往下是更早的记录。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:472 | 无 | 否 | 待确认 |  |
| 941 | {thread.images.length} 张图 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:487 | 无 | 否 | 待确认 |  |
| 942 | 系统记录 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:488 | 无 | 否 | 待确认 |  |
| 943 | 取消编辑 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:496 | 无 | 否 | 待确认 |  |
| 944 | 编辑评论 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:496 | 无 | 否 | 待确认 |  |
| 945 | 删除评论 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:499 | 无 | 否 | 待确认 |  |
| 946 | 编辑留言内容 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:505 | 无 | 否 | 待确认 |  |
| 947 | 取消 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:508；src/pages/WishDetailAtelier.vue:672 | 无 | 否 | 待确认 |  |
| 948 | 保存留言 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:510 | 无 | 否 | 待确认 |  |
| 949 | 图片准备中 | 详情页 | 空态 / 缺省 | 在 详情页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:526 | 无 | 否 | 待确认 |  |
| 950 | isThreadReactionExpanded(thread.id) ? '收起表情选项' : '打开表情选项' | 详情页 | 可访问性 / aria | 在 详情页 的 <button> 区域供屏幕阅读器或辅助技术感知。 | src/pages/WishDetailAtelier.vue:544 | 无 | 是 | 待确认 |  |
| 951 | 收起表情 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:547 | 无 | 否 | 待确认 |  |
| 952 | 表情 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:547 | 无 | 否 | 待确认 |  |
| 953 | {thread.reactions.length} 种回应 | 详情页 | 按钮 / 链接 | 在 详情页 的 <span> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:550 | 无 | 否 | 待确认 |  |
| 954 | 处理中 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:573 | 无 | 否 | 待确认 |  |
| 955 | 这条愿望还没有留下手账记录 | 详情页 | 空态 / 缺省 | 在 详情页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:584 | 无 | 否 | 待确认 |  |
| 956 | 先从上面的留言口写下一句，后面的变化会继续接进来。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:585 | 无 | 否 | 待确认 |  |
| 957 | 图片与纪念 Images | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:594 | 无 | 否 | 待确认 |  |
| 958 | 图片与纪念 | 详情页 | 标题 | 在 详情页 的 <h2> 区域展示。 | src/pages/WishDetailAtelier.vue:595 | 无 | 否 | 待确认 |  |
| 959 | {visibleImages.length} 张 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:597 | 无 | 否 | 待确认 |  |
| 960 | 先挑出最想记住的画面 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:603 | 无 | 否 | 待确认 |  |
| 961 | 这里更像纪念册。先摆顺序，再补一句话。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:604 | 无 | 否 | 待确认 |  |
| 962 | 上传中... | 详情页 | 正文 / 说明 | 在 详情页 的 <input> 区域展示。 | src/pages/WishDetailAtelier.vue:615 | 无 | 否 | 待确认 |  |
| 963 | 添加封面图 | 详情页 | 正文 / 说明 | 在 详情页 的 <input> 区域展示。 | src/pages/WishDetailAtelier.vue:615 | 无 | 否 | 待确认 |  |
| 964 | 已有限制：每条愿望 1 张封面图 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:617 | 无 | 否 | 待确认 |  |
| 965 | 当前只保留一张封面图；若要换图，先删除这张再上传。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:621 | 无 | 否 | 待确认 |  |
| 966 | 这一页的封面 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:625 | 无 | 否 | 待确认 |  |
| 967 | 还没设置首图 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:626 | 无 | 否 | 待确认 |  |
| 968 | {coverImageEntry?.fileName \|\| '还没设置首图'} | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:626 | 无 | 否 | 待确认 |  |
| 969 | 封面会先出现在首屏。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:627 | 无 | 否 | 待确认 |  |
| 970 | ['detail-atelier-image-figure', { 'is-cover': isCoverImage(image.id) }] | 详情页 | 正文 / 说明 | 在 详情页 的 <figure> 区域展示。 | src/pages/WishDetailAtelier.vue:636 | 无 | 否 | 待确认 |  |
| 971 | 图片链接准备中 | 详情页 | 空态 / 缺省 | 在 详情页 的 <div> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:642 | 无 | 否 | 待确认 |  |
| 972 | 当前首图 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:645 | 无 | 否 | 待确认 |  |
| 973 | 第 {index + 1} 张 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:645 | index + 1 | 否 | 待确认 |  |
| 974 | {isCoverImage(image.id) ? '当前首图' : `第 {index + 1} 张`} | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:645 | index + 1 | 否 | 待确认 |  |
| 975 | isCoverImage(image.id) | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:658 | 无 | 否 | 待确认 |  |
| 976 | 封面 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:658 | 无 | 否 | 待确认 |  |
| 977 | 纪念备注 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:662 | 无 | 否 | 待确认 |  |
| 978 | 还没写下这一刻 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:662 | 无 | 否 | 待确认 |  |
| 979 | {image.note ? '纪念备注' : '还没写下这一刻'} | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:662 | note | 否 | 待确认 |  |
| 980 | 可以补一句地点、当时的心情，或者它为什么值得留下。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:663 | 无 | 否 | 待确认 |  |
| 981 | {image.note \|\| '可以补一句地点、当时的心情，或者它为什么值得留下。'} | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:663 | note | 否 | 待确认 |  |
| 982 | 图片备注 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:668 | 无 | 否 | 待确认 |  |
| 983 | 补充这张图的地点、想法、来源或纪念意义 | 详情页 | 输入占位符 | 在 详情页 的 <textarea> 表单输入框为空时作为占位提示出现。 | src/pages/WishDetailAtelier.vue:669 | 无 | 否 | 待确认 |  |
| 984 | 保存备注 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:674 | 无 | 否 | 待确认 |  |
| 985 | 编辑备注 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:681 | 无 | 否 | 待确认 |  |
| 986 | 添加备注 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:681 | 无 | 否 | 待确认 |  |
| 987 | 删除图片 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:683 | 无 | 否 | 待确认 |  |
| 988 | 还没有图片 | 详情页 | 空态 / 缺省 | 在 详情页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:690 | 无 | 否 | 待确认 |  |
| 989 | 可以给这条愿望上传灵感图、截图或者完成过程里的纪念照片。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:691 | 无 | 否 | 待确认 |  |
| 990 | 还没有找到这条愿望 | 详情页 | 标题 | 在 详情页 的 <h2> 区域展示。 | src/pages/WishDetailAtelier.vue:699 | 无 | 否 | 待确认 |  |
| 991 | 它可能已经被删除；如果你还没有写下任何愿望，就先从第一条开始。 | 详情页 | 空态 / 缺省 | 在 详情页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:700 | 无 | 否 | 待确认 |  |
| 992 | 回清单看看 | 详情页 | 按钮 / 链接 | 在 详情页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:702 | 无 | 否 | 待确认 |  |
| 993 | 愿望奖励 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:711 | 无 | 否 | 待确认 |  |
| 994 | 给这次完成一个正式的奖励仪式 | 详情页 | 标题 | 在 详情页 的 <h3> 区域展示。 | src/pages/WishDetailAtelier.vue:712 | 无 | 否 | 待确认 |  |
| 995 | 关闭 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:714；src/pages/WishDetailAtelier.vue:772 | 无 | 否 | 待确认 |  |
| 996 | 整条愿望完成时，可以从高档奖励池里认真挑一个。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:717 | 无 | 否 | 待确认 |  |
| 997 | 手里的星星币 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:721 | 无 | 否 | 待确认 |  |
| 998 | 眼前可选的奖励 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:725 | 无 | 否 | 待确认 |  |
| 999 | 这条奖励还没有补充说明。 | 详情页 | 空态 / 缺省 | 在 详情页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:742 | 无 | 否 | 待确认 |  |
| 1000 | {item.note \|\| '这条奖励还没有补充说明。'} | 详情页 | 空态 / 缺省 | 在 详情页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:742 | note | 否 | 待确认 |  |
| 1001 | 已领 {wishStore.getRewardItemClaimCount(item)} 份 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:744 | 无 | 否 | 待确认 |  |
| 1002 | 0" class="detail-atelier-chip">{item.starCoinCost} 星星币可兑换 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:745 | 无 | 否 | 待确认 |  |
| 1003 | 你的高档奖励池还是空的 | 详情页 | 空态 / 缺省 | 在 详情页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:750 | 无 | 否 | 待确认 |  |
| 1004 | 先去空间页放进一两个大奖励，再回来会更顺。 | 详情页 | 空态 / 缺省 | 在 详情页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:751 | 无 | 否 | 待确认 |  |
| 1005 | 先放一放 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:757 | 无 | 否 | 待确认 |  |
| 1006 | 确认中... | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:759 | 无 | 否 | 待确认 |  |
| 1007 | 完成并领取高档奖励 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:759 | 无 | 否 | 待确认 |  |
| 1008 | 图片预览 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:769 | 无 | 否 | 待确认 |  |
| 1009 | 上一张 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:776 | 无 | 否 | 待确认 |  |
| 1010 | 下一张 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:778 | 无 | 否 | 待确认 |  |
| 1011 | 这张图还没有备注。 | 详情页 | 空态 / 缺省 | 在 详情页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:785 | 无 | 否 | 待确认 |  |
| 1012 | {previewImage.note \|\| '这张图还没有备注。'} | 详情页 | 空态 / 缺省 | 在 详情页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:785 | note | 否 | 待确认 |  |
| 1013 | 晨光 x 星野 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 DEFAULT_SPACE 区域展示。 | src/stores/auth.ts:14 | 无 | 否 | 待确认 |  |
| 1014 | 晨光 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 DEFAULT_MEMBERS 区域展示。 | src/stores/auth.ts:22 | 无 | 否 | 待确认 |  |
| 1015 | 星野 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 DEFAULT_MEMBERS 区域展示。 | src/stores/auth.ts:29 | 无 | 否 | 待确认 |  |
| 1016 | 请优先确认云端已执行 202604260004_grant_authenticated_access.sql、202604270005_create_personal_space_rpc.sql、202604290010_make_personal_space_idempotent.sql、202604290011_bind_space_emails.sql，并在 Supabase Dashboard 里刷新 API schema cache。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 migrationHint 区域展示。 | src/stores/auth.ts:79 | email | 否 | 待确认 |  |
| 1017 | Supabase 空间自举失败：{stage} 返回了空白错误。{migrationHint} | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 migrationHint 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:82 | stage；migrationHint | 否 | 待确认 |  |
| 1018 | Supabase 空间自举失败：{stage} 在浏览器侧表现为 Failed to fetch。{migrationHint} | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 message 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:89 | stage；migrationHint | 否 | 待确认 |  |
| 1019 | 已登录，但当前请求仍然无法访问业务表。若你已经执行过 202604260004_grant_authenticated_access.sql，这通常表示本次请求还没有真正带上 authenticated 会话，或还有别的数据库对象权限未放开。 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 hint 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:104 | 无 | 否 | 待确认 |  |
| 1020 | 当前会按 {email} 校验。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 emailHint 区域展示。 | src/stores/auth.ts:135 | email | 否 | 待确认 |  |
| 1021 | 邮箱验证码已失效。常见原因：重新发送过验证码后旧码会立即作废；邮件里如果还带有登录链接，企业邮箱安全扫描可能会提前消费这次验证码。请重新发送一次，只使用最后一封邮件里的验证码，不要点邮件里的任何登录链接。{emailHint} | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 emailHint 区域展示。 | src/stores/auth.ts:138 | emailHint；email | 否 | 待确认 |  |
| 1022 | 泰杰 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 PREFERRED_DISPLAY_NAME_ALIASES 区域展示。 | src/stores/auth.ts:205 | 无 | 否 | 待确认 |  |
| 1023 | 登录邮件已发出，等待邮箱确认后会建立 Supabase 会话；如果邮件里提供的是验证码，也可以在首页手动输入。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 sessionSummary 区域展示。 | src/stores/auth.ts:287 | 无 | 否 | 待确认 |  |
| 1024 | 尚未登录，当前显示的是本地演示数据。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 sessionSummary 区域展示。 | src/stores/auth.ts:291 | 无 | 否 | 待确认 |  |
| 1025 | {currentMember} 已登录，当前空间与愿望将优先走 Supabase。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 sessionSummary 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:295 | currentMember；displayName | 否 | 待确认 |  |
| 1026 | {currentMember} 已登录，但当前仍停留在本地演示空间。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 sessionSummary 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:298 | currentMember；displayName | 否 | 待确认 |  |
| 1027 | {displayName} 的愿望空间 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 displayName 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:405 | displayName | 否 | 待确认 |  |
| 1028 | 已登录，但未找到可访问的 Supabase 空间，也未能自动创建个人空间。 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 createdSpace 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:464 | 无 | 否 | 待确认 |  |
| 1029 | 已登录，但当前账号还没有任何 Supabase 空间成员记录。请确认初始 schema migration 已完整执行。 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 createdSpace 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:472 | 无 | 否 | 待确认 |  |
| 1030 | 已登录，但读取 Supabase 空间详情失败。请确认 spaces 和 space_members 表都已创建并开放给前端访问。 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 targetSpace 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:487 | 无 | 否 | 待确认 |  |
| 1031 | 已登录，但同步 Supabase 空间失败 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:507 | 无 | 否 | 待确认 |  |
| 1032 | 登录回跳失败：{decodeURIComponent} | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 callbackError 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:578 | decodeURIComponent | 否 | 待确认 |  |
| 1033 | 登录回跳失败：{error.message} | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 authCode 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:591；src/stores/auth.ts:619；src/stores/auth.ts:639 | error.message；message | 否 | 待确认 |  |
| 1034 | 邮箱验证成功，正在恢复登录会话。 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 authCode 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:595；src/stores/auth.ts:623；src/stores/auth.ts:643 | 无 | 否 | 待确认 |  |
| 1035 | 登录回跳失败：无法识别回调类型 {tokenType} | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 normalizedType 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:608 | tokenType | 否 | 待确认 |  |
| 1036 | 请输入有效邮箱后再继续。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 normalizedEmail 区域展示。 | src/stores/auth.ts:678 | 无 | 否 | 待确认 |  |
| 1037 | Supabase 发送验证码失败 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:704 | 无 | 否 | 待确认 |  |
| 1038 | 已向 {normalizedEmail} 发送登录验证码。只有最后一封邮件里的验证码有效；如果邮件里还带有登录链接，不要点那个链接，只用验证码。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/auth.ts:713 | normalizedEmail | 否 | 待确认 |  |
| 1039 | 已为 {matchedMember.displayName} 建立本地 mock 会话。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/auth.ts:722 | matchedMember.displayName；displayName | 否 | 待确认 |  |
| 1040 | 请输入邮箱和验证码后再继续。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 normalizedToken 区域展示。 | src/stores/auth.ts:736 | 无 | 否 | 待确认 |  |
| 1041 | 当前环境未接入 Supabase，无法校验邮箱验证码。 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 normalizedToken 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:744 | 无 | 否 | 待确认 |  |
| 1042 | 邮箱验证码校验成功，已完成登录。 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 confirmedSession 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:771 | 无 | 否 | 待确认 |  |
| 1043 | 请输入邀请码后再继续。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 normalizedCode 区域展示。 | src/stores/auth.ts:782 | 无 | 否 | 待确认 |  |
| 1044 | 加入空间失败：{error.message} | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:796 | error.message；message | 否 | 待确认 |  |
| 1045 | 已通过 Supabase 加入空间，成员和邀请码已经刷新。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 joinedMember 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:806 | 无 | 否 | 待确认 |  |
| 1046 | 请先通过邮箱验证码登录，再加入空间。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 joinedMember 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:814 | 无 | 否 | 待确认 |  |
| 1047 | 邀请码不正确，当前只接受示例码。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/auth.ts:822 | 无 | 否 | 待确认 |  |
| 1048 | 邀请码校验通过；前端暂时还是本地流程，数据库侧的 join_space_by_invite RPC 已准备好。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/auth.ts:830 | 无 | 否 | 待确认 |  |
| 1049 | 请输入要固定到当前空间的邮箱。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 normalizedDisplayName 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:842 | 无 | 否 | 待确认 |  |
| 1050 | 请先登录到 Supabase 空间，再绑定固定邮箱。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 normalizedDisplayName 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:850 | 无 | 否 | 待确认 |  |
| 1051 | 只有当前空间的 owner 可以绑定固定邮箱。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:858 | 无 | 否 | 待确认 |  |
| 1052 | 固定邮箱失败：{error.message} | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:873 | error.message；message | 否 | 待确认 |  |
| 1053 | 已把 {normalizedEmail} 绑定到当前空间，默认身份会显示为 {normalizedDisplayName}。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:881 | normalizedEmail；normalizedDisplayName | 否 | 待确认 |  |
| 1054 | 已把 {normalizedEmail} 绑定到当前空间。后续这个邮箱登录时会优先进入这里。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:882 | normalizedEmail | 否 | 待确认 |  |
| 1055 | {year}年{month}月 月刊 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 formatMonthCoverTitle 区域展示。 | src/stores/wishes.ts:625 | year；month | 否 | 待确认 |  |
| 1056 | 认真写下了「{wish.title}」。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 wish 区域展示。 | src/stores/wishes.ts:749 | wish.title；title | 否 | 待确认 |  |
| 1057 | 把「{wish.title}」收进了回忆里。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 completedAt 区域展示。 | src/stores/wishes.ts:769 | wish.title；title | 否 | 待确认 |  |
| 1058 | 走完了小步骤「{step.title}」。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 step 区域展示。 | src/stores/wishes.ts:787 | step.title；title | 否 | 待确认 |  |
| 1059 | 给「{wish.title}」轻轻投下了 1 枚愿望币。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 wish 区域展示。 | src/stores/wishes.ts:831 | wish.title；title | 否 | 待确认 |  |
| 1060 | 「{wish.title}」集齐了七龙珠，神龙开始认真听见这份心愿。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 nextCoinTotal 区域展示。 | src/stores/wishes.ts:854 | wish.title；title | 否 | 待确认 |  |
| 1061 | {claim.quantity} 点 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 countUnitLabel 区域展示。 | src/stores/wishes.ts:871 | claim.quantity | 否 | 待确认 |  |
| 1062 | 走完了小步骤「{relatedStep}」，也接住了「{claim.titleSnapshot}」。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 messageText 区域展示。 | src/stores/wishes.ts:873 | relatedStep；claim.titleSnapshot；titleSnapshot；title | 否 | 待确认 |  |
| 1063 | 把「{relatedWish}」往前推进了 {countUnitLabel}，也接住了「{claim.titleSnapshot}」。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 messageText 区域展示。 | src/stores/wishes.ts:875 | relatedWish；countUnitLabel；claim.titleSnapshot；titleSnapshot；title | 否 | 待确认 |  |
| 1064 | 把「{relatedWish}」认真完成，也接住了「{claim.titleSnapshot}」。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 messageText 区域展示。 | src/stores/wishes.ts:877 | relatedWish；claim.titleSnapshot；titleSnapshot；title | 否 | 待确认 |  |
| 1065 | 完成了小步骤「{relatedStep}」，把这次奖励存成了 {Math.abs} 枚星星币。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 messageText 区域展示。 | src/stores/wishes.ts:880 | relatedStep；Math.abs；title | 否 | 待确认 |  |
| 1066 | 把「{relatedWish}」往前推进了 {countUnitLabel}，并存下了 {Math.abs} 枚星星币。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 messageText 区域展示。 | src/stores/wishes.ts:881 | relatedWish；countUnitLabel；Math.abs；title | 否 | 待确认 |  |
| 1067 | 用 {Math.abs} 枚星星币换来了「{claim.titleSnapshot}」。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 messageText 区域展示。 | src/stores/wishes.ts:882 | Math.abs；claim.titleSnapshot；titleSnapshot；title | 否 | 待确认 |  |
| 1068 | 当前使用本地演示数据。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 syncMessage 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:1814；src/stores/wishes.ts:4736 | 无 | 否 | 待确认 |  |
| 1069 | Realtime 未启用，当前显示本地演示数据。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 realtimeMessage 区域展示。 | src/stores/wishes.ts:1821 | 无 | 否 | 待确认 |  |
| 1070 | Realtime 连接中，当前空间的变更很快会自动刷新。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 realtimeMessage 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:1825 | 无 | 否 | 待确认 |  |
| 1071 | Realtime 已连接，当前空间的愿望和留言会自动刷新。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 realtimeMessage 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:1829 | 无 | 否 | 待确认 |  |
| 1072 | Realtime 连接异常，当前仍会在写入后自动重新拉取云端数据。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 realtimeMessage 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:1833 | 无 | 否 | 待确认 |  |
| 1073 | Realtime 当前未连接。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 realtimeMessage 区域展示。 | src/stores/wishes.ts:1836 | 无 | 否 | 待确认 |  |
| 1074 | {authStore.spaceName \|\| 愿望空间} 的固定版本回顾 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 orderedThreads 区域展示。 | src/stores/wishes.ts:2427 | authStore.spaceName \|\| 愿望空间 | 否 | 待确认 |  |
| 1075 | {reason}有更新，正在刷新云端数据... | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 scheduleRealtimeSync 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2526 | reason | 否 | 待确认 |  |
| 1076 | 图片 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 visibleWishIds 区域展示。 | src/stores/wishes.ts:2556；src/stores/wishes.ts:2561 | 无 | 否 | 待确认 |  |
| 1077 | 留言图片 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 visibleCommentIds 区域展示。 | src/stores/wishes.ts:2573；src/stores/wishes.ts:2578 | 无 | 否 | 待确认 |  |
| 1078 | 手账图片 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 visibleThreadIds 区域展示。 | src/stores/wishes.ts:2588；src/stores/wishes.ts:2593 | 无 | 否 | 待确认 |  |
| 1079 | 愿望 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 setupRealtimeSubscription 区域展示。 | src/stores/wishes.ts:2625 | 无 | 否 | 待确认 |  |
| 1080 | 愿望手账 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:2628 | 无 | 否 | 待确认 |  |
| 1081 | 表情回应 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 <string> 区域展示。 | src/stores/wishes.ts:2643 | 无 | 否 | 待确认 |  |
| 1082 | 奖励池 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 <string> 区域展示。 | src/stores/wishes.ts:2646 | 无 | 否 | 待确认 |  |
| 1083 | 领奖记录 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 <string> 区域展示。 | src/stores/wishes.ts:2649 | 无 | 否 | 待确认 |  |
| 1084 | 月刊快照 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 <string> 区域展示。 | src/stores/wishes.ts:2652 | 无 | 否 | 待确认 |  |
| 1085 | 云端愿望同步失败：{wishError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 syncFromSupabase 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2689 | wishError.message；message | 否 | 待确认 |  |
| 1086 | 云端奖励池同步失败：{rewardPoolItemError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 <string> 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2717 | rewardPoolItemError.message；message | 否 | 待确认 |  |
| 1087 | 云端领奖记录同步失败：{rewardClaimError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2732 | rewardClaimError.message；message | 否 | 待确认 |  |
| 1088 | 云端月刊补冻结失败：{ensureMonthlySnapshotsError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2744 | ensureMonthlySnapshotsError.message；message | 否 | 待确认 |  |
| 1089 | 云端手账同步失败：{threadError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2755 | threadError.message；message | 否 | 待确认 |  |
| 1090 | 云端表情回应同步失败：{reactionError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2770 | reactionError.message；message | 否 | 待确认 |  |
| 1091 | 云端手账图片同步失败：{threadImageError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 threadIds 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2798 | threadImageError.message；message | 否 | 待确认 |  |
| 1092 | 云端手账图片链接生成失败：{signedThreadImageUrlError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2810 | signedThreadImageUrlError.message；message | 否 | 待确认 |  |
| 1093 | 云端月刊同步失败：{snapshotError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 <string> 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2834 | snapshotError.message；message | 否 | 待确认 |  |
| 1094 | 云端愿望币同步失败：{wishCoinError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2851 | wishCoinError.message；message | 否 | 待确认 |  |
| 1095 | 云端留言同步失败：{commentError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2893 | commentError.message；message | 否 | 待确认 |  |
| 1096 | 云端留言图片同步失败：{commentImageError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 commentIds 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2910 | commentImageError.message；message | 否 | 待确认 |  |
| 1097 | 云端留言图片链接生成失败：{signedCommentImageUrlError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2922 | signedCommentImageUrlError.message；message | 否 | 待确认 |  |
| 1098 | 云端步骤同步失败：{stepError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 <string> 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2946 | stepError.message；message | 否 | 待确认 |  |
| 1099 | 云端图片同步失败：{imageError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2960 | imageError.message；message | 否 | 待确认 |  |
| 1100 | 云端图片链接生成失败：{signedImageUrlError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2972 | signedImageUrlError.message；message | 否 | 待确认 |  |
| 1101 | 当前显示的是 Supabase 云端愿望数据。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3033 | 无 | 否 | 待确认 |  |
| 1102 | 云端写入失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 runCloudMutation 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3054；src/stores/wishes.ts:3098 | error.message；message | 否 | 待确认 |  |
| 1103 | 愿望和 {normalizedStepTitles.length} 个初始步骤已写入 Supabase。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3103 | normalizedStepTitles.length | 否 | 待确认 |  |
| 1104 | 愿望已写入 Supabase。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3104 | 无 | 否 | 待确认 |  |
| 1105 | 愿望已写入，但初始步骤同步失败：{stepError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3117 | stepError.message；message | 否 | 待确认 |  |
| 1106 | 愿望和 {normalizedStepTitles.length} 个初始步骤已保存到本地。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 createdWish 区域展示。 | src/stores/wishes.ts:3135 | normalizedStepTitles.length | 否 | 待确认 |  |
| 1107 | 愿望已保存到本地。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 createdWish 区域展示。 | src/stores/wishes.ts:3136 | 无 | 否 | 待确认 |  |
| 1108 | 愿望修改已同步到 Supabase。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3168 | 无 | 否 | 待确认 |  |
| 1109 | 愿望已从 Supabase 删除。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 client 区域展示。 | src/stores/wishes.ts:3194 | 无 | 否 | 待确认 |  |
| 1110 | 当前会话缺少领奖身份，请先切换到具体成员。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 normalizedCost 区域展示。 | src/stores/wishes.ts:3228 | 无 | 否 | 待确认 |  |
| 1111 | 先写下这条奖励是什么。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 normalizedCost 区域展示。 | src/stores/wishes.ts:3232 | 无 | 否 | 待确认 |  |
| 1112 | 奖励池写入失败：{error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3255 | error.message；message | 否 | 待确认 |  |
| 1113 | 奖励池写入失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3256 | error.message；message | 否 | 待确认 |  |
| 1114 | 已把「{normalizedTitle}」放进你的{input.tier === premium}奖励池。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3261；src/stores/wishes.ts:3277 | normalizedTitle；input.tier === premium | 否 | 待确认 |  |
| 1115 | 只能修改你自己的奖励池条目。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 item 区域展示。 | src/stores/wishes.ts:3292 | 无 | 否 | 待确认 |  |
| 1116 | 奖励名称不能为空。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 nextCost 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:3302 | 无 | 否 | 待确认 |  |
| 1117 | 奖励池更新失败：{error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3324 | error.message；message | 否 | 待确认 |  |
| 1118 | 奖励池更新失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3325 | error.message；message | 否 | 待确认 |  |
| 1119 | 已更新「{nextTitle}」。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3330；src/stores/wishes.ts:3340 | nextTitle | 否 | 待确认 |  |
| 1120 | 只能整理你自己的奖励池条目。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 item 区域展示。 | src/stores/wishes.ts:3348 | 无 | 否 | 待确认 |  |
| 1121 | 奖励池整理失败：{error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3366 | error.message；message | 否 | 待确认 |  |
| 1122 | 奖励池整理失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3367 | error.message；message | 否 | 待确认 |  |
| 1123 | 已把「{item.title}」收进已领取档案。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3372；src/stores/wishes.ts:3380 | item.title；title | 否 | 待确认 |  |
| 1124 | 当前没有可完成的愿望。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 rewardItem 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:3389 | 无 | 否 | 待确认 |  |
| 1125 | 这个愿望已经完成了。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 rewardItem 区域展示。 | src/stores/wishes.ts:3393 | 无 | 否 | 待确认 |  |
| 1126 | 这条愿望的完成奖励已经领过了。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 rewardItem 区域展示。 | src/stores/wishes.ts:3397 | 无 | 否 | 待确认 |  |
| 1127 | 请从你自己的高档奖励池里挑一个奖励。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 rewardItem 区域展示。 | src/stores/wishes.ts:3401 | 无 | 否 | 待确认 |  |
| 1128 | 愿望领奖失败：{error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3419 | error.message；message | 否 | 待确认 |  |
| 1129 | 愿望领奖失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3420 | error.message；message | 否 | 待确认 |  |
| 1130 | 这条愿望已经完成，也接住了「{rewardItem.title}」。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3425；src/stores/wishes.ts:3447 | rewardItem.title；title | 否 | 待确认 |  |
| 1131 | 当前没有可领取的小奖励。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 rewardItem 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:3465 | 无 | 否 | 待确认 |  |
| 1132 | 先把这个步骤完成，再来空间页领奖。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 rewardItem 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:3469 | 无 | 否 | 待确认 |  |
| 1133 | 这个步骤的小奖励已经领过了。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 rewardItem 区域展示。 | src/stores/wishes.ts:3473 | 无 | 否 | 待确认 |  |
| 1134 | 请从你自己的日常奖励池里挑一个奖励，或者改存星星币。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 rewardItem 区域展示。 | src/stores/wishes.ts:3477；src/stores/wishes.ts:3567 | 无 | 否 | 待确认 |  |
| 1135 | 步骤领奖失败：{error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3497 | error.message；message | 否 | 待确认 |  |
| 1136 | 步骤领奖失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3498 | error.message；message | 否 | 待确认 |  |
| 1137 | 这个步骤的小奖励已经存成 {STEP_COMPLETION_STAR_COIN_REWARD} 枚星星币。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3506；src/stores/wishes.ts:3531 | STEP_COMPLETION_STAR_COIN_REWARD | 否 | 待确认 |  |
| 1138 | 这个步骤的小奖励已经接住「{rewardItem}」。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3507；src/stores/wishes.ts:3532 | rewardItem；title | 否 | 待确认 |  |
| 1139 | 完成一个小步骤后，在空间页把这次奖励存成了 1 枚星星币。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:3517 | 无 | 否 | 待确认 |  |
| 1140 | {STEP_COMPLETION_STAR_COIN_REWARD} 枚星星币 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3524 | STEP_COMPLETION_STAR_COIN_REWARD | 否 | 待确认 |  |
| 1141 | 当前没有可领取的数字进度奖励。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 pendingUnits 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:3555 | 无 | 否 | 待确认 |  |
| 1142 | 这条数字进度暂时没有待领取的小奖励。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 pendingUnits 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:3559 | 无 | 否 | 待确认 |  |
| 1143 | 这条数字进度现在只剩 {pendingUnits} 点待领取。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 pendingUnits 区域展示。 | src/stores/wishes.ts:3563 | pendingUnits | 否 | 待确认 |  |
| 1144 | 数字进度领奖失败：{error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3587 | error.message；message | 否 | 待确认 |  |
| 1145 | 数字进度领奖失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3588 | error.message；message | 否 | 待确认 |  |
| 1146 | 这 {quantity} 点数字进度已经存成 {quantity} 枚星星币。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3596；src/stores/wishes.ts:3620 | quantity | 否 | 待确认 |  |
| 1147 | 这 {quantity} 点数字进度已经接住「{rewardItem}」。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3597；src/stores/wishes.ts:3621 | quantity；rewardItem；title | 否 | 待确认 |  |
| 1148 | 数字进度往前推进了 {quantity} 点，在空间页把这次奖励存成了 {quantity} 枚星星币。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:3607 | quantity | 否 | 待确认 |  |
| 1149 | {quantity} 枚星星币 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3613 | quantity | 否 | 待确认 |  |
| 1150 | 只能兑换你自己的高档奖励。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 rewardItem 区域展示。 | src/stores/wishes.ts:3630 | 无 | 否 | 待确认 |  |
| 1151 | 这条高档奖励还没有设置星星币价格。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 rewardItem 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:3634 | 无 | 否 | 待确认 |  |
| 1152 | 还差 {rewardItem.starCoinCost - getMemberStarCoinBalance} 枚星星币。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 rewardItem 区域展示。 | src/stores/wishes.ts:3638 | rewardItem.starCoinCost - getMemberStarCoinBalance | 否 | 待确认 |  |
| 1153 | 高档奖励兑换失败：{error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3655 | error.message；message | 否 | 待确认 |  |
| 1154 | 高档奖励兑换失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3656 | error.message；message | 否 | 待确认 |  |
| 1155 | 已用 {rewardItem.starCoinCost} 枚星星币兑换「{rewardItem.title}」。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3661；src/stores/wishes.ts:3679 | rewardItem.starCoinCost；rewardItem.title；title | 否 | 待确认 |  |
| 1156 | 愿望状态已同步到 Supabase。 | 愿望/奖励/同步状态 | 标签 / 选项 | 在 愿望/奖励/同步状态 的 client 区域展示。 | src/stores/wishes.ts:3701 | 无 | 否 | 待确认 |  |
| 1157 | 这个愿望已经实现了，不需要再为它投币。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 memberId 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3721 | 无 | 否 | 待确认 |  |
| 1158 | 这周分给你的 3 枚愿望币已经投完了。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 memberId 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3726 | 无 | 否 | 待确认 |  |
| 1159 | 投币失败：{error.message}。如果你刚更新前端，请先执行新的 Supabase 愿望币 migration。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3742 | error.message；message | 否 | 待确认 |  |
| 1160 | 投币失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3743 | error.message；message | 否 | 待确认 |  |
| 1161 | 已为这个愿望投出 1 枚愿望币。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3748 | 无 | 否 | 待确认 |  |
| 1162 | 已投出这周最后 1 枚愿望币。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3764 | 无 | 否 | 待确认 |  |
| 1163 | 已为这个愿望投出 1 枚愿望币。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:3765 | 无 | 否 | 待确认 |  |
| 1164 | 已经走到这个阶段的终点了。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 normalizedCurrent 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3783 | 无 | 否 | 待确认 |  |
| 1165 | 进度没有变化。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 normalizedCurrent 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3783 | 无 | 否 | 待确认 |  |
| 1166 | 进度已同步到 Supabase。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 client 区域展示。 | src/stores/wishes.ts:3796 | 无 | 否 | 待确认 |  |
| 1167 | 已更新当前进度。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3802 | 无 | 否 | 待确认 |  |
| 1168 | 先写下这个小步骤是什么。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 normalizedTitle 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3825 | 无 | 否 | 待确认 |  |
| 1169 | 小步骤已同步到 Supabase。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 client 区域展示。 | src/stores/wishes.ts:3840 | 无 | 否 | 待确认 |  |
| 1170 | 已添加一个小步骤。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3846 | 无 | 否 | 待确认 |  |
| 1171 | 已完成一个小步骤。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 client 区域展示。 | src/stores/wishes.ts:3870 | 无 | 否 | 待确认 |  |
| 1172 | 这个步骤已经放回路上。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 client 区域展示。 | src/stores/wishes.ts:3870 | 无 | 否 | 待确认 |  |
| 1173 | 已完成一个小步骤。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3877 | 无 | 否 | 待确认 |  |
| 1174 | 这个步骤已经放回路上。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3877 | 无 | 否 | 待确认 |  |
| 1175 | 已删除这个小步骤。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 client 区域展示。 | src/stores/wishes.ts:3899 | 无 | 否 | 待确认 |  |
| 1176 | 已删除这个小步骤。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3905 | 无 | 否 | 待确认 |  |
| 1177 | 没有找到对应的愿望，暂时不能发送留言。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 normalizedMessage 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:3915 | 无 | 否 | 待确认 |  |
| 1178 | 留言内容不能为空。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 normalizedMessage 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:3922；src/stores/wishes.ts:4092 | 无 | 否 | 待确认 |  |
| 1179 | 留言图片仅在已连接的 Supabase 云端空间中可用。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 normalizedMessage 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:3929 | 无 | 否 | 待确认 |  |
| 1180 | 云端写入失败：{commentError} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 nextAuthorId 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3952 | commentError；message | 否 | 待确认 |  |
| 1181 | 留言发送失败，请稍后重试。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3955 | 无 | 否 | 待确认 |  |
| 1182 | 留言已同步到 Supabase。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4025 | 无 | 否 | 待确认 |  |
| 1183 | 这句近况已经送出。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:4028 | 无 | 否 | 待确认 |  |
| 1184 | 留言和 {uploadedCount} 张图片已同步到 Supabase，其中 {compressedCount} 张已自动压缩。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:4035 | uploadedCount；compressedCount | 否 | 待确认 |  |
| 1185 | 留言和 {uploadedCount} 张图片已同步到 Supabase。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:4036 | uploadedCount | 否 | 待确认 |  |
| 1186 | 这句近况和图片已经送出。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:4039 | 无 | 否 | 待确认 |  |
| 1187 | 这句近况已经送出；{uploadedCount} 张图片上传成功${compressedCount ? | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4044 | uploadedCount | 否 | 待确认 |  |
| 1188 | 留言已保存到本地。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4062 | 无 | 否 | 待确认 |  |
| 1189 | 这句近况已经记下。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:4065 | 无 | 否 | 待确认 |  |
| 1190 | 当前没有可编辑的留言。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 comment 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:4078 | 无 | 否 | 待确认 |  |
| 1191 | 只能编辑自己写下的留言。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 comment 区域展示。 | src/stores/wishes.ts:4085 | 无 | 否 | 待确认 |  |
| 1192 | 留言编辑失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 message 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4108 | error.message；message | 否 | 待确认 |  |
| 1193 | 留言已更新。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 message 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4118；src/stores/wishes.ts:4131 | 无 | 否 | 待确认 |  |
| 1194 | 这句留言已经改好了。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 message 区域展示。 | src/stores/wishes.ts:4121；src/stores/wishes.ts:4134 | 无 | 否 | 待确认 |  |
| 1195 | 当前没有可删除的留言。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 comment 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:4146 | 无 | 否 | 待确认 |  |
| 1196 | 只能删除自己写下的留言。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 comment 区域展示。 | src/stores/wishes.ts:4153 | 无 | 否 | 待确认 |  |
| 1197 | 留言删除失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 message 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4169 | error.message；message | 否 | 待确认 |  |
| 1198 | 留言已删除。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 message 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4179；src/stores/wishes.ts:4192 | 无 | 否 | 待确认 |  |
| 1199 | 这句留言已经移走了。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 message 区域展示。 | src/stores/wishes.ts:4182；src/stores/wishes.ts:4195 | 无 | 否 | 待确认 |  |
| 1200 | 当前没有可以回应的手账记录。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 normalizedEmoji 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:4207 | 无 | 否 | 待确认 |  |
| 1201 | 先选一个表情再回应。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 normalizedEmoji 区域展示。 | src/stores/wishes.ts:4214 | 无 | 否 | 待确认 |  |
| 1202 | 同一条记录里，每位成员最多保留 {MAX_THREAD_REACTIONS_PER_MEMBER} 个表情回应。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 existingMemberReactionCount 区域展示。 | src/stores/wishes.ts:4228 | MAX_THREAD_REACTIONS_PER_MEMBER | 否 | 待确认 |  |
| 1203 | 已取消这个表情回应。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 successMessage 区域展示。 | src/stores/wishes.ts:4233 | 无 | 否 | 待确认 |  |
| 1204 | 已留下这个表情回应。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 successMessage 区域展示。 | src/stores/wishes.ts:4233 | 无 | 否 | 待确认 |  |
| 1205 | 表情回应失败：{error.message}。如果你刚更新前端，请先执行新的 Supabase 手账 migration。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 nextMessage 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4250 | error.message；message | 否 | 待确认 |  |
| 1206 | 表情回应失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 nextMessage 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4251 | error.message；message | 否 | 待确认 |  |
| 1207 | 当前详情页只保留 1 张封面图；先删除旧图后再上传新图。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 wish 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4302 | 无 | 否 | 待确认 |  |
| 1208 | 图片上传仅在已连接的 Supabase 云端空间中可用。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 wish 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4307 | 无 | 否 | 待确认 |  |
| 1209 | 当前会话缺少上传身份，请重新登录后再试。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 uploaderId 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4314 | 无 | 否 | 待确认 |  |
| 1210 | 已上传 {uploadedCount} 张图片到 Supabase，其中 {compressedCount} 张已自动压缩。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:4389 | uploadedCount；compressedCount | 否 | 待确认 |  |
| 1211 | 已上传 {uploadedCount} 张图片到 Supabase。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:4390 | uploadedCount | 否 | 待确认 |  |
| 1212 | 已上传 {uploadedCount} 张图片${compressedCount ? | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4395 | uploadedCount | 否 | 待确认 |  |
| 1213 | : ''}；{failedFiles.length} 张失败，{skippedFiles.length} 张因格式或大小限制被跳过。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4395 | failedFiles.length；skippedFiles.length | 否 | 待确认 |  |
| 1214 | 没有图片成功上传。${failedFiles.length ? | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4400 | 无 | 否 | 待确认 |  |
| 1215 | 没有检测到可上传的图片。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:4401 | 无 | 否 | 待确认 |  |
| 1216 | 图片删除仅在已连接的 Supabase 云端空间中可用。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 image 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4417 | 无 | 否 | 待确认 |  |
| 1217 | 云端图片删除失败：{storageError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 image 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4427 | storageError.message；message | 否 | 待确认 |  |
| 1218 | 图片记录删除失败：{rowError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4434 | rowError.message；message | 否 | 待确认 |  |
| 1219 | 图片已从 Supabase 删除。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4439 | 无 | 否 | 待确认 |  |
| 1220 | 已删除 {selectedImages.length} 张图片。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 selectedIdSet 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4459 | selectedImages.length | 否 | 待确认 |  |
| 1221 | 选中的图片都不是当前账号上传，暂时不能删除。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 blockedCount 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4468 | 无 | 否 | 待确认 |  |
| 1222 | 批量删除图片失败：{storageError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 blockedCount 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4480 | storageError.message；message | 否 | 待确认 |  |
| 1223 | 批量删除图片记录失败：{rowError.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4491 | rowError.message；message | 否 | 待确认 |  |
| 1224 | 已删除 {deletableImages.length} 张图片；{blockedCount} 张不是当前账号上传，未删除。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:4497 | deletableImages.length；blockedCount | 否 | 待确认 |  |
| 1225 | 已删除 {deletableImages.length} 张图片。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:4498 | deletableImages.length | 否 | 待确认 |  |
| 1226 | 图片备注最多 240 个字。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 normalizedNote 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4515 | 无 | 否 | 待确认 |  |
| 1227 | 图片备注已保存。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 normalizedNote 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4522 | 无 | 否 | 待确认 |  |
| 1228 | 图片备注已清空。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 normalizedNote 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4522 | 无 | 否 | 待确认 |  |
| 1229 | 图片备注已保存。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 client 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:4535 | 无 | 否 | 待确认 |  |
| 1230 | 图片备注已清空。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 client 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:4535 | 无 | 否 | 待确认 |  |
| 1231 | 当前图片已经是首图。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 imageIndex 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4548 | 无 | 否 | 待确认 |  |
| 1232 | 已将当前图片设为首图。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4561；src/stores/wishes.ts:4579 | 无 | 否 | 待确认 |  |
| 1233 | 首图更新失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4574 | error.message；message | 否 | 待确认 |  |
| 1234 | 图片排序失败：排序结果不完整。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 reorderedImages 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4597 | 无 | 否 | 待确认 |  |
| 1235 | 已更新图片顺序。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 isSameOrder 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4611；src/stores/wishes.ts:4630 | 无 | 否 | 待确认 |  |
| 1236 | 图片排序失败：{error.message} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4625 | error.message；message | 否 | 待确认 |  |
| 1237 | 云端模式下不支持恢复本地示例数据。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 resetToSeed 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4639 | 无 | 否 | 待确认 |  |
| 1238 | 已恢复本地示例数据。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 seedState 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:4651 | 无 | 否 | 待确认 |  |
| 1239 | 未设置日期 | 日期时间工具 | 空态 / 缺省 | 在 日期时间工具 的 formatBeijingDate 区域数据为空、不可用或尚未开始时出现。 | src/utils/datetime.ts:30 | 无 | 否 | 待确认 |  |
| 1240 | 未设置时间 | 日期时间工具 | 空态 / 缺省 | 在 日期时间工具 的 formatBeijingDateTime 区域数据为空、不可用或尚未开始时出现。 | src/utils/datetime.ts:44 | 无 | 否 | 待确认 |  |

## 附录：本地演示 seed/sample 内容（26 条）

这部分属于演示内容，可能在本地演示模式或初始化数据中被看到；不作为系统固定文案处理。

| 序号 | 文案原文 | 页面/模块 | 类型 | 出现位置/情形 | 文件与行号 | 动态变量 | 辅助感知 | 确认状态 | 备注 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | 一起完成一次 10 天长途旅行 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1280 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 2 | 旅行 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1281 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 3 | 先把预算、时间窗和三个候选目的地列出来，再决定路线。 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1284 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 4 | 列出预算和时间窗 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1296 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 5 | 确定 3 个候选目的地 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1303 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 6 | 等行程确认后再订票 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1308 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 7 | 这条在正式版里就是愿望详情下留言的最小形态。 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1316 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 8 | 后面接 Supabase Realtime 时，这里可以直接替换成云端订阅。 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1322 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 9 | 拿下数据分析证书 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1331 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 10 | 成长 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1332 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 11 | 每周完成两个模块，月底做一次模拟题回顾。 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1335 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 12 | 模块 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1342 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 13 | 私密愿望在后续会接 RLS 隔离。 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1348 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 14 | 在夏天前累计完成 12 次慢跑 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1357 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 15 | 健康 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1358 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 16 | 每周至少跑两次，先把出门频率养稳，再慢慢拉长距离。 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1361 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 17 | 这条会在首页里展示成数字型进度愿望。 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1374 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 18 | 把客厅整理成周末电影角 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1383 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 19 | 居家 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1384 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 20 | 先挑一盏落地灯和一条薄毯，再把零散线材、边桌和投影位收顺。 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1387 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 21 | 这条故意不设进度，保留成只写下来的轻愿望。 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1400 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 22 | 学会做三道拿手宴客菜 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1409 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 23 | 生活 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1410 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 24 | 糖醋排骨、烤鸡和一道甜点，先完成菜单和食材清单。 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1413 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 25 | 终于能把这三道菜顺着做完一轮了，下次可以直接请你吃。 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1427 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
| 26 | 这条会保留成软件里默认的“已完成愿望”示例。 | 愿望/奖励/同步状态 | 示例内容附录 | 本地演示模式或初始化示例数据被展示时出现。 | src/stores/wishes.ts:1433 | 无 | 否 | 待确认 | 本地演示 seed/sample 内容，单独附录确认。 |
