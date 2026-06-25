# 系统文案盘点表

生成时间：2026/6/25 12:36:49

范围说明：主表包含应用内所有系统可见或可感知文案，包括标题、按钮、表单占位、空态、toast/状态/错误、校验提示、aria/屏幕阅读器文案与动态系统文案骨架。真实用户输入内容本体不进入主表；动态变量以 `{变量}` 标出。

确认建议：逐条修改“确认状态”和“备注”。如果需要改文案，可直接在备注栏写新文案。

## 主表：系统文案（1167 条）

| 序号 | 文案原文 | 页面/模块 | 类型 | 出现位置/情形 | 文件与行号 | 动态变量 | 辅助感知 | 确认状态 | 备注 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | 首页 | 全局壳层 / 导航 | 标签 / 选项 | 在 全局壳层 / 导航 的 navItems 区域展示。 | src/App.vue:25 | 无 | 否 | 待确认 |  |
| 2 | 清单 | 全局壳层 / 导航 | 标签 / 选项 | 在 全局壳层 / 导航 的 navItems 区域展示。 | src/App.vue:26 | 无 | 否 | 待确认 |  |
| 3 | 写下 | 全局壳层 / 导航 | 标签 / 选项 | 在 全局壳层 / 导航 的 navItems 区域展示。 | src/App.vue:27 | 无 | 否 | 待确认 |  |
| 4 | 回顾 | 全局壳层 / 导航 | 标签 / 选项 | 在 全局壳层 / 导航 的 navItems 区域展示。 | src/App.vue:28 | 无 | 否 | 待确认 |  |
| 5 | 空间 | 全局壳层 / 导航 | 空态 / 缺省 | 在 全局壳层 / 导航 的 navItems 区域数据为空、不可用或尚未开始时出现。 | src/App.vue:29 | 无 | 否 | 待确认 |  |
| 6 | 暂未同步 | 全局壳层 / 导航 | 正文 / 说明 | 在 全局壳层 / 导航 的 syncLabel 区域展示。；另见 空间页状态/文案构造。 | src/App.vue:36；src/composables/useSpaceState.ts:187 | 无 | 否 | 待确认 |  |
| 7 | 失败 | 全局壳层 / 导航 | 状态 / 反馈 / 错误 | 在 全局壳层 / 导航 的 syncLabel 触发成功、失败、加载或状态更新时出现。；另见 空间页状态/文案构造。 | src/App.vue:39；src/composables/useSpaceState.ts:190 | 无 | 否 | 待确认 |  |
| 8 | 同步异常 | 全局壳层 / 导航 | 状态 / 反馈 / 错误 | 在 全局壳层 / 导航 的 syncLabel 触发成功、失败、加载或状态更新时出现。；另见 空间页状态/文案构造。 | src/App.vue:40；src/composables/useSpaceState.ts:191 | 无 | 否 | 待确认 |  |
| 9 | 同步中 | 全局壳层 / 导航 | 正文 / 说明 | 在 全局壳层 / 导航 的 syncLabel 区域展示。；另见 空间页状态/文案构造。 | src/App.vue:44；src/composables/useSpaceState.ts:195 | 无 | 否 | 待确认 |  |
| 10 | 同步正常 | 全局壳层 / 导航 | 正文 / 说明 | 在 全局壳层 / 导航 的 syncLabel 区域展示。；另见 空间页状态/文案构造。 | src/App.vue:47；src/composables/useSpaceState.ts:198 | 无 | 否 | 待确认 |  |
| 11 | 当前成员 | 全局壳层 / 导航 | 正文 / 说明 | 在 全局壳层 / 导航 的 currentMemberName 区域展示。；另见 写下页状态/文案构造。 | src/App.vue:51；src/composables/useComposePreviewState.ts:58 | 无 | 否 | 待确认 |  |
| 12 | {currentMemberName} 已进入共享愿望空间 · {syncLabel} · {authStore.members.length} 位成员 | 全局壳层 / 导航 | 空态 / 缺省 | 在 全局壳层 / 导航 的 currentMemberName 区域数据为空、不可用或尚未开始时出现。 | src/App.vue:54 | currentMemberName；syncLabel；authStore.members.length | 否 | 待确认 |  |
| 13 | {currentMemberName} 当前在本地演示空间 · {syncLabel} · {authStore.members.length} 位成员 | 全局壳层 / 导航 | 空态 / 缺省 | 在 全局壳层 / 导航 的 currentMemberName 区域数据为空、不可用或尚未开始时出现。 | src/App.vue:57 | currentMemberName；syncLabel；authStore.members.length | 否 | 待确认 |  |
| 14 | 两个人的愿望页 | 全局壳层 / 导航 | 正文 / 说明 | 在 全局壳层 / 导航 的 <p> 区域展示。 | src/App.vue:74 | 无 | 否 | 待确认 |  |
| 15 | 人生愿望清单 | 全局壳层 / 导航 | 标题 | 在 全局壳层 / 导航 的 <h1> 区域展示。 | src/App.vue:76 | 无 | 否 | 待确认 |  |
| 16 | 桌面端主导航 | 全局壳层 / 导航 | 可访问性 / aria | 在 全局壳层 / 导航 的 <nav> 区域供屏幕阅读器或辅助技术感知。 | src/App.vue:81 | 无 | 是 | 待确认 |  |
| 17 | 移动端主导航 | 全局壳层 / 导航 | 可访问性 / aria | 在 全局壳层 / 导航 的 <nav> 区域供屏幕阅读器或辅助技术感知。 | src/App.vue:99 | 无 | 是 | 待确认 |  |
| 18 | 金描边大星按 10 颗计，另有 {wishBottleHiddenStarCount} 颗收起 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:196；src/pages/HomeAtelier.vue:269 | wishBottleHiddenStarCount | 否 | 待确认 |  |
| 19 | 金描边大星按 10 颗计 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:198；src/pages/HomeAtelier.vue:271 | 无 | 否 | 待确认 |  |
| 20 | 数字推进和完成步骤都会落成星星 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:199；src/pages/HomeAtelier.vue:272 | 无 | 否 | 待确认 |  |
| 21 | 在路上 | 愿望瓶组件 | 标签 / 选项 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:203；src/pages/HomeAtelier.vue:276 | 无 | 否 | 待确认 |  |
| 22 | 今天还在推进中的愿望 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:204；src/pages/HomeAtelier.vue:277 | 无 | 否 | 待确认 |  |
| 23 | {snapshot.activeWishCount} 个 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:205；src/pages/HomeAtelier.vue:278 | snapshot.activeWishCount | 否 | 待确认 |  |
| 24 | 等待开始 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:205；src/pages/HomeAtelier.vue:278 | 无 | 否 | 待确认 |  |
| 25 | 已点亮 | 愿望瓶组件 | 标签 / 选项 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:208；src/pages/HomeAtelier.vue:281 | 无 | 否 | 待确认 |  |
| 26 | {displayStarCount} 颗 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:210；src/pages/HomeAtelier.vue:283 | displayStarCount | 否 | 待确认 |  |
| 27 | 等待第一颗 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 starNote 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:210；src/pages/HomeAtelier.vue:283 | 无 | 否 | 待确认 |  |
| 28 | 最近更新 | 愿望瓶组件 | 标签 / 选项 | 在 愿望瓶组件 的 starNote 区域展示。；另见 清单页状态/文案构造。；另见 首页。 | src/components/WishBottlePreviewCard.vue:213；src/composables/useListWishBoardState.ts:280；src/pages/HomeAtelier.vue:286 | 无 | 否 | 待确认 |  |
| 29 | {latestMoment.actorLabel} 刚留下了一笔新记录 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 页面/模块渲染或状态计算时 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:215；src/pages/HomeAtelier.vue:288 | latestMoment.actorLabel | 否 | 待确认 |  |
| 30 | 下一次推进会留在这里 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 页面/模块渲染或状态计算时 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:216；src/pages/HomeAtelier.vue:289 | 无 | 否 | 待确认 |  |
| 31 | 等待更新 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 页面/模块渲染或状态计算时 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:217；src/pages/HomeAtelier.vue:290 | 无 | 否 | 待确认 |  |
| 32 | 下一条愿望会住进来 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 displayStarCount 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:226；src/pages/HomeAtelier.vue:299 | 无 | 否 | 待确认 |  |
| 33 | 第一颗星星会在这里亮起 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 displayStarCount 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:226；src/pages/HomeAtelier.vue:299 | 无 | 否 | 待确认 |  |
| 34 | 先从一件小事开始 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 displayStarCount 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:226；src/pages/HomeAtelier.vue:299 | 无 | 否 | 待确认 |  |
| 35 | {snapshot.activeWishCount} 个愿望在路上 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 chips 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:233；src/pages/HomeAtelier.vue:306 | snapshot.activeWishCount | 否 | 待确认 |  |
| 36 | 已点亮 {displayStarCount} 颗星星 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 chips 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:234；src/pages/HomeAtelier.vue:307 | displayStarCount | 否 | 待确认 |  |
| 37 | 第一颗星星还在路上 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 chips 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:234；src/pages/HomeAtelier.vue:307 | 无 | 否 | 待确认 |  |
| 38 | {approachingWishCount} 条愿望正在靠近 | 愿望瓶组件 | 状态 / 反馈 / 错误 | 在 愿望瓶组件 的 chips 触发成功、失败、加载或状态更新时出现。；另见 首页。 | src/components/WishBottlePreviewCard.vue:235；src/pages/HomeAtelier.vue:308 | approachingWishCount | 否 | 待确认 |  |
| 39 | 金描边大星 = 10 颗 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 chips 区域展示。 | src/components/WishBottlePreviewCard.vue:239 | 无 | 否 | 待确认 |  |
| 40 | 另有 {wishBottleHiddenStarCount} 颗星星收起 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 chips 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:243；src/pages/HomeAtelier.vue:312 | wishBottleHiddenStarCount | 否 | 待确认 |  |
| 41 | 一起 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 getThreadActorLabel 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:251；src/pages/HomeAtelier.vue:474 | 无 | 否 | 待确认 |  |
| 42 | 我们 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 getThreadActorLabel 区域展示。；另见 写下页状态/文案构造。；另见 详情页状态/文案构造。；另见 首页。；另见 清单页。 | src/components/WishBottlePreviewCard.vue:254；src/composables/useComposePreviewState.ts:54；src/composables/useWishDetailPageState.ts:16；src/pages/HomeAtelier.vue:171；src/pages/HomeAtelier.vue:477；src/pages/List.vue:36 | 无 | 否 | 待确认 |  |
| 43 | 愿望瓶正在等新的愿望住进来 | 愿望瓶组件 | 状态 / 反馈 / 错误 | 在 愿望瓶组件 的 displayStarCount 触发成功、失败、加载或状态更新时出现。；另见 首页。 | src/components/WishBottlePreviewCard.vue:282；src/pages/HomeAtelier.vue:401 | 无 | 否 | 待确认 |  |
| 44 | 愿望瓶正在等第一颗星星落下来 | 愿望瓶组件 | 状态 / 反馈 / 错误 | 在 愿望瓶组件 的 displayStarCount 触发成功、失败、加载或状态更新时出现。；另见 首页。 | src/components/WishBottlePreviewCard.vue:286；src/pages/HomeAtelier.vue:405 | 无 | 否 | 待确认 |  |
| 45 | 愿望瓶已经亮起 {displayStarCount} 颗星星 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 displayStarCount 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:289；src/pages/HomeAtelier.vue:408 | displayStarCount | 否 | 待确认 |  |
| 46 | 等下一条愿望写下后，这里会先亮起来。 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 snapshot 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:296；src/pages/HomeAtelier.vue:415 | 无 | 否 | 待确认 |  |
| 47 | {snapshot.activeWishCount} 个愿望还在路上。 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 snapshot 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:299；src/pages/HomeAtelier.vue:418 | snapshot.activeWishCount | 否 | 待确认 |  |
| 48 | 下一次推进会让这里亮起来。 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 approachingWishCount 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:308；src/pages/HomeAtelier.vue:427 | 无 | 否 | 待确认 |  |
| 49 | {approachingWishCount} 个愿望正在靠近。 | 愿望瓶组件 | 状态 / 反馈 / 错误 | 在 愿望瓶组件 的 approachingWishCount 触发成功、失败、加载或状态更新时出现。；另见 首页。 | src/components/WishBottlePreviewCard.vue:311；src/pages/HomeAtelier.vue:430 | approachingWishCount | 否 | 待确认 |  |
| 50 | 时间待同步 | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 now 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:352；src/pages/HomeAtelier.vue:613 | 无 | 否 | 待确认 |  |
| 51 | 今天 {target.hour}:{target.minute} | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 now 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:356；src/pages/HomeAtelier.vue:617 | target.hour；target.minute | 否 | 待确认 |  |
| 52 | {target.month}月{target.day}日 {target.hour}:{target.minute} | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 now 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:360；src/pages/HomeAtelier.vue:621 | target.month；target.day；target.hour；target.minute | 否 | 待确认 |  |
| 53 | {target.year}年{target.month}月{target.day}日 {target.hour}:{target.minute} | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 now 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:363；src/pages/HomeAtelier.vue:624 | target.year；target.month；target.day；target.hour；target.minute | 否 | 待确认 |  |
| 54 | 愿望瓶 Wish Bottle | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 <p> 区域展示。 | src/components/WishBottlePreviewCard.vue:381 | 无 | 否 | 待确认 |  |
| 55 | 手工细丝带软木塞玻璃愿望瓶 | 愿望瓶组件 | 可访问性 / aria | 在 愿望瓶组件 的 <svg> 区域供屏幕阅读器或辅助技术感知。；另见 首页。 | src/components/WishBottlePreviewCard.vue:395；src/pages/HomeAtelier.vue:692 | 无 | 是 | 待确认 |  |
| 56 | userSpaceOnUse | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 <linearGradient> 区域展示。；另见 首页。 | src/components/WishBottlePreviewCard.vue:397；src/components/WishBottlePreviewCard.vue:404；src/components/WishBottlePreviewCard.vue:410；src/components/WishBottlePreviewCard.vue:415；src/components/WishBottlePreviewCard.vue:420；src/components/WishBottlePreviewCard.vue:430；src/components/WishBottlePreviewCard.vue:435；src/components/WishBottlePreviewCard.vue:440；src/pages/HomeAtelier.vue:694；src/pages/HomeAtelier.vue:701；src/pages/HomeAtelier.vue:707；src/pages/HomeAtelier.vue:712；src/pages/HomeAtelier.vue:717；src/pages/HomeAtelier.vue:727；src/pages/HomeAtelier.vue:732；src/pages/HomeAtelier.vue:737 | 无 | 否 | 待确认 |  |
| 57 | 现在的愿望瓶 Now in Bottle | 愿望瓶组件 | 正文 / 说明 | 在 愿望瓶组件 的 <p> 区域展示。 | src/components/WishBottlePreviewCard.vue:581 | 无 | 否 | 待确认 |  |
| 58 | 最想先靠近 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 priorityOptions 区域展示。 | src/composables/useComposePreviewState.ts:7 | 无 | 否 | 待确认 |  |
| 59 | 想尽快把它放到最近会去碰的一层。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 priorityOptions 区域展示。 | src/composables/useComposePreviewState.ts:8 | 无 | 否 | 待确认 |  |
| 60 | 稳稳往前 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 priorityOptions 区域展示。 | src/composables/useComposePreviewState.ts:12 | 无 | 否 | 待确认 |  |
| 61 | 不着急，但希望它一直在往前走。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 priorityOptions 区域展示。 | src/composables/useComposePreviewState.ts:13 | 无 | 否 | 待确认 |  |
| 62 | 先替它留位 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 priorityOptions 区域展示。 | src/composables/useComposePreviewState.ts:17 | 无 | 否 | 待确认 |  |
| 63 | 先认真放进生活里，之后再慢慢把它提近。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 priorityOptions 区域展示。 | src/composables/useComposePreviewState.ts:18 | 无 | 否 | 待确认 |  |
| 64 | 先只写下来 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 progressOptions 区域展示。 | src/composables/useComposePreviewState.ts:25 | 无 | 否 | 待确认 |  |
| 65 | 先把愿望放稳，进度以后再补。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressOptions 区域展示。 | src/composables/useComposePreviewState.ts:26 | 无 | 否 | 待确认 |  |
| 66 | 按数字靠近 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 progressOptions 区域展示。 | src/composables/useComposePreviewState.ts:30 | 无 | 否 | 待确认 |  |
| 67 | 适合次数、公里、章节这类能慢慢累计的目标。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressOptions 区域展示。 | src/composables/useComposePreviewState.ts:31 | 无 | 否 | 待确认 |  |
| 68 | 按步骤慢慢走 | 写下页状态/文案构造 | 标签 / 选项 | 在 写下页状态/文案构造 的 progressOptions 区域展示。 | src/composables/useComposePreviewState.ts:35 | 无 | 否 | 待确认 |  |
| 69 | 先拆成几步，再一小步一小步走完。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressOptions 区域展示。 | src/composables/useComposePreviewState.ts:36 | 无 | 否 | 待确认 |  |
| 70 | {formatStarCoinAmount} + {formatStarCoinAmount} = {formatStarCoinAmount} 星星币 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 total 区域展示。 | src/composables/useComposePreviewState.ts:97 | formatStarCoinAmount | 否 | 待确认 |  |
| 71 | 这条愿望还在等名字 | 写下页状态/文案构造 | 标题 | 在 写下页状态/文案构造 的 draftTitlePreview 区域展示。 | src/composables/useComposePreviewState.ts:100 | 无 | 否 | 待确认 |  |
| 72 | 等你留下一句为什么想实现，它才更像会被回看的那一页。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 draftNotePreview 区域展示。 | src/composables/useComposePreviewState.ts:103 | 无 | 否 | 待确认 |  |
| 73 | 把这条愿望整理成它现在最像的样子 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 composerHeadline 区域展示。 | src/composables/useComposePreviewState.ts:107 | 无 | 否 | 待确认 |  |
| 74 | 把一个愿望认真写进今天 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 composerHeadline 区域展示。 | src/composables/useComposePreviewState.ts:107 | 无 | 否 | 待确认 |  |
| 75 | 这一页只整理基本信息，让标题、范围和进度方式重新对齐。 | 写下页状态/文案构造 | 标题 | 在 写下页状态/文案构造 的 composerLead 区域展示。 | src/composables/useComposePreviewState.ts:111 | 无 | 否 | 待确认 |  |
| 76 | 不用一次写满，先写名字、方向和一点想实现它的心情。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 composerLead 区域展示。 | src/composables/useComposePreviewState.ts:114 | 无 | 否 | 待确认 |  |
| 77 | 先等一个目标数 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressSummary 区域展示。 | src/composables/useComposePreviewState.ts:119 | 无 | 否 | 待确认 |  |
| 78 | 现在 {draft.progressCurrent}/{draft.progressTarget} {unitText}，每 {unitText} {formatStarCoinAmount} 星星币 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 unitText 区域展示。 | src/composables/useComposePreviewState.ts:123 | draft.progressCurrent；draft.progressTarget；unitText；formatStarCoinAmount | 否 | 待确认 |  |
| 79 | 步骤继续留在详情页 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 unitText 区域展示。 | src/composables/useComposePreviewState.ts:128 | 无 | 否 | 待确认 |  |
| 80 | 先拆成 {initialStepCount} 步，共 {formatStarCoinAmount} 星星币 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 unitText 区域展示。 | src/composables/useComposePreviewState.ts:131 | initialStepCount；formatStarCoinAmount | 否 | 待确认 |  |
| 81 | 还没写起步步骤 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 unitText 区域展示。 | src/composables/useComposePreviewState.ts:131 | 无 | 否 | 待确认 |  |
| 82 | 先只写愿望本身 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 unitText 区域展示。 | src/composables/useComposePreviewState.ts:134 | 无 | 否 | 待确认 |  |
| 83 | 它会按数字记下每次靠近，后面还能继续改。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressDetail 区域展示。 | src/composables/useComposePreviewState.ts:139 | 无 | 否 | 待确认 |  |
| 84 | 先给它一个大于 0 的目标数。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressDetail 区域展示。 | src/composables/useComposePreviewState.ts:140 | 无 | 否 | 待确认 |  |
| 85 | 这条愿望已经有步骤区了，这里只整理基本信息。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressDetail 区域展示。 | src/composables/useComposePreviewState.ts:145 | 无 | 否 | 待确认 |  |
| 86 | 先写第一批步骤，写下后再去详情页补全和勾选。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressDetail 区域展示。 | src/composables/useComposePreviewState.ts:146 | 无 | 否 | 待确认 |  |
| 87 | 先把愿望本身写稳，进度以后再补。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 progressDetail 区域展示。 | src/composables/useComposePreviewState.ts:149 | 无 | 否 | 待确认 |  |
| 88 | 还没定下日子 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 dueTimestamp 区域展示。 | src/composables/useComposePreviewState.ts:204 | 无 | 否 | 待确认 |  |
| 89 | 已经过了 {Math.abs} 天 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 dayDifference 区域展示。 | src/composables/useComposePreviewState.ts:212 | Math.abs | 否 | 待确认 |  |
| 90 | 就定在今天 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 dayDifference 区域展示。 | src/composables/useComposePreviewState.ts:216 | 无 | 否 | 待确认 |  |
| 91 | 还有 1 天 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 dayDifference 区域展示。 | src/composables/useComposePreviewState.ts:220 | 无 | 否 | 待确认 |  |
| 92 | 还有 {dayDifference} 天 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 dayDifference 区域展示。 | src/composables/useComposePreviewState.ts:223 | dayDifference | 否 | 待确认 |  |
| 93 | 旅行 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 categorySuggestions 区域展示。；另见 愿望/奖励/同步状态。 | src/composables/useComposeWishForm.ts:33；src/stores/wishes.ts:633 | 无 | 否 | 待确认 |  |
| 94 | 生活 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 categorySuggestions 区域展示。；另见 愿望/奖励/同步状态。 | src/composables/useComposeWishForm.ts:33；src/pages/ComposeAtelier.vue:307；src/stores/wishes.ts:770 | 无 | 否 | 待确认 |  |
| 95 | 成长 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 categorySuggestions 区域展示。；另见 愿望/奖励/同步状态。 | src/composables/useComposeWishForm.ts:33；src/stores/wishes.ts:686 | 无 | 否 | 待确认 |  |
| 96 | 健康 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 categorySuggestions 区域展示。；另见 愿望/奖励/同步状态。 | src/composables/useComposeWishForm.ts:33；src/stores/wishes.ts:714 | 无 | 否 | 待确认 |  |
| 97 | 纪念 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 categorySuggestions 区域展示。 | src/composables/useComposeWishForm.ts:33 | 无 | 否 | 待确认 |  |
| 98 | 先写下这条愿望是什么。 | 写下页状态/文案构造 | 状态 / 反馈 / 错误 | 在 写下页状态/文案构造 的 submitWish 触发成功、失败、加载或状态更新时出现。 | src/composables/useComposeWishForm.ts:136 | 无 | 否 | 待确认 |  |
| 99 | 如果想按数字记进度，先写一个大于 0 的目标值。 | 写下页状态/文案构造 | 状态 / 反馈 / 错误 | 在 写下页状态/文案构造 的 submitWish 触发成功、失败、加载或状态更新时出现。 | src/composables/useComposeWishForm.ts:142 | 无 | 否 | 待确认 |  |
| 100 | 最终完成额外星星币不能是负数。 | 写下页状态/文案构造 | 状态 / 反馈 / 错误 | 在 写下页状态/文案构造 的 submitWish 触发成功、失败、加载或状态更新时出现。 | src/composables/useComposeWishForm.ts:148 | 无 | 否 | 待确认 |  |
| 101 | 按数字记进度时，每单位星星币价格必须大于 0。 | 写下页状态/文案构造 | 状态 / 反馈 / 错误 | 在 写下页状态/文案构造 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/composables/useComposeWishForm.ts:155 | 无 | 否 | 待确认 |  |
| 102 | 按步骤走的时候，至少先写一个起步步骤。 | 写下页状态/文案构造 | 状态 / 反馈 / 错误 | 在 写下页状态/文案构造 的 initialSteps 触发成功、失败、加载或状态更新时出现。 | src/composables/useComposeWishForm.ts:172 | 无 | 否 | 待确认 |  |
| 103 | 每个步骤都需要写一个大于 0 的星星币价格。 | 写下页状态/文案构造 | 状态 / 反馈 / 错误 | 在 写下页状态/文案构造 的 initialSteps 触发成功、失败、加载或状态更新时出现。 | src/composables/useComposeWishForm.ts:178 | 无 | 否 | 待确认 |  |
| 104 | 这条愿望已经按现在的样子改好了。 | 写下页状态/文案构造 | 状态 / 反馈 / 错误 | 在 写下页状态/文案构造 的 initialSteps 触发成功、失败、加载或状态更新时出现。 | src/composables/useComposeWishForm.ts:187 | 无 | 否 | 待确认 |  |
| 105 | 这个愿望暂时还没写进去。 | 写下页状态/文案构造 | 状态 / 反馈 / 错误 | 在 写下页状态/文案构造 的 createdWishId 触发成功、失败、加载或状态更新时出现。 | src/composables/useComposeWishForm.ts:196 | 无 | 否 | 待确认 |  |
| 106 | 这条愿望和 {initialSteps.length} 个起步步骤已经放进清单了。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 createdWishId 区域展示。 | src/composables/useComposeWishForm.ts:202 | initialSteps.length | 否 | 待确认 |  |
| 107 | 这条愿望已经放进清单了，步骤后面还可以慢慢补。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 createdWishId 区域展示。 | src/composables/useComposeWishForm.ts:202 | 无 | 否 | 待确认 |  |
| 108 | 这条愿望已经放进清单了。 | 写下页状态/文案构造 | 正文 / 说明 | 在 写下页状态/文案构造 的 createdWishId 区域展示。 | src/composables/useComposeWishForm.ts:203 | 无 | 否 | 待确认 |  |
| 109 | 很想靠近 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 priorityLabels 区域展示。；另见 详情页。 | src/composables/useListWishBoardState.ts:9；src/pages/WishDetailAtelier.vue:9 | 无 | 否 | 待确认 |  |
| 110 | 慢慢靠近 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 priorityLabels 区域展示。；另见 详情页。 | src/composables/useListWishBoardState.ts:10；src/pages/WishDetailAtelier.vue:10 | 无 | 否 | 待确认 |  |
| 111 | 先放在这里 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 priorityLabels 区域展示。；另见 详情页。 | src/composables/useListWishBoardState.ts:11；src/pages/WishDetailAtelier.vue:11 | 无 | 否 | 待确认 |  |
| 112 | 未命名成员 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 getMemberName 区域展示。；另见 回顾页状态/文案构造。；另见 空间页状态/文案构造。；另见 详情页状态/文案构造。；另见 愿望/奖励/同步状态。 | src/composables/useListWishBoardState.ts:129；src/composables/useReviewPageState.ts:215；src/composables/useSpaceState.ts:133；src/composables/useWishDetailState.ts:222；src/stores/wishes.ts:1650 | 无 | 否 | 待确认 |  |
| 113 | 没有设定日期，慢慢来 | 清单页状态/文案构造 | 空态 / 缺省 | 在 清单页状态/文案构造 的 dueTimestamp 区域数据为空、不可用或尚未开始时出现。；另见 首页。 | src/composables/useListWishBoardState.ts:160；src/pages/HomeAtelier.vue:342 | 无 | 否 | 待确认 |  |
| 114 | 这个愿望已经在这里等了我们 {Math.abs} 天。 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 dayDifference 区域展示。 | src/composables/useListWishBoardState.ts:168 | Math.abs | 否 | 待确认 |  |
| 115 | 就是今天 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 dayDifference 区域展示。；另见 首页。 | src/composables/useListWishBoardState.ts:172；src/pages/HomeAtelier.vue:354 | 无 | 否 | 待确认 |  |
| 116 | 明天就到约定的日子 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 dayDifference 区域展示。；另见 首页。 | src/composables/useListWishBoardState.ts:176；src/pages/HomeAtelier.vue:358 | 无 | 否 | 待确认 |  |
| 117 | 还剩 {dayDifference} 天 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 dayDifference 区域展示。 | src/composables/useListWishBoardState.ts:179 | dayDifference | 否 | 待确认 |  |
| 118 | 已经实现 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 getWishMood 区域展示。 | src/composables/useListWishBoardState.ts:188；src/pages/List.vue:26 | 无 | 否 | 待确认 |  |
| 119 | 快要靠近了 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 daysLeft 区域展示。 | src/composables/useListWishBoardState.ts:199 | 无 | 否 | 待确认 |  |
| 120 | 已经留下痕迹 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 daysLeft 区域展示。 | src/composables/useListWishBoardState.ts:204 | 无 | 否 | 待确认 |  |
| 121 | 正在路上 | 清单页状态/文案构造 | 状态 / 反馈 / 错误 | 在 清单页状态/文案构造 的 daysLeft 触发成功、失败、加载或状态更新时出现。 | src/composables/useListWishBoardState.ts:207 | 无 | 否 | 待确认 |  |
| 122 | {getWishProgress}% | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 getWishProgressPercentLabel 区域展示。 | src/composables/useListWishBoardState.ts:215 | getWishProgress | 否 | 待确认 |  |
| 123 | 今天加入 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 days 区域展示。 | src/composables/useListWishBoardState.ts:220 | 无 | 否 | 待确认 |  |
| 124 | 存在 {days} 天 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 days 区域展示。 | src/composables/useListWishBoardState.ts:220 | days | 否 | 待确认 |  |
| 125 | 今天更新 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 days 区域展示。 | src/composables/useListWishBoardState.ts:227 | 无 | 否 | 待确认 |  |
| 126 | 昨天更新 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 days 区域展示。 | src/composables/useListWishBoardState.ts:231 | 无 | 否 | 待确认 |  |
| 127 | {days} 天前更新 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 days 区域展示。 | src/composables/useListWishBoardState.ts:234 | days | 否 | 待确认 |  |
| 128 | 还可拿 {formatStarCoinAmount} 星星币 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 amount 区域展示。 | src/composables/useListWishBoardState.ts:239 | formatStarCoinAmount | 否 | 待确认 |  |
| 129 | 星星币已拿完 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 amount 区域展示。 | src/composables/useListWishBoardState.ts:239 | 无 | 否 | 待确认 |  |
| 130 | 已获得 {formatStarCoinAmount} 星星币 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 getWishEarnedStarCoinLabel 区域展示。 | src/composables/useListWishBoardState.ts:243 | formatStarCoinAmount | 否 | 待确认 |  |
| 131 | 当前进度 | 清单页状态/文案构造 | 标签 / 选项 | 在 清单页状态/文案构造 的 progress 区域展示。 | src/composables/useListWishBoardState.ts:251 | 无 | 否 | 待确认 |  |
| 132 | 星星币 | 清单页状态/文案构造 | 标签 / 选项 | 在 清单页状态/文案构造 的 progress 区域展示。；另见 空间页状态/文案构造。；另见 详情页状态/文案构造。 | src/composables/useListWishBoardState.ts:261；src/composables/useSpacePageState.ts:89；src/composables/useWishDetailPageState.ts:38 | 无 | 否 | 待确认 |  |
| 133 | 存在时间 | 清单页状态/文案构造 | 标签 / 选项 | 在 清单页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useListWishBoardState.ts:271 | 无 | 否 | 待确认 |  |
| 134 | 写下于 {formatDateLabel} | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useListWishBoardState.ts:272 | formatDateLabel | 否 | 待确认 |  |
| 135 | 已经可以确认完成 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useListWishBoardState.ts:281 | 无 | 否 | 待确认 |  |
| 136 | 数字上已经走满了，等你亲手把它收进回忆里。 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 progress 区域展示。 | src/composables/useListWishBoardState.ts:293 | 无 | 否 | 待确认 |  |
| 137 | 每次往前走一点点，这里都会记住。 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 progress 区域展示。 | src/composables/useListWishBoardState.ts:296 | 无 | 否 | 待确认 |  |
| 138 | 还没有拆成小步骤，可以去详情页慢慢补。 | 清单页状态/文案构造 | 空态 / 缺省 | 在 清单页状态/文案构造 的 progress 区域数据为空、不可用或尚未开始时出现。 | src/composables/useListWishBoardState.ts:301 | 无 | 否 | 待确认 |  |
| 139 | 这些小步骤都走完了，只差你轻轻确认，把它收进已实现。 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 progress 区域展示。 | src/composables/useListWishBoardState.ts:305 | 无 | 否 | 待确认 |  |
| 140 | 下一步已经在路上。 | 清单页状态/文案构造 | 标题 | 在 清单页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useListWishBoardState.ts:308 | 无 | 否 | 待确认 |  |
| 141 | 它先被认真写下来了，什么时候开始往前都可以。 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useListWishBoardState.ts:312 | 无 | 否 | 待确认 |  |
| 142 | 先把它留在清单里，也是一种认真开始。 | 清单页状态/文案构造 | 正文 / 说明 | 在 清单页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useListWishBoardState.ts:313 | 无 | 否 | 待确认 |  |
| 143 | 正在把这一期翻到最新 | 回顾页状态/文案构造 | 状态 / 反馈 / 错误 | 在 回顾页状态/文案构造 的 reviewSyncState 触发成功、失败、加载或状态更新时出现。 | src/composables/useReviewPageState.ts:44 | 无 | 否 | 待确认 |  |
| 144 | 同步暂时有点慢 | 回顾页状态/文案构造 | 标题 | 在 回顾页状态/文案构造 的 reviewSyncState 区域展示。 | src/composables/useReviewPageState.ts:52 | 无 | 否 | 待确认 |  |
| 145 | 卷首摘要 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHighlights 区域展示。 | src/composables/useReviewPageState.ts:63 | 无 | 否 | 待确认 |  |
| 146 | 已经写下 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 reviewHighlights 区域展示。 | src/composables/useReviewPageState.ts:66 | 无 | 否 | 待确认 |  |
| 147 | {wishStore.stats.active} 个还在继续往前走 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHighlights 区域展示。 | src/composables/useReviewPageState.ts:67 | wishStore.stats.active | 否 | 待确认 |  |
| 148 | 这一期 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHighlights 区域展示。 | src/composables/useReviewPageState.ts:72；src/pages/Stats.vue:222 | 无 | 否 | 待确认 |  |
| 149 | 还在推进 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 reviewHighlights 区域展示。 | src/composables/useReviewPageState.ts:75 | 无 | 否 | 待确认 |  |
| 150 | 最近更新：{latestActiveWish.title} | 回顾页状态/文案构造 | 标题 | 在 回顾页状态/文案构造 的 reviewHighlights 区域展示。 | src/composables/useReviewPageState.ts:76 | latestActiveWish.title；title | 否 | 待确认 |  |
| 151 | 写下新愿望后会先出现在这里 | 回顾页状态/文案构造 | 标题 | 在 回顾页状态/文案构造 的 reviewHighlights 区域展示。 | src/composables/useReviewPageState.ts:76 | 无 | 否 | 待确认 |  |
| 152 | 已经完成 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:81 | 无 | 否 | 待确认 |  |
| 153 | 收进册页 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:84 | 无 | 否 | 待确认 |  |
| 154 | 这些愿望已经可以慢慢翻回来看 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:85 | 无 | 否 | 待确认 |  |
| 155 | 完成第一条后，这里会亮起来 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:85 | 无 | 否 | 待确认 |  |
| 156 | 照片记忆 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:90 | 无 | 否 | 待确认 |  |
| 157 | 存下的图片 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:93 | 无 | 否 | 待确认 |  |
| 158 | 这段时间已经开始有能翻出来看的画面了 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:94 | 无 | 否 | 待确认 |  |
| 159 | 还在等第一张照片把这一页翻开 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:94 | 无 | 否 | 待确认 |  |
| 160 | {wishStore.stats.totalImages} 张 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:95 | wishStore.stats.totalImages | 否 | 待确认 |  |
| 161 | 先替未来翻开第一期月刊 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHeroTitle 区域展示。 | src/composables/useReviewPageState.ts:101 | 无 | 否 | 待确认 |  |
| 162 | 把正在发生的靠近翻成这一期月刊 | 回顾页状态/文案构造 | 状态 / 反馈 / 错误 | 在 回顾页状态/文案构造 的 reviewHeroTitle 触发成功、失败、加载或状态更新时出现。 | src/composables/useReviewPageState.ts:105 | 无 | 否 | 待确认 |  |
| 163 | 把一起走过的日子翻成一册册月刊 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHeroTitle 区域展示。 | src/composables/useReviewPageState.ts:108 | 无 | 否 | 待确认 |  |
| 164 | 这里以后不会只是统计，它会慢慢收住你们写下、推进、回应和完成的全部痕迹。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHeroLead 区域展示。 | src/composables/useReviewPageState.ts:112 | 无 | 否 | 待确认 |  |
| 165 | 回顾页不负责催促，它只把已经发生过的靠近、回应和完成整理成一册册可以慢慢翻看的记录。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHeroLead 区域展示。 | src/composables/useReviewPageState.ts:115 | 无 | 否 | 待确认 |  |
| 166 | 已经完成的 {wishStore.stats.done} 个愿望会先在这里安静排好，提醒你们这段时间并没有白白过去。 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 reviewHeroAside 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:119 | wishStore.stats.done | 否 | 待确认 |  |
| 167 | 现在先翻看也好，回清单继续推进也好，这一页都会慢慢替你们把过程接住。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewHeroAside 区域展示。 | src/composables/useReviewPageState.ts:122 | 无 | 否 | 待确认 |  |
| 168 | {liveMonthlyThreads.length} 条 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:127；src/pages/Stats.vue:226 | liveMonthlyThreads.length | 否 | 待确认 |  |
| 169 | 这一期正在写 | 回顾页状态/文案构造 | 状态 / 反馈 / 错误 | 在 回顾页状态/文案构造 的 reviewTabOptions 触发成功、失败、加载或状态更新时出现。 | src/composables/useReviewPageState.ts:128 | 无 | 否 | 待确认 |  |
| 170 | 这一期 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:129 | 无 | 否 | 待确认 |  |
| 171 | {currentMonthLabel} 里正在发生的推进、留言和回应，会先留在这一栏。 | 回顾页状态/文案构造 | 状态 / 反馈 / 错误 | 在 回顾页状态/文案构造 的 reviewTabOptions 触发成功、失败、加载或状态更新时出现。 | src/composables/useReviewPageState.ts:130 | currentMonthLabel | 否 | 待确认 |  |
| 172 | {completedWishJournals.length} 本 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:134；src/pages/Stats.vue:150 | completedWishJournals.length | 否 | 待确认 |  |
| 173 | 已经定稿 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:135 | 无 | 否 | 待确认 |  |
| 174 | 完成册页 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:136 | 无 | 否 | 待确认 |  |
| 175 | 已经走完整条路的愿望，会在这里留下更完整的册页。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:137 | 无 | 否 | 待确认 |  |
| 176 | {monthlySnapshots.length} 本 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:141；src/pages/Stats.vue:300 | monthlySnapshots.length | 否 | 待确认 |  |
| 177 | 已经封存 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewTabOptions 区域展示。 | src/composables/useReviewPageState.ts:142 | 无 | 否 | 待确认 |  |
| 178 | 已封存月刊 | 回顾页状态/文案构造 | 标签 / 选项 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:143 | 无 | 否 | 待确认 |  |
| 179 | 月份过去之后，它会在这里变成不再变化的固定月刊。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useReviewPageState.ts:144 | 无 | 否 | 待确认 |  |
| 180 | 这一册还没有写进愿望。先从一个很小的开始，让未来先有一个可以靠近的方向。 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 monthlyNote 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:154 | 无 | 否 | 待确认 |  |
| 181 | 这段时间，你们已经写下了 {wishStore.stats.total} 个愿望。虽然还没有哪一条正式完成，但方向已经在那里，先挑一个最容易开始的，在这个周末做一点点就很好。 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 monthlyNote 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:158 | wishStore.stats.total | 否 | 待确认 |  |
| 182 | 这段时间，你们已经把 {wishStore.stats.done} 个愿望收进回忆里，还有 {wishStore.stats.active} 个愿望正在路上。慢慢来，重要的事并没有被日常淹没。 | 回顾页状态/文案构造 | 状态 / 反馈 / 错误 | 在 回顾页状态/文案构造 的 monthlyNote 触发成功、失败、加载或状态更新时出现。 | src/composables/useReviewPageState.ts:161 | wishStore.stats.done；wishStore.stats.active | 否 | 待确认 |  |
| 183 | 你这边 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewMembers 区域展示。 | src/composables/useReviewPageState.ts:167 | 无 | 否 | 待确认 |  |
| 184 | 对方这边 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 reviewMembers 区域展示。 | src/composables/useReviewPageState.ts:167 | 无 | 否 | 待确认 |  |
| 185 | {completedCount} 条完成愿望 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:187 | completedCount | 否 | 待确认 |  |
| 186 | 已经有 {completedCount} 条愿望走完整条路。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:189 | completedCount | 否 | 待确认 |  |
| 187 | 这一栏还在等第一条完成愿望。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:190 | 无 | 否 | 待确认 |  |
| 188 | {liveCount} 条本月记录 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:192 | liveCount | 否 | 待确认 |  |
| 189 | 这期已经留下 {liveCount} 条近况。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:194 | liveCount | 否 | 待确认 |  |
| 190 | 这期还没有落下新的近况。 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 latestLiveThread 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:195 | 无 | 否 | 待确认 |  |
| 191 | {snapshotCount} 条封存片段 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:197 | snapshotCount | 否 | 待确认 |  |
| 192 | 已经有 {snapshotCount} 条片段被收进月刊。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 latestLiveThread 区域展示。 | src/composables/useReviewPageState.ts:199 | snapshotCount | 否 | 待确认 |  |
| 193 | 这边还没有被封进月刊的片段。 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:200 | 无 | 否 | 待确认 |  |
| 194 | 本月还没有新的动作 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:208 | 无 | 否 | 待确认 |  |
| 195 | 系统 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getThreadActorName 区域展示。；另见 详情页状态/文案构造。；另见 愿望/奖励/同步状态。 | src/composables/useReviewPageState.ts:227；src/composables/useReviewPageState.ts:353；src/composables/useWishDetailState.ts:226；src/stores/wishes.ts:1647 | 无 | 否 | 待确认 |  |
| 196 | 留言 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getThreadEventLabel 区域展示。；另见 详情页状态/文案构造。；另见 愿望/奖励/同步状态。 | src/composables/useReviewPageState.ts:232；src/composables/useWishDetailState.ts:238；src/pages/Stats.vue:328；src/stores/wishes.ts:1908 | 无 | 否 | 待确认 |  |
| 197 | 写下愿望 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getThreadEventLabel 区域展示。 | src/composables/useReviewPageState.ts:236 | 无 | 否 | 待确认 |  |
| 198 | 步骤完成 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getThreadEventLabel 区域展示。；另见 详情页状态/文案构造。 | src/composables/useReviewPageState.ts:240；src/composables/useWishDetailState.ts:246 | 无 | 否 | 待确认 |  |
| 199 | 愿望完成 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getThreadEventLabel 区域展示。 | src/composables/useReviewPageState.ts:244 | 无 | 否 | 待确认 |  |
| 200 | 兑换奖励 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getThreadEventLabel 区域展示。；另见 空间页状态/文案构造。；另见 详情页状态/文案构造。 | src/composables/useReviewPageState.ts:248；src/composables/useSpaceState.ts:701；src/composables/useWishDetailState.ts:254 | 无 | 否 | 待确认 |  |
| 201 | 系统记录 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。；另见 详情页。 | src/composables/useReviewPageState.ts:252；src/pages/WishDetailAtelier.vue:607；src/pages/WishDetailAtelier.vue:736；src/pages/WishDetailAtelier.vue:843 | 无 | 否 | 待确认 |  |
| 202 | 领取奖励 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。；另见 空间页状态/文案构造。 | src/composables/useReviewPageState.ts:255；src/composables/useSpaceState.ts:570 | 无 | 否 | 待确认 |  |
| 203 | {actorName} 留下近况：{messageText} | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 messageText 区域展示。 | src/composables/useReviewPageState.ts:264 | actorName；messageText；message | 否 | 待确认 |  |
| 204 | {actorName} 留下了一句近况 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 messageText 区域展示。 | src/composables/useReviewPageState.ts:264 | actorName | 否 | 待确认 |  |
| 205 | {actorName} 写下了「{wishTitle}」 | 回顾页状态/文案构造 | 标题 | 在 回顾页状态/文案构造 的 messageText 区域展示。 | src/composables/useReviewPageState.ts:268 | actorName；wishTitle | 否 | 待确认 |  |
| 206 | {actorName} 推进了「{wishTitle}」 | 回顾页状态/文案构造 | 标题 | 在 回顾页状态/文案构造 的 messageText 区域展示。 | src/composables/useReviewPageState.ts:272 | actorName；wishTitle | 否 | 待确认 |  |
| 207 | {actorName} 把「{wishTitle}」收进完成册页 | 回顾页状态/文案构造 | 标题 | 在 回顾页状态/文案构造 的 messageText 区域展示。 | src/composables/useReviewPageState.ts:276 | actorName；wishTitle | 否 | 待确认 |  |
| 208 | 一份高档奖励 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useReviewPageState.ts:282 | 无 | 否 | 待确认 |  |
| 209 | {actorName} 兑换了「{rewardTitle}」 | 回顾页状态/文案构造 | 标题 | 在 回顾页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useReviewPageState.ts:284 | actorName；rewardTitle | 否 | 待确认 |  |
| 210 | {actorName} 记录了：{messageText} | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useReviewPageState.ts:287 | actorName；messageText；message | 否 | 待确认 |  |
| 211 | {actorName} 留下了一条{getThreadEventLabel} | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useReviewPageState.ts:287 | actorName；getThreadEventLabel | 否 | 待确认 |  |
| 212 | {reaction.count} 位成员 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 memberLabel 区域展示。；另见 详情页状态/文案构造。 | src/composables/useReviewPageState.ts:309；src/composables/useWishDetailState.ts:343 | reaction.count | 否 | 待确认 |  |
| 213 | {memberLabel} 放了 {reaction.emoji} | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 memberLabel 区域展示。；另见 详情页状态/文案构造。 | src/composables/useReviewPageState.ts:310；src/composables/useWishDetailState.ts:344 | memberLabel；reaction.emoji | 否 | 待确认 |  |
| 214 | 空间记录 | 回顾页状态/文案构造 | 空态 / 缺省 | 在 回顾页状态/文案构造 的 getWishTitle 区域数据为空、不可用或尚未开始时出现。 | src/composables/useReviewPageState.ts:315 | 无 | 否 | 待确认 |  |
| 215 | 已经归档的愿望 | 回顾页状态/文案构造 | 标题 | 在 回顾页状态/文案构造 的 getWishTitle 区域展示。 | src/composables/useReviewPageState.ts:318 | 无 | 否 | 待确认 |  |
| 216 | 我们一起 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getWishScopeLabel 区域展示。；另见 详情页。 | src/composables/useReviewPageState.ts:322；src/pages/WishDetailAtelier.vue:123 | 无 | 否 | 待确认 |  |
| 217 | 只属于我 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getWishScopeLabel 区域展示。；另见 详情页。 | src/composables/useReviewPageState.ts:322；src/pages/WishDetailAtelier.vue:123 | 无 | 否 | 待确认 |  |
| 218 | 记录 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getSnapshotBlockLabel 区域展示。 | src/composables/useReviewPageState.ts:349；src/pages/Stats.vue:324 | 无 | 否 | 待确认 |  |
| 219 | 这页月刊里保存了一条固定记录。 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 getSnapshotBlockMessage 区域展示。 | src/composables/useReviewPageState.ts:361 | 无 | 否 | 待确认 |  |
| 220 | {year} 年 {month} 月 | 回顾页状态/文案构造 | 正文 / 说明 | 在 回顾页状态/文案构造 的 formatMonthLabel 区域展示。 | src/composables/useReviewPageState.ts:424 | year；month | 否 | 待确认 |  |
| 221 | ./useSpaceState | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:2 | 无 | 否 | 待确认 |  |
| 222 | 这间空间还在等第一个名字出现 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 names 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:12 | 无 | 否 | 待确认 |  |
| 223 | 两个人都在 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 heroBadges 区域展示。 | src/composables/useSpacePageState.ts:31 | 无 | 否 | 待确认 |  |
| 224 | 等对方进来 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 heroBadges 区域展示。 | src/composables/useSpacePageState.ts:31 | 无 | 否 | 待确认 |  |
| 225 | {memberNamesLabel} 已经在同一页里碰头。先看现在的节奏，再决定下一步。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 heroCopy 区域展示。 | src/composables/useSpacePageState.ts:38 | memberNamesLabel | 否 | 待确认 |  |
| 226 | {viewerName} 先把这里收好，等对方进来后再一起用。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 heroCopy 区域展示。 | src/composables/useSpacePageState.ts:42 | viewerName | 否 | 待确认 |  |
| 227 | 先从这里进来，这间空间才会慢慢收起两个人的日常。 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 heroCopy 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:45 | 无 | 否 | 待确认 |  |
| 228 | 两个人都已经在这里，可以从节奏或奖励账页继续往下看。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 identitySummary 区域展示。 | src/composables/useSpacePageState.ts:50 | 无 | 否 | 待确认 |  |
| 229 | {viewerName} 先在这里等着，对方拿到邀请口令后就能进来。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 identitySummary 区域展示。 | src/composables/useSpacePageState.ts:54 | viewerName | 否 | 待确认 |  |
| 230 | 先用邮箱进来，这页才会慢慢变成共同空间。 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 identitySummary 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:57 | 无 | 否 | 待确认 |  |
| 231 | 先认人，再看奖励；邀请、照片和备份都在后面。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryGuide 区域展示。 | src/composables/useSpacePageState.ts:62 | 无 | 否 | 待确认 |  |
| 232 | 先认人，再写奖励；邀请、照片和备份都在后面。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryGuide 区域展示。 | src/composables/useSpacePageState.ts:66 | 无 | 否 | 待确认 |  |
| 233 | 先用邮箱进来，再认人、写奖励。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryGuide 区域展示。 | src/composables/useSpacePageState.ts:69 | 无 | 否 | 待确认 |  |
| 234 | 先看怎么进来和怎么邀请，再看照片余量；概览和同步细节都在后面。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 utilityBandLead 区域展示。 | src/composables/useSpacePageState.ts:74 | 无 | 否 | 待确认 |  |
| 235 | 先把进入方式理顺，再看邀请和照片余量。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 utilityBandLead 区域展示。 | src/composables/useSpacePageState.ts:77 | 无 | 否 | 待确认 |  |
| 236 | 想把高档奖励都换一遍，还差 {space.pendingStarCoinSpend} 枚 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:85 | space.pendingStarCoinSpend | 否 | 待确认 |  |
| 237 | 已经够换手边至少一部分大奖励了 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:87 | 无 | 否 | 待确认 |  |
| 238 | 先写几条奖励 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:88 | 无 | 否 | 待确认 |  |
| 239 | 手里已经攒下 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:90 | 无 | 否 | 待确认 |  |
| 240 | {space.currentMemberStarCoins} 枚 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:91 | space.currentMemberStarCoins | 否 | 待确认 |  |
| 241 | 步骤 {space.pendingStepRewards.length} 条 · 数字进度 {space.pendingCountRewardUnits} 点 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:96 | space.pendingStepRewards.length；space.pendingCountRewardUnits | 否 | 待确认 |  |
| 242 | 新的推进会先把小奖励留在这里 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:97 | 无 | 否 | 待确认 |  |
| 243 | 待领取 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useSpacePageState.ts:98 | 无 | 否 | 待确认 |  |
| 244 | 空间页统一接住 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:99 | 无 | 否 | 待确认 |  |
| 245 | {space.pendingSmallRewardUnits} 份 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:100 | space.pendingSmallRewardUnits | 否 | 待确认 |  |
| 246 | 最近记下 {space.recentRewardClaims.length} 笔领取记录 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:105 | space.recentRewardClaims.length | 否 | 待确认 |  |
| 247 | 第一笔领取记录会记在这里 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:106 | 无 | 否 | 待确认 |  |
| 248 | 奖励账页 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:107 | 无 | 否 | 待确认 |  |
| 249 | 写下的奖励 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:108 | 无 | 否 | 待确认 |  |
| 250 | {totalRewardCount} 条 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:109 | totalRewardCount | 否 | 待确认 |  |
| 251 | 看看最近谁在推进，谁也该被接一下。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 relationshipLead 区域展示。 | src/composables/useSpacePageState.ts:116 | 无 | 否 | 待确认 |  |
| 252 | 先把这里收好，等对方进来。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 relationshipLead 区域展示。 | src/composables/useSpacePageState.ts:119 | 无 | 否 | 待确认 |  |
| 253 | 星星币 {item.starCoins} 枚，照片约 {space.formatStorageBytes}。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:125 | item.starCoins；space.formatStorageBytes | 否 | 待确认 |  |
| 254 | 在路上 {item.active} | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:128 | item.active | 否 | 待确认 |  |
| 255 | 已实现 {item.done} | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:129 | item.done | 否 | 待确认 |  |
| 256 | 一起 {item.sharedCount} | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:130 | item.sharedCount | 否 | 待确认 |  |
| 257 | 私密 {item.privateCount} | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:131 | item.privateCount | 否 | 待确认 |  |
| 258 | 有 {item.overdue} 个愿望慢了一点。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:134 | item.overdue | 否 | 待确认 |  |
| 259 | {item.active} 个愿望在往前走。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:136 | item.active | 否 | 待确认 |  |
| 260 | 可以写下一条新愿望。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:137 | 无 | 否 | 待确认 |  |
| 261 | 留言 {item.comments} · 照片 {item.imageCount} · 星币 {item.starCoins} | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 memberStoryCards 区域展示。 | src/composables/useSpacePageState.ts:138 | item.comments；item.imageCount；item.starCoins | 否 | 待确认 |  |
| 262 | 已进入 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountBadges 区域展示。 | src/composables/useSpacePageState.ts:144；src/composables/useSpacePageState.ts:144；src/pages/Settings.vue:98；src/pages/Settings.vue:1022 | 无 | 否 | 待确认 |  |
| 263 | 可记住邮箱 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountBadges 区域展示。 | src/composables/useSpacePageState.ts:144 | 无 | 否 | 待确认 |  |
| 264 | 可邀请对方 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountBadges 区域展示。 | src/composables/useSpacePageState.ts:144 | 无 | 否 | 待确认 |  |
| 265 | 待进入 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountBadges 区域展示。 | src/composables/useSpacePageState.ts:147 | 无 | 否 | 待确认 |  |
| 266 | 准备邀请对方 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountBadges 区域展示。 | src/composables/useSpacePageState.ts:147 | 无 | 否 | 待确认 |  |
| 267 | 已经进来了，先把邀请口令交给对方；常用邮箱也能记在这里。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountSummary 区域展示。 | src/composables/useSpacePageState.ts:153 | 无 | 否 | 待确认 |  |
| 268 | 已经进来了，下一步把邀请口令交给对方就好。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountSummary 区域展示。 | src/composables/useSpacePageState.ts:154 | 无 | 否 | 待确认 |  |
| 269 | 先用邮箱进来，再把邀请口令交给对方。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 accountSummary 区域展示。 | src/composables/useSpacePageState.ts:157 | 无 | 否 | 待确认 |  |
| 270 | 把这串邀请口令发给对方，对方就能进来。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 inviteSummary 区域展示。 | src/composables/useSpacePageState.ts:162 | 无 | 否 | 待确认 |  |
| 271 | 先把自己带进来，这里的邀请口令才接得上。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 inviteSummary 区域展示。 | src/composables/useSpacePageState.ts:165 | 无 | 否 | 待确认 |  |
| 272 | 照片已经有点多了，先留一份备份更安心。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 storageLead 区域展示。 | src/composables/useSpacePageState.ts:170 | 无 | 否 | 待确认 |  |
| 273 | 照片快接近上限了，现在顺手备份最合适。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 storageLead 区域展示。 | src/composables/useSpacePageState.ts:174 | 无 | 否 | 待确认 |  |
| 274 | 照片余量和备份都放在这里，需要时翻开就好。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 storageLead 区域展示。 | src/composables/useSpacePageState.ts:177 | 无 | 否 | 待确认 |  |
| 275 | 已用 {space.storageSummary.usagePercent}% · 还没开始留照片 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 storageSummaryLabel 区域展示。 | src/composables/useSpacePageState.ts:182 | space.storageSummary.usagePercent | 否 | 待确认 |  |
| 276 | 已用 {space.storageSummary.usagePercent}% · 已留下 {space.wishStore.stats.totalImages} 张照片 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 storageSummaryLabel 区域展示。 | src/composables/useSpacePageState.ts:185 | space.storageSummary.usagePercent；space.wishStore.stats.totalImages | 否 | 待确认 |  |
| 277 | 已经留下 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 storageFacts 区域展示。 | src/composables/useSpacePageState.ts:191 | 无 | 否 | 待确认 |  |
| 278 | 照片已占用的空间。 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 storageFacts 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:192 | 无 | 否 | 待确认 |  |
| 279 | 还能放下 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 storageFacts 区域展示。 | src/composables/useSpacePageState.ts:196 | 无 | 否 | 待确认 |  |
| 280 | 按总容量估算的剩余空间。 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 storageFacts 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:197 | 无 | 否 | 待确认 |  |
| 281 | 照片空间 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 storageFacts 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpacePageState.ts:201 | 无 | 否 | 待确认 |  |
| 282 | 当前总照片额度。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 storageFacts 区域展示。 | src/composables/useSpacePageState.ts:202 | 无 | 否 | 待确认 |  |
| 283 | 照片数量 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 storageFacts 区域展示。 | src/composables/useSpacePageState.ts:206 | 无 | 否 | 待确认 |  |
| 284 | 愿望里的照片总数。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:207 | 无 | 否 | 待确认 |  |
| 285 | {space.wishStore.stats.totalImages} 张 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpacePageState.ts:208 | space.wishStore.stats.totalImages | 否 | 待确认 |  |
| 286 | 云端配置 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 advancedInfoRows 区域展示。 | src/composables/useSpacePageState.ts:216 | 无 | 否 | 待确认 |  |
| 287 | 已就绪 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 advancedInfoRows 区域展示。 | src/composables/useSpacePageState.ts:217 | 无 | 否 | 待确认 |  |
| 288 | 本地体验中 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 advancedInfoRows 区域展示。 | src/composables/useSpacePageState.ts:217 | 无 | 否 | 待确认 |  |
| 289 | 实时刷新 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 advancedInfoRows 区域展示。 | src/composables/useSpacePageState.ts:220 | 无 | 否 | 待确认 |  |
| 290 | 数据来源 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 advancedInfoRows 区域展示。 | src/composables/useSpacePageState.ts:224 | 无 | 否 | 待确认 |  |
| 291 | 云端连接、实时刷新和退出入口都收在最后。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 advancedSummary 区域展示。 | src/composables/useSpacePageState.ts:232 | 无 | 否 | 待确认 |  |
| 292 | 现在还是本地体验，这里主要放同步状态和退出入口。 | 空间页状态/文案构造 | 标签 / 选项 | 在 空间页状态/文案构造 的 advancedSummary 区域展示。 | src/composables/useSpacePageState.ts:235 | 无 | 否 | 待确认 |  |
| 293 | 创建者 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 roleLabels 区域展示。 | src/composables/useSpaceState.ts:20；src/pages/Settings.vue:105 | 无 | 否 | 待确认 |  |
| 294 | 成员 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 roleLabels 区域展示。；另见 认证与空间状态。 | src/composables/useSpaceState.ts:21；src/stores/auth.ts:323 | 无 | 否 | 待确认 |  |
| 295 | 共同 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 sharedRewardEntries 区域展示。 | src/composables/useSpaceState.ts:104；src/pages/Settings.vue:797 | 无 | 否 | 待确认 |  |
| 296 | 对方 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 assistRewardEntries 区域展示。 | src/composables/useSpaceState.ts:114；src/pages/Settings.vue:226 | 无 | 否 | 待确认 |  |
| 297 | 接住这次奖励 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 firstPendingStepReward 区域展示。 | src/composables/useSpaceState.ts:142 | 无 | 否 | 待确认 |  |
| 298 | 先收成星星币 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 firstPendingStepReward 区域展示。 | src/composables/useSpaceState.ts:142；src/composables/useSpaceState.ts:158 | 无 | 否 | 待确认 |  |
| 299 | 刚刚完成的一步 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 firstPendingStepReward 区域展示。 | src/composables/useSpaceState.ts:144 | 无 | 否 | 待确认 |  |
| 300 | 这一步的小奖励已经到了，先接住它就好。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 firstPendingStepReward 区域展示。 | src/composables/useSpaceState.ts:146 | 无 | 否 | 待确认 |  |
| 301 | 这一步的小奖励已经到了，先收成星星币也可以。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 firstPendingStepReward 区域展示。 | src/composables/useSpaceState.ts:147 | 无 | 否 | 待确认 |  |
| 302 | 来自「{firstPendingStepReward.wishTitle}」 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 firstPendingStepReward 区域展示。 | src/composables/useSpaceState.ts:148 | firstPendingStepReward.wishTitle；wishTitle | 否 | 待确认 |  |
| 303 | 先接住这一段 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 firstPendingCountReward 区域展示。 | src/composables/useSpaceState.ts:158 | 无 | 否 | 待确认 |  |
| 304 | 刚刚推进的这一段 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 firstPendingCountReward 区域展示。 | src/composables/useSpaceState.ts:160 | 无 | 否 | 待确认 |  |
| 305 | 已经替你攒下 {getPendingCountUnitLabel} 小奖励。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 firstPendingCountReward 区域展示。 | src/composables/useSpaceState.ts:162 | getPendingCountUnitLabel | 否 | 待确认 |  |
| 306 | 已经替你攒下 {getPendingCountUnitLabel}，先收成星星币也可以。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 firstPendingCountReward 区域展示。 | src/composables/useSpaceState.ts:163 | getPendingCountUnitLabel | 否 | 待确认 |  |
| 307 | 来自「{firstPendingCountReward.wishTitle}」 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 firstPendingCountReward 区域展示。 | src/composables/useSpaceState.ts:164 | firstPendingCountReward.wishTitle；wishTitle | 否 | 待确认 |  |
| 308 | {getPendingCountUnitLabel} 正在等你接住 | 空间页状态/文案构造 | 状态 / 反馈 / 错误 | 在 空间页状态/文案构造 的 firstPendingCountReward 触发成功、失败、加载或状态更新时出现。 | src/composables/useSpaceState.ts:166 | getPendingCountUnitLabel | 否 | 待确认 |  |
| 309 | 还没有记录加入时间 | 空间页状态/文案构造 | 空态 / 缺省 | 在 空间页状态/文案构造 的 joinedSpaceLabel 区域数据为空、不可用或尚未开始时出现。 | src/composables/useSpaceState.ts:175 | 无 | 否 | 待确认 |  |
| 310 | 当前环境暂时不能直接复制邀请口令，请手动复制。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 copyInviteCode 区域展示。 | src/composables/useSpaceState.ts:301 | 无 | 否 | 待确认 |  |
| 311 | 邀请口令已经复制好了。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 copyInviteCode 区域展示。 | src/composables/useSpaceState.ts:307 | 无 | 否 | 待确认 |  |
| 312 | 当前环境不支持下载备份文件。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 downloadBackup 区域展示。 | src/composables/useSpaceState.ts:370 | 无 | 否 | 待确认 |  |
| 313 | 这份清单已经备份好了。建议两个人都各自留一份。 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 anchor 区域展示。 | src/composables/useSpaceState.ts:386 | 无 | 否 | 待确认 |  |
| 314 | 共同奖励 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getRewardTaskKindLabel 区域展示。 | src/composables/useSpaceState.ts:558；src/pages/Settings.vue:157 | 无 | 否 | 待确认 |  |
| 315 | 帮对方 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getRewardTaskKindLabel 区域展示。 | src/composables/useSpaceState.ts:562 | 无 | 否 | 待确认 |  |
| 316 | 我的奖励 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getRewardTaskKindLabel 区域展示。 | src/composables/useSpaceState.ts:565 | 无 | 否 | 待确认 |  |
| 317 | 领取共同奖励 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getRewardPrimaryActionLabel 区域展示。 | src/composables/useSpaceState.ts:570 | 无 | 否 | 待确认 |  |
| 318 | 星币不足 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 amount 区域展示。 | src/composables/useSpaceState.ts:576 | 无 | 否 | 待确认 |  |
| 319 | 助力 {amount} 枚 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 amount 区域展示。 | src/composables/useSpaceState.ts:579 | amount | 否 | 待确认 |  |
| 320 | 存入 {amount} 枚 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 amount 区域展示。 | src/composables/useSpaceState.ts:579 | amount | 否 | 待确认 |  |
| 321 | {units} 点 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getPendingCountUnitLabel 区域展示。 | src/composables/useSpaceState.ts:606 | units | 否 | 待确认 |  |
| 322 | 完成愿望 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getRewardClaimLabel 区域展示。 | src/composables/useSpaceState.ts:670 | 无 | 否 | 待确认 |  |
| 323 | 完成步骤 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getRewardClaimLabel 区域展示。 | src/composables/useSpaceState.ts:674 | 无 | 否 | 待确认 |  |
| 324 | 数字进度 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getRewardClaimLabel 区域展示。；另见 详情页。 | src/composables/useSpaceState.ts:678；src/pages/WishDetailAtelier.vue:385 | 无 | 否 | 待确认 |  |
| 325 | 存星星币 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getRewardClaimLabel 区域展示。 | src/composables/useSpaceState.ts:682 | 无 | 否 | 待确认 |  |
| 326 | 步骤星币 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 getRewardClaimLabel 区域展示。 | src/composables/useSpaceState.ts:686 | 无 | 否 | 待确认 |  |
| 327 | 进度星币 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpaceState.ts:690 | 无 | 否 | 待确认 |  |
| 328 | 完成星币 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpaceState.ts:694 | 无 | 否 | 待确认 |  |
| 329 | 助力存入 | 空间页状态/文案构造 | 正文 / 说明 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpaceState.ts:698 | 无 | 否 | 待确认 |  |
| 330 | 这条愿望 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 sourceWishTitle 区域展示。；另见 首页。 | src/composables/useSpaceState.ts:711；src/composables/useSpaceState.ts:711；src/pages/HomeAtelier.vue:509 | 无 | 否 | 待确认 |  |
| 331 | 这份奖励 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useSpaceState.ts:712 | 无 | 否 | 待确认 |  |
| 332 | 因为「{sourceWishTitle}」的小步骤完成了，接住了「{rewardTitle}」。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useSpaceState.ts:715 | sourceWishTitle；rewardTitle | 否 | 待确认 |  |
| 333 | 因为「{sourceWishTitle}」推进了 {Math.max} 点，接住了「{rewardTitle}」。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useSpaceState.ts:719 | sourceWishTitle；Math.max；rewardTitle | 否 | 待确认 |  |
| 334 | 因为「{sourceWishTitle}」整条完成了，接住了「{rewardTitle}」。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useSpaceState.ts:723 | sourceWishTitle；rewardTitle | 否 | 待确认 |  |
| 335 | 因为「{sourceWishTitle}」的小步骤完成了，这次先存成了 {Math.max} 枚星星币。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useSpaceState.ts:728 | sourceWishTitle；Math.max | 否 | 待确认 |  |
| 336 | 因为「{sourceWishTitle}」数字进度推进了 {Math.max} 点，这次先存成了 {Math.max} 枚星星币。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 rewardTitle 区域展示。 | src/composables/useSpaceState.ts:729 | sourceWishTitle；Math.max | 否 | 待确认 |  |
| 337 | 因为「{sourceWishTitle}」的小步骤完成了，自动获得了「{rewardTitle}」。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpaceState.ts:733 | sourceWishTitle；rewardTitle | 否 | 待确认 |  |
| 338 | 因为「{sourceWishTitle}」数字进度推进了 {Math.max} 点，自动获得了「{rewardTitle}」。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpaceState.ts:737 | sourceWishTitle；Math.max；rewardTitle | 否 | 待确认 |  |
| 339 | 因为「{sourceWishTitle}」整条完成了，自动获得了「{rewardTitle}」。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpaceState.ts:741 | sourceWishTitle；rewardTitle | 否 | 待确认 |  |
| 340 | 往「{rewardTitle}」助力存入了 {Math.max} 枚星星币。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpaceState.ts:745 | rewardTitle；Math.max | 否 | 待确认 |  |
| 341 | 用星星币兑换到了「{rewardTitle}」。 | 空间页状态/文案构造 | 标题 | 在 空间页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useSpaceState.ts:748 | rewardTitle | 否 | 待确认 |  |
| 342 | 还没有定日子 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 dueDateLabel 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailPageState.ts:20 | 无 | 否 | 待确认 |  |
| 343 | {selectedWish.dueDate} 前 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 dueDateLabel 区域展示。 | src/composables/useWishDetailPageState.ts:23 | selectedWish.dueDate | 否 | 待确认 |  |
| 344 | 手账记录 | 详情页状态/文案构造 | 标签 / 选项 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:28 | 无 | 否 | 待确认 |  |
| 345 | 留言、推进和完成痕迹，都会顺着这一页留下。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:29 | 无 | 否 | 待确认 |  |
| 346 | {wishJournalEntries.length} 条 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:30；src/pages/WishDetailAtelier.vue:250 | wishJournalEntries.length | 否 | 待确认 |  |
| 347 | 图片与纪念 | 详情页状态/文案构造 | 标签 / 选项 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:33 | 无 | 否 | 待确认 |  |
| 348 | 首图会先替这一页把记忆翻开。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:34 | 无 | 否 | 待确认 |  |
| 349 | 还没上传图片，也可以先把过程写下来。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:34 | 无 | 否 | 待确认 |  |
| 350 | {selectedWish} 张 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:35 | selectedWish | 否 | 待确认 |  |
| 351 | 已经把「{wishRewardClaim.titleSnapshot}」接住了 | 详情页状态/文案构造 | 标题 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:39 | wishRewardClaim.titleSnapshot；titleSnapshot；title | 否 | 待确认 |  |
| 352 | 完成时会在这里接住奖励。 | 详情页状态/文案构造 | 标题 | 在 详情页状态/文案构造 的 summaryCards 区域展示。 | src/composables/useWishDetailPageState.ts:39 | 无 | 否 | 待确认 |  |
| 353 | 这条愿望还没决定要怎么记进度，也没关系，先挑一种顺手的记法就能继续往前。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 progressLead 区域展示。 | src/composables/useWishDetailPageState.ts:46 | 无 | 否 | 待确认 |  |
| 354 | 数字进度适合那些一点点累起来的靠近，页数、公里和次数，都能在这里慢慢记下。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 progressLead 区域展示。 | src/composables/useWishDetailPageState.ts:50 | 无 | 否 | 待确认 |  |
| 355 | 步骤进度适合那些要一件件推进的靠近，每做完一步，这一页都会替你记住。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 progressLead 区域展示。 | src/composables/useWishDetailPageState.ts:53 | 无 | 否 | 待确认 |  |
| 356 | 这条愿望完成时，已经把「{wishRewardClaim.titleSnapshot}」好好接住了 | 详情页状态/文案构造 | 标题 | 在 详情页状态/文案构造 的 rewardHeadline 区域展示。 | src/composables/useWishDetailPageState.ts:57 | wishRewardClaim.titleSnapshot；titleSnapshot；title | 否 | 待确认 |  |
| 357 | 推进、留言和领奖，会在这里慢慢长成同一页手账。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 rewardHeadline 区域展示。 | src/composables/useWishDetailPageState.ts:60 | 无 | 否 | 待确认 |  |
| 358 | 喜欢 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:115 | 无 | 否 | 待确认 |  |
| 359 | 笑出声 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:116 | 无 | 否 | 待确认 |  |
| 360 | 有点惊喜 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:117 | 无 | 否 | 待确认 |  |
| 361 | 太有感觉了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:118 | 无 | 否 | 待确认 |  |
| 362 | 值得庆祝 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:119 | 无 | 否 | 待确认 |  |
| 363 | 好有灵光 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:120 | 无 | 否 | 待确认 |  |
| 364 | 被接住了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:121 | 无 | 否 | 待确认 |  |
| 365 | 真想鼓掌 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:122 | 无 | 否 | 待确认 |  |
| 366 | 有点感动 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:123 | 无 | 否 | 待确认 |  |
| 367 | 好想抱一下 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:124 | 无 | 否 | 待确认 |  |
| 368 | 一起加油 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:125 | 无 | 否 | 待确认 |  |
| 369 | 这刻在发光 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:126 | 无 | 否 | 待确认 |  |
| 370 | 太喜欢了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:127 | 无 | 否 | 待确认 |  |
| 371 | 心都软了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:128 | 无 | 否 | 待确认 |  |
| 372 | 太好了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:129 | 无 | 否 | 待确认 |  |
| 373 | 一起记住 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:130 | 无 | 否 | 待确认 |  |
| 374 | 很安心 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:131 | 无 | 否 | 待确认 |  |
| 375 | 刚刚好 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 THREAD_REACTION_LABELS 区域展示。 | src/composables/useWishDetailState.ts:132 | 无 | 否 | 待确认 |  |
| 376 | 有点想哭 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:133 | 无 | 否 | 待确认 |  |
| 377 | 好热闹 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:134 | 无 | 否 | 待确认 |  |
| 378 | 想把这刻收起来 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:135 | 无 | 否 | 待确认 |  |
| 379 | 认真谢谢你 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:136 | 无 | 否 | 待确认 |  |
| 380 | 写下 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 sourceStepId 区域展示。 | src/composables/useWishDetailState.ts:242 | 无 | 否 | 待确认 |  |
| 381 | 完成 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 sourceStepId 区域展示。；另见 空间页。 | src/composables/useWishDetailState.ts:250；src/pages/Settings.vue:890 | 无 | 否 | 待确认 |  |
| 382 | 本周发放 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:258 | 无 | 否 | 待确认 |  |
| 383 | 数字奖励 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:262；src/composables/useWishDetailState.ts:616 | 无 | 否 | 待确认 |  |
| 384 | 进度存币 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:266 | 无 | 否 | 待确认 |  |
| 385 | 领奖 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:269 | 无 | 否 | 待确认 |  |
| 386 | 留下了一句此刻的话 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 sourceStepId 区域展示。 | src/composables/useWishDetailState.ts:277 | 无 | 否 | 待确认 |  |
| 387 | 这条愿望被认真写下 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 sourceStepId 区域展示。 | src/composables/useWishDetailState.ts:281 | 无 | 否 | 待确认 |  |
| 388 | 又往前走完了一小步 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 sourceStepId 区域展示。 | src/composables/useWishDetailState.ts:285 | 无 | 否 | 待确认 |  |
| 389 | 它被正式收进回忆里 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 sourceStepId 区域展示。 | src/composables/useWishDetailState.ts:289 | 无 | 否 | 待确认 |  |
| 390 | 星星币换成了一份奖励 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:293 | 无 | 否 | 待确认 |  |
| 391 | 数字进度接住了一份小奖励 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:297 | 无 | 否 | 待确认 |  |
| 392 | 数字进度先存成了星星币 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:301 | 无 | 否 | 待确认 |  |
| 393 | 一份奖励被认真接住了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:304 | 无 | 否 | 待确认 |  |
| 394 | 留个回应 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getThreadReactionLabel 区域展示。 | src/composables/useWishDetailState.ts:312 | 无 | 否 | 待确认 |  |
| 395 | ，你已经点过了 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 activeCopy 区域展示。 | src/composables/useWishDetailState.ts:317 | 无 | 否 | 待确认 |  |
| 396 | ，目前有 {count} 个回应 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 countCopy 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:318 | count | 否 | 待确认 |  |
| 397 | ，目前还没有回应 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 countCopy 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:318 | 无 | 否 | 待确认 |  |
| 398 | ，正在发送 | 详情页状态/文案构造 | 状态 / 反馈 / 错误 | 在 详情页状态/文案构造 的 pendingCopy 触发成功、失败、加载或状态更新时出现。 | src/composables/useWishDetailState.ts:319 | 无 | 否 | 待确认 |  |
| 399 | 更多表情 · {hiddenReactionKinds} 种回应 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 hiddenReactionKinds 区域展示。 | src/composables/useWishDetailState.ts:442 | hiddenReactionKinds | 否 | 待确认 |  |
| 400 | 更多表情 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 hiddenReactionKinds 区域展示。 | src/composables/useWishDetailState.ts:442 | 无 | 否 | 待确认 |  |
| 401 | 同一条记录里，每位成员最多保留 3 个表情回应。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 thread 区域展示。 | src/composables/useWishDetailState.ts:469 | 无 | 否 | 待确认 |  |
| 402 | 标记为完成 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getWishActionLabel 区域展示。 | src/composables/useWishDetailState.ts:553 | 无 | 否 | 待确认 |  |
| 403 | 放回进行中 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getWishActionLabel 区域展示。 | src/composables/useWishDetailState.ts:557 | 无 | 否 | 待确认 |  |
| 404 | 放回已完成 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getWishActionLabel 区域展示。 | src/composables/useWishDetailState.ts:560 | 无 | 否 | 待确认 |  |
| 405 | 完成并获得星星币 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getWishActionLabel 区域展示。 | src/composables/useWishDetailState.ts:560；src/composables/useWishDetailState.ts:568 | 无 | 否 | 待确认 |  |
| 406 | 放回未完成 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getStepActionLabel 区域展示。 | src/composables/useWishDetailState.ts:565 | 无 | 否 | 待确认 |  |
| 407 | 重新标记完成 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getStepActionLabel 区域展示。 | src/composables/useWishDetailState.ts:568 | 无 | 否 | 待确认 |  |
| 408 | 这个小目标已经走完，小奖励也存成了 {claim.titleSnapshot}。 | 详情页状态/文案构造 | 标题 | 在 详情页状态/文案构造 的 claim 区域展示。 | src/composables/useWishDetailState.ts:576 | claim.titleSnapshot；titleSnapshot；title | 否 | 待确认 |  |
| 409 | 这个小目标已经走完，小奖励也已经接住了「{claim.titleSnapshot}」。 | 详情页状态/文案构造 | 标题 | 在 详情页状态/文案构造 的 claim 区域展示。 | src/composables/useWishDetailState.ts:577 | claim.titleSnapshot；titleSnapshot；title | 否 | 待确认 |  |
| 410 | 这个小目标已经走完了，星星币已经自动到账。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 claim 区域展示。 | src/composables/useWishDetailState.ts:581 | 无 | 否 | 待确认 |  |
| 411 | 这一步的星星币已经发过了；再次完成只会记进度，不会再重复发。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 claim 区域展示。 | src/composables/useWishDetailState.ts:585 | 无 | 否 | 待确认 |  |
| 412 | 它还在路上。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 claim 区域展示。 | src/composables/useWishDetailState.ts:588 | 无 | 否 | 待确认 |  |
| 413 | {formatStarCoinAmount} 星星币 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 step 区域展示。 | src/composables/useWishDetailState.ts:598；src/composables/useWishDetailState.ts:611 | formatStarCoinAmount | 否 | 待确认 |  |
| 414 | 0 星星币 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 step 区域展示。 | src/composables/useWishDetailState.ts:598；src/composables/useWishDetailState.ts:603；src/composables/useWishDetailState.ts:611 | 无 | 否 | 待确认 |  |
| 415 | 每 {unitText} {formatStarCoinAmount} 星星币 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 unitText 区域展示。 | src/composables/useWishDetailState.ts:607 | unitText；formatStarCoinAmount | 否 | 待确认 |  |
| 416 | 星星币 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getClaimToneLabel 区域展示。；另见 写下页。；另见 清单页。 | src/composables/useWishDetailState.ts:620；src/pages/ComposeAtelier.vue:299；src/pages/List.vue:32；src/pages/WishDetailAtelier.vue:254 | 无 | 否 | 待确认 |  |
| 417 | 星币兑换 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getClaimToneLabel 区域展示。 | src/composables/useWishDetailState.ts:624 | 无 | 否 | 待确认 |  |
| 418 | 已领奖 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 getClaimToneLabel 区域展示。 | src/composables/useWishDetailState.ts:627 | 无 | 否 | 待确认 |  |
| 419 | 只有这条愿望的归属人可以推进它。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 adjustCountProgress 区域展示。 | src/composables/useWishDetailState.ts:754；src/composables/useWishDetailState.ts:798；src/composables/useWishDetailState.ts:899 | 无 | 否 | 待确认 |  |
| 420 | 数字进度暂时没有更新。 | 详情页状态/文案构造 | 状态 / 反馈 / 错误 | 在 详情页状态/文案构造 的 updated 触发成功、失败、加载或状态更新时出现。 | src/composables/useWishDetailState.ts:762；src/composables/useWishDetailState.ts:806 | 无 | 否 | 待确认 |  |
| 421 | 数字进度往前推进了 {gainedUnits} 点（现在 {nextCurrent}/{selectedWish.progressTarget}${selectedWish.value.progressUnit ? | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 actorId 区域展示。 | src/composables/useWishDetailState.ts:775 | gainedUnits；nextCurrent；selectedWish.progressTarget | 否 | 待确认 |  |
| 422 | 数字进度先往前走了 {gainedUnits} 点，{formatStarCoinAmount} 枚星星币已经自动到账。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 actorId 区域展示。 | src/composables/useWishDetailState.ts:782 | gainedUnits；formatStarCoinAmount | 否 | 待确认 |  |
| 423 | 数字进度已经往回调整，空间页里的待领取数量也会跟着收住。 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 actorId 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:784 | 无 | 否 | 待确认 |  |
| 424 | 数字进度已经更新。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 actorId 区域展示。 | src/composables/useWishDetailState.ts:785；src/composables/useWishDetailState.ts:829 | 无 | 否 | 待确认 |  |
| 425 | 数字进度改到了 {nextCurrent}/{selectedWish.progressTarget}${selectedWish.value.progressUnit ? | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 actorId 区域展示。 | src/composables/useWishDetailState.ts:819 | nextCurrent；selectedWish.progressTarget | 否 | 待确认 |  |
| 426 | : ''}，本次新增 {gainedUnits} 点。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 actorId 区域展示。 | src/composables/useWishDetailState.ts:819 | gainedUnits | 否 | 待确认 |  |
| 427 | 数字进度已经补到现在的位置，新增的 {gainedUnits} 点已经自动换成 {formatStarCoinAmount} 枚星星币。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 actorId 区域展示。 | src/composables/useWishDetailState.ts:826 | gainedUnits；formatStarCoinAmount | 否 | 待确认 |  |
| 428 | 数字进度已经重新校正，空间页里的待领取数量也会跟着收住。 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 actorId 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:828 | 无 | 否 | 待确认 |  |
| 429 | 只有这条愿望的归属人可以继续拆步骤。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 submitWishStep 区域展示。 | src/composables/useWishDetailState.ts:842 | 无 | 否 | 待确认 |  |
| 430 | 只有这条愿望的归属人可以完成它。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 handleWishCompletionAction 区域展示。 | src/composables/useWishDetailState.ts:870 | 无 | 否 | 待确认 |  |
| 431 | 这个步骤重新记成完成了；小奖励不会重复发，但推进会继续记下。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 updated 区域展示。 | src/composables/useWishDetailState.ts:920 | 无 | 否 | 待确认 |  |
| 432 | 这个步骤已经记成完成了，{formatStarCoinAmount} 枚星星币已经自动到账。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 updated 区域展示。 | src/composables/useWishDetailState.ts:921 | formatStarCoinAmount | 否 | 待确认 |  |
| 433 | 这个步骤已经放回路上；之前领过的小奖励会保留。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域展示。 | src/composables/useWishDetailState.ts:930 | 无 | 否 | 待确认 |  |
| 434 | 这个步骤已经放回路上，空间页里对应的小奖励也会先收住。 | 详情页状态/文案构造 | 空态 / 缺省 | 在 详情页状态/文案构造 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/composables/useWishDetailState.ts:931 | 无 | 否 | 待确认 |  |
| 435 | 只有这条愿望的归属人可以整理步骤。 | 详情页状态/文案构造 | 正文 / 说明 | 在 详情页状态/文案构造 的 removeWishStep 区域展示。 | src/composables/useWishDetailState.ts:943 | 无 | 否 | 待确认 |  |
| 436 | 先写到这里 | 写下页 | 正文 / 说明 | 在 写下页 的 supplementaryToggleLabel 区域展示。 | src/pages/ComposeAtelier.vue:54 | 无 | 否 | 待确认 |  |
| 437 | 再补一些细节 | 写下页 | 正文 / 说明 | 在 写下页 的 supplementaryToggleLabel 区域展示。 | src/pages/ComposeAtelier.vue:54 | 无 | 否 | 待确认 |  |
| 438 | 保存这次整理 | 写下页 | 正文 / 说明 | 在 写下页 的 submitButtonLabel 区域展示。 | src/pages/ComposeAtelier.vue:58 | 无 | 否 | 待确认 |  |
| 439 | 先写下这条愿望 | 写下页 | 正文 / 说明 | 在 写下页 的 submitButtonLabel 区域展示。 | src/pages/ComposeAtelier.vue:58 | 无 | 否 | 待确认 |  |
| 440 | 这页整理后会变成这样 | 写下页 | 正文 / 说明 | 在 写下页 的 previewStageTitle 区域展示。 | src/pages/ComposeAtelier.vue:62 | 无 | 否 | 待确认 |  |
| 441 | 补充之后，这页会慢慢变成这样 | 写下页 | 正文 / 说明 | 在 写下页 的 previewStageTitle 区域展示。 | src/pages/ComposeAtelier.vue:62 | 无 | 否 | 待确认 |  |
| 442 | 整理这一页愿望 | 写下页 | 正文 / 说明 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:79 | 无 | 否 | 待确认 |  |
| 443 | 写下这条愿望 | 写下页 | 正文 / 说明 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:79 | 无 | 否 | 待确认 |  |
| 444 | {editingWish ? '整理这一页愿望' : '写下这条愿望'} | 写下页 | 正文 / 说明 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:79 | 无 | 否 | 待确认 |  |
| 445 | 愿望名字 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:92 | 无 | 否 | 待确认 |  |
| 446 | 例如：一起去看海边的日出 | 写下页 | 输入占位符 | 在 写下页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/ComposeAtelier.vue:93 | 无 | 否 | 待确认 |  |
| 447 | 一句心情 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:97 | 无 | 否 | 待确认 |  |
| 448 | 先留一句就够，比如为什么现在想把它写下来。 | 写下页 | 输入占位符 | 在 写下页 的 <textarea> 表单输入框为空时作为占位提示出现。 | src/pages/ComposeAtelier.vue:102 | 无 | 否 | 待确认 |  |
| 449 | 补充这条愿望 | 写下页 | 正文 / 说明 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:129 | 无 | 否 | 待确认 |  |
| 450 | 这些都可以慢一点再决定 | 写下页 | 标题 | 在 写下页 的 <h2> 区域展示。 | src/pages/ComposeAtelier.vue:130 | 无 | 否 | 待确认 |  |
| 451 | 分类建议 | 写下页 | 可访问性 / aria | 在 写下页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/ComposeAtelier.vue:137 | 无 | 是 | 待确认 |  |
| 452 | 分类 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:151 | 无 | 否 | 待确认 |  |
| 453 | 旅行 / 生活 / 成长 | 写下页 | 输入占位符 | 在 写下页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/ComposeAtelier.vue:152 | 无 | 否 | 待确认 |  |
| 454 | 这是谁的愿望 | 写下页 | 正文 / 说明 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:158 | 无 | 否 | 待确认 |  |
| 455 | 星星币会进入归属人的余额 | 写下页 | 标题 | 在 写下页 的 <h2> 区域展示。 | src/pages/ComposeAtelier.vue:159 | 无 | 否 | 待确认 |  |
| 456 | 慢慢靠近的方式 | 写下页 | 正文 / 说明 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:181 | 无 | 否 | 待确认 |  |
| 457 | 等你愿意时，再决定怎么记进度 | 写下页 | 标题 | 在 写下页 的 <h2> 区域展示。 | src/pages/ComposeAtelier.vue:182 | 无 | 否 | 待确认 |  |
| 458 | 当前 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:201；src/pages/ComposeAtelier.vue:205 | 无 | 否 | 待确认 |  |
| 459 | 目标 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:209 | 无 | 否 | 待确认 |  |
| 460 | 单位 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:213 | 无 | 否 | 待确认 |  |
| 461 | 次 / 公里 / 页 | 写下页 | 输入占位符 | 在 写下页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/ComposeAtelier.vue:214 | 无 | 否 | 待确认 |  |
| 462 | 每单位星星币 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:217 | 无 | 否 | 待确认 |  |
| 463 | 起步步骤 {initialStepCount} | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:224 | 无 | 否 | 待确认 |  |
| 464 | 再加一步 | 写下页 | 按钮 / 链接 | 在 写下页 的 <button> 区域作为可点击操作出现。 | src/pages/ComposeAtelier.vue:225 | 无 | 否 | 待确认 |  |
| 465 | 第 {index} 步 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:230 | 无 | 否 | 待确认 |  |
| 466 | 写一个很小的起步动作 | 写下页 | 输入占位符 | 在 写下页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/ComposeAtelier.vue:236 | 无 | 否 | 待确认 |  |
| 467 | 星币 | 写下页 | 输入占位符 | 在 写下页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/ComposeAtelier.vue:244 | 无 | 否 | 待确认 |  |
| 468 | 这条愿望已经有步骤管理区了 | 写下页 | 正文 / 说明 | 在 写下页 的 <strong> 区域展示。 | src/pages/ComposeAtelier.vue:255 | 无 | 否 | 待确认 |  |
| 469 | 这里只整理基本信息；想继续拆步骤，回详情页会更顺。 | 写下页 | 正文 / 说明 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:256 | 无 | 否 | 待确认 |  |
| 470 | 最终完成额外星星币 | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:265 | 无 | 否 | 待确认 |  |
| 471 | 归属 | 写下页 | 正文 / 说明 | 在 写下页 的 <dt> 区域展示。 | src/pages/ComposeAtelier.vue:291 | 无 | 否 | 待确认 |  |
| 472 | 进度 | 写下页 | 正文 / 说明 | 在 写下页 的 <dt> 区域展示。；另见 清单页。 | src/pages/ComposeAtelier.vue:295；src/pages/List.vue:31 | 无 | 否 | 待确认 |  |
| 473 | 写下之后，它会先这样出现 | 写下页 | 标签 / 选项 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:305 | 无 | 否 | 待确认 |  |
| 474 | {draft.category \|\| '生活'} | 写下页 | 正文 / 说明 | 在 写下页 的 <span> 区域展示。 | src/pages/ComposeAtelier.vue:307 | category | 否 | 待确认 |  |
| 475 | 起步步骤 | 写下页 | 标签 / 选项 | 在 写下页 的 <p> 区域展示。 | src/pages/ComposeAtelier.vue:314 | 无 | 否 | 待确认 |  |
| 476 | 你刚刚捎来一句 | 首页 | 正文 / 说明 | 在 首页 的 isViewer 区域展示。 | src/pages/HomeAtelier.vue:230 | 无 | 否 | 待确认 |  |
| 477 | 对方刚刚捎来一句 | 首页 | 正文 / 说明 | 在 首页 的 isViewer 区域展示。 | src/pages/HomeAtelier.vue:230 | 无 | 否 | 待确认 |  |
| 478 | 先写下一条愿望，让今天先有一件值得关心的事。 | 首页 | 正文 / 说明 | 在 首页 的 heroPrimaryWishCaption 区域展示。 | src/pages/HomeAtelier.vue:241 | 无 | 否 | 待确认 |  |
| 479 | 打开这条愿望 | 首页 | 正文 / 说明 | 在 首页 的 heroPrimaryActionLabel 区域展示。 | src/pages/HomeAtelier.vue:263 | 无 | 否 | 待确认 |  |
| 480 | 写下第一条愿望 | 首页 | 正文 / 说明 | 在 首页 的 heroPrimaryActionLabel 区域展示。 | src/pages/HomeAtelier.vue:263 | 无 | 否 | 待确认 |  |
| 481 | 已经过了约定的日子 {Math.abs} 天 | 首页 | 正文 / 说明 | 在 首页 的 dayDifference 区域展示。 | src/pages/HomeAtelier.vue:350 | Math.abs | 否 | 待确认 |  |
| 482 | 离希望完成的日子还有 {dayDifference} 天 | 首页 | 正文 / 说明 | 在 首页 的 dayDifference 区域展示。 | src/pages/HomeAtelier.vue:361 | dayDifference | 否 | 待确认 |  |
| 483 | 它先被认真写下来了，接下来只要偶尔回来看一眼，也算在靠近。 | 首页 | 正文 / 说明 | 在 首页 的 progressSnapshot 区域展示。 | src/pages/HomeAtelier.vue:369 | 无 | 否 | 待确认 |  |
| 484 | 它先安静住在这里，等你准备好时再往前走也不迟。 | 首页 | 正文 / 说明 | 在 首页 的 progressSnapshot 区域展示。 | src/pages/HomeAtelier.vue:370 | 无 | 否 | 待确认 |  |
| 485 | 已经推进到 {progressSnapshot.current}/{progressSnapshot.target}${progressSnapshot.unit ? | 首页 | 正文 / 说明 | 在 首页 的 progressSnapshot 区域展示。 | src/pages/HomeAtelier.vue:373 | progressSnapshot.current；progressSnapshot.target | 否 | 待确认 |  |
| 486 | : ''}，继续一点点往前就好。 | 首页 | 正文 / 说明 | 在 首页 的 progressSnapshot 区域展示。 | src/pages/HomeAtelier.vue:373 | 无 | 否 | 待确认 |  |
| 487 | 留下了一条新的记录。 | 首页 | 正文 / 说明 | 在 首页 的 normalizedText 区域展示。 | src/pages/HomeAtelier.vue:443 | 无 | 否 | 待确认 |  |
| 488 | 在「{wishTitle}」这页，刚好又说到你们了 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:492 | wishTitle | 否 | 待确认 |  |
| 489 | 刚好又捎来了一句新的近况 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:492 | 无 | 否 | 待确认 |  |
| 490 | 「{wishTitle}」这页，终于能笑着合上了 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:496 | wishTitle | 否 | 待确认 |  |
| 491 | 刚刚有一条愿望，终于能笑着合上了 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:496 | 无 | 否 | 待确认 |  |
| 492 | 「{wishTitle}」这边，又悄悄往前拱了一点 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:500 | wishTitle | 否 | 待确认 |  |
| 493 | 刚刚又把手上的一件事往前拱了一点 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:500 | 无 | 否 | 待确认 |  |
| 494 | 「{wishTitle}」刚被认真写进以后 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:504 | wishTitle | 否 | 待确认 |  |
| 495 | 刚刚又把一个新的以后写下来了 | 首页 | 标题 | 在 首页 的 wishTitle 区域展示。 | src/pages/HomeAtelier.vue:504 | 无 | 否 | 待确认 |  |
| 496 | 「{wishTarget}」推进后，刚领到「{rewardTitle}」 | 首页 | 标题 | 在 首页 的 wishTarget 区域展示。 | src/pages/HomeAtelier.vue:510 | wishTarget；rewardTitle | 否 | 待确认 |  |
| 497 | 「{wishTarget}」推进后，刚接住一份奖励 | 首页 | 标题 | 在 首页 的 wishTarget 区域展示。 | src/pages/HomeAtelier.vue:510 | wishTarget | 否 | 待确认 |  |
| 498 | 攒下来的星星币，刚刚换成了一份想要的东西 | 首页 | 正文 / 说明 | 在 首页 的 wishTarget 区域展示。 | src/pages/HomeAtelier.vue:514 | 无 | 否 | 待确认 |  |
| 499 | 「{wishTitle}」这页，又多了一句可以告诉对方的话 | 首页 | 标题 | 在 首页 的 wishTarget 区域展示。 | src/pages/HomeAtelier.vue:518 | wishTitle | 否 | 待确认 |  |
| 500 | 刚刚又多了一句想让对方先看到的话 | 首页 | 正文 / 说明 | 在 首页 的 wishTarget 区域展示。 | src/pages/HomeAtelier.vue:521 | 无 | 否 | 待确认 |  |
| 501 | 这句近况在说：{messageSummary} | 首页 | 正文 / 说明 | 在 首页 的 stepTitle 区域展示。 | src/pages/HomeAtelier.vue:538 | messageSummary；message | 否 | 待确认 |  |
| 502 | 这次先推进了「{stepTitle}」，像是在跟对方报一声平安。 | 首页 | 标题 | 在 首页 的 stepTitle 区域展示。 | src/pages/HomeAtelier.vue:542 | stepTitle | 否 | 待确认 |  |
| 503 | 这次先往前拱了一点，也够让对方安心一下。 | 首页 | 标题 | 在 首页 的 stepTitle 区域展示。 | src/pages/HomeAtelier.vue:542 | 无 | 否 | 待确认 |  |
| 504 | 这一次是真的走到了页尾，可以回头一起笑着看了。 | 首页 | 正文 / 说明 | 在 首页 的 stepTitle 区域展示。 | src/pages/HomeAtelier.vue:546 | 无 | 否 | 待确认 |  |
| 505 | 新的愿望「{wishTitle}」已经住进清单里，也算先和对方打了个招呼。 | 首页 | 标题 | 在 首页 的 stepTitle 区域展示。 | src/pages/HomeAtelier.vue:550 | wishTitle | 否 | 待确认 |  |
| 506 | 一个新的愿望已经住进清单里，先被轻轻说出口了。 | 首页 | 标题 | 在 首页 的 stepTitle 区域展示。 | src/pages/HomeAtelier.vue:550 | 无 | 否 | 待确认 |  |
| 507 | 因为这条愿望推进了 {quantity} 点，这次领到了「{rewardTitle}」共 {quantity} 份。 | 首页 | 标题 | 在 首页 的 quantity 区域展示。 | src/pages/HomeAtelier.vue:559 | quantity；rewardTitle | 否 | 待确认 |  |
| 508 | 因为这条愿望往前推进了一步，这次领到了「{rewardTitle}」。 | 首页 | 标题 | 在 首页 的 quantity 区域展示。 | src/pages/HomeAtelier.vue:560 | rewardTitle | 否 | 待确认 |  |
| 509 | 因为这条愿望推进了 {quantity} 点，这次接住了 {quantity} 份奖励。 | 首页 | 正文 / 说明 | 在 首页 的 quantity 区域展示。 | src/pages/HomeAtelier.vue:564 | quantity | 否 | 待确认 |  |
| 510 | 因为这条愿望往前推进了一步，这次接住了一份奖励。 | 首页 | 正文 / 说明 | 在 首页 的 quantity 区域展示。 | src/pages/HomeAtelier.vue:565 | 无 | 否 | 待确认 |  |
| 511 | 把慢慢攒下来的星星币，换成了一份想要的奖励，也算给最近的努力一个回应。 | 首页 | 正文 / 说明 | 在 首页 的 quantity 区域展示。 | src/pages/HomeAtelier.vue:569 | 无 | 否 | 待确认 |  |
| 512 | 今天先做 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:632 | 无 | 否 | 待确认 |  |
| 513 | 今天先把最想推进的一条愿望 | 首页 | 正文 / 说明 | 在 首页 的 <span> 区域展示。 | src/pages/HomeAtelier.vue:636 | 无 | 否 | 待确认 |  |
| 514 | 摆到眼前。 | 首页 | 正文 / 说明 | 在 首页 的 <span> 区域展示。 | src/pages/HomeAtelier.vue:637 | 无 | 否 | 待确认 |  |
| 515 | 先写下一条愿望 | 首页 | 标题 | 在 首页 的 <h2> 区域展示。 | src/pages/HomeAtelier.vue:652 | 无 | 否 | 待确认 |  |
| 516 | {heroPrimaryWish?.title ?? '先写下一条愿望'} | 首页 | 标题 | 在 首页 的 <h2> 区域展示。 | src/pages/HomeAtelier.vue:652 | title | 否 | 待确认 |  |
| 517 | 愿望瓶 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:678 | 无 | 否 | 待确认 |  |
| 518 | 现在的愿望瓶 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:878 | 无 | 否 | 待确认 |  |
| 519 | 最近发生 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。；另见 空间页。 | src/pages/HomeAtelier.vue:911；src/pages/Settings.vue:739 | 无 | 否 | 待确认 |  |
| 520 | 刚刚，你们又先跟彼此说了什么 | 首页 | 标题 | 在 首页 的 <h2> 区域展示。 | src/pages/HomeAtelier.vue:912 | 无 | 否 | 待确认 |  |
| 521 | 先看看这两句近况，再决定下一步往哪条愿望靠。 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:913 | 无 | 否 | 待确认 |  |
| 522 | 再补一句 | 首页 | 标签 / 选项 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:937 | 无 | 否 | 待确认 |  |
| 523 | 最近 14 天还没有新的近况 | 首页 | 空态 / 缺省 | 在 首页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/HomeAtelier.vue:945 | 无 | 否 | 待确认 |  |
| 524 | 等下一次推进发生，这里会先替你们把这句招呼留住。 | 首页 | 标题 | 在 首页 的 <h3> 区域展示。 | src/pages/HomeAtelier.vue:946 | 无 | 否 | 待确认 |  |
| 525 | 只要有一笔留言、投币或完成步骤，对方就会先从这里看到。 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:947 | 无 | 否 | 待确认 |  |
| 526 | 一起捎来 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:952 | 无 | 否 | 待确认 |  |
| 527 | 接下来先往哪靠 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:962 | 无 | 否 | 待确认 |  |
| 528 | 下一步往哪里靠 | 首页 | 标题 | 在 首页 的 <h2> 区域展示。 | src/pages/HomeAtelier.vue:963 | 无 | 否 | 待确认 |  |
| 529 | 离约定最近 | 首页 | 标题 | 在 首页 的 <h3> 区域展示。 | src/pages/HomeAtelier.vue:979 | 无 | 否 | 待确认 |  |
| 530 | 先把最靠近日期的几条挑出来。 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:980 | 无 | 否 | 待确认 |  |
| 531 | 这里还没有靠近日期的愿望 | 首页 | 标题 | 在 首页 的 <h3> 区域展示。 | src/pages/HomeAtelier.vue:997 | 无 | 否 | 待确认 |  |
| 532 | 等你给愿望设下日期，这里就会先放出来。 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:998 | 无 | 否 | 待确认 |  |
| 533 | 最近该推进哪里 | 首页 | 标题 | 在 首页 的 <h3> 区域展示。 | src/pages/HomeAtelier.vue:1011 | 无 | 否 | 待确认 |  |
| 534 | 先看哪几条还在路上，顺手接着往前走一点。 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:1012 | 无 | 否 | 待确认 |  |
| 535 | {getWishProgressHint(wish)} | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:1020 | 无 | 否 | 待确认 |  |
| 536 | 这里还没有正在推进的愿望 | 首页 | 状态 / 反馈 / 错误 | 在 首页 的 <h3> 触发成功、失败、加载或状态更新时出现。 | src/pages/HomeAtelier.vue:1029 | 无 | 否 | 待确认 |  |
| 537 | 写下一条愿望，或者给它补一点进度，这里就会亮起来。 | 首页 | 正文 / 说明 | 在 首页 的 <p> 区域展示。 | src/pages/HomeAtelier.vue:1030 | 无 | 否 | 待确认 |  |
| 538 | 全部愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 visibilityLabels 区域展示。 | src/pages/List.vue:18 | 无 | 否 | 待确认 |  |
| 539 | 我的愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 visibilityLabels 区域展示。 | src/pages/List.vue:19 | 无 | 否 | 待确认 |  |
| 540 | 对方愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 visibilityLabels 区域展示。 | src/pages/List.vue:20 | 无 | 否 | 待确认 |  |
| 541 | 全部状态 | 清单页 | 标签 / 选项 | 在 清单页 的 statusLabels 区域展示。；另见 空间页。 | src/pages/List.vue:24；src/pages/Settings.vue:57 | 无 | 否 | 待确认 |  |
| 542 | 正在推进 | 清单页 | 状态 / 反馈 / 错误 | 在 清单页 的 statusLabels 触发成功、失败、加载或状态更新时出现。；另见 详情页。 | src/pages/List.vue:25；src/pages/WishDetailAtelier.vue:428 | 无 | 否 | 待确认 |  |
| 543 | 最近更新 | 清单页 | 正文 / 说明 | 在 清单页 的 sortLabels 区域展示。 | src/pages/List.vue:30 | 无 | 否 | 待确认 |  |
| 544 | 存在更久 | 清单页 | 正文 / 说明 | 在 清单页 的 sortLabels 区域展示。 | src/pages/List.vue:33 | 无 | 否 | 待确认 |  |
| 545 | 倒序 | 清单页 | 正文 / 说明 | 在 清单页 的 selectedSortDirectionLabel 区域展示。 | src/pages/List.vue:40 | 无 | 否 | 待确认 |  |
| 546 | 正序 | 清单页 | 正文 / 说明 | 在 清单页 的 selectedSortDirectionLabel 区域展示。 | src/pages/List.vue:40 | 无 | 否 | 待确认 |  |
| 547 | 这里只看归属于 {viewerName} 的已实现愿望。 | 清单页 | 正文 / 说明 | 在 清单页 的 archiveSummary 区域展示。 | src/pages/List.vue:44 | viewerName | 否 | 待确认 |  |
| 548 | 这里只看归属于 {viewerName} 的愿望。 | 清单页 | 正文 / 说明 | 在 清单页 的 archiveSummary 区域展示。 | src/pages/List.vue:48 | viewerName | 否 | 待确认 |  |
| 549 | 这里只看 {viewerName} 能亲自推进的愿望。 | 清单页 | 正文 / 说明 | 在 清单页 的 archiveSummary 区域展示。 | src/pages/List.vue:51 | viewerName | 否 | 待确认 |  |
| 550 | 这里只看对方的愿望，可以评论、打气，也可以看看对方最近在努力什么。 | 清单页 | 正文 / 说明 | 在 清单页 的 archiveSummary 区域展示。 | src/pages/List.vue:55 | 无 | 否 | 待确认 |  |
| 551 | 现在只看已经实现的愿望，共 {wishStore.stats.done} 条。 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:60 | wishStore.stats.done | 否 | 待确认 |  |
| 552 | 这里会收下已经实现的愿望。 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:61 | 无 | 否 | 待确认 |  |
| 553 | 现在把不同状态放在一起看，已完成 {wishStore.stats.done} 条。 | 清单页 | 标签 / 选项 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:66 | wishStore.stats.done | 否 | 待确认 |  |
| 554 | 现在会把不同状态一起显示。 | 清单页 | 标签 / 选项 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:67 | 无 | 否 | 待确认 |  |
| 555 | 已完成 {wishStore.stats.done} 条，继续收进回顾页。 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:71 | wishStore.stats.done | 否 | 待确认 |  |
| 556 | 这里只放还在推进的愿望。 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:72 | 无 | 否 | 待确认 |  |
| 557 | 正在搜「{query}」· 找到 {filteredWishes.length} 条。 | 清单页 | 状态 / 反馈 / 错误 | 在 清单页 的 query 触发成功、失败、加载或状态更新时出现。 | src/pages/List.vue:81 | query；filteredWishes.length | 否 | 待确认 |  |
| 558 | 现在先看 {selectedVisibilityLabel} · {selectedStatusLabel} · {selectedSortLabel}{selectedSortDirectionLabel}。 | 清单页 | 正文 / 说明 | 在 清单页 的 quickGuide 区域展示。 | src/pages/List.vue:89 | selectedVisibilityLabel；selectedStatusLabel；selectedSortLabel；selectedSortDirectionLabel | 否 | 待确认 |  |
| 559 | 先从眼前这批愿望里挑一条，继续往前就好。 | 清单页 | 正文 / 说明 | 在 清单页 的 quickGuide 区域展示。 | src/pages/List.vue:92 | 无 | 否 | 待确认 |  |
| 560 | 和「{query}」有关的愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 query 区域展示。 | src/pages/List.vue:98 | query | 否 | 待确认 |  |
| 561 | {viewerName} 已经实现的愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 query 区域展示。 | src/pages/List.vue:103 | viewerName | 否 | 待确认 |  |
| 562 | 对方已经实现的愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 query 区域展示。 | src/pages/List.vue:107 | 无 | 否 | 待确认 |  |
| 563 | 已经实现的愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 query 区域展示。 | src/pages/List.vue:110 | 无 | 否 | 待确认 |  |
| 564 | {viewerName} 的全部愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:115 | viewerName | 否 | 待确认 |  |
| 565 | 对方的全部愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:119 | 无 | 否 | 待确认 |  |
| 566 | 这一阵子的全部愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:122 | 无 | 否 | 待确认 |  |
| 567 | {viewerName} 今天能亲自推进的愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:126 | viewerName | 否 | 待确认 |  |
| 568 | 可以评论和打气的对方愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:130 | 无 | 否 | 待确认 |  |
| 569 | 今天继续往前的愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 页面/模块渲染或状态计算时 区域展示。 | src/pages/List.vue:133 | 无 | 否 | 待确认 |  |
| 570 | 今日清单 | 清单页 | 正文 / 说明 | 在 清单页 的 <p> 区域展示。 | src/pages/List.vue:153 | 无 | 否 | 待确认 |  |
| 571 | {viewerName}，挑一件继续 | 清单页 | 标题 | 在 清单页 的 <h1> 区域展示。 | src/pages/List.vue:154 | 无 | 否 | 待确认 |  |
| 572 | {listWorkbenchStats.activeCount} 条正在推进 · {listWorkbenchStats.currentMemberActiveCount} 条归我 · 还能获得 {listWorkbenchStats.remainingStarCoins} 星星币 | 清单页 | 状态 / 反馈 / 错误 | 在 清单页 的 <p> 触发成功、失败、加载或状态更新时出现。 | src/pages/List.vue:155 | 无 | 否 | 待确认 |  |
| 573 | 写下新愿望 | 清单页 | 按钮 / 链接 | 在 清单页 的 <RouterLink> 区域作为可点击操作出现。；另见 详情页。 | src/pages/List.vue:159；src/pages/List.vue:323；src/pages/WishDetailAtelier.vue:1027 | 无 | 否 | 待确认 |  |
| 574 | 打开回顾页 | 清单页 | 按钮 / 链接 | 在 清单页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/List.vue:160 | 无 | 否 | 待确认 |  |
| 575 | 筛选 | 清单页 | 标签 / 选项 | 在 清单页 的 <p> 区域展示。 | src/pages/List.vue:166 | 无 | 否 | 待确认 |  |
| 576 | 把眼前这批排清楚 | 清单页 | 标题 | 在 清单页 的 <h2> 区域展示。 | src/pages/List.vue:167 | 无 | 否 | 待确认 |  |
| 577 | 搜索愿望 | 清单页 | 正文 / 说明 | 在 清单页 的 <span> 区域展示。 | src/pages/List.vue:172 | 无 | 否 | 待确认 |  |
| 578 | 搜索标题、分类或写下的原因 | 清单页 | 输入占位符 | 在 清单页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/List.vue:173 | 无 | 否 | 待确认 |  |
| 579 | 先看哪一类 | 清单页 | 标签 / 选项 | 在 清单页 的 <span> 区域展示。 | src/pages/List.vue:179 | 无 | 否 | 待确认 |  |
| 580 | 现在是什么状态 | 清单页 | 标签 / 选项 | 在 清单页 的 <span> 区域展示。 | src/pages/List.vue:209 | 无 | 否 | 待确认 |  |
| 581 | 排序 | 清单页 | 标签 / 选项 | 在 清单页 的 <span> 区域展示。；另见 空间页。 | src/pages/List.vue:239；src/pages/Settings.vue:582 | 无 | 否 | 待确认 |  |
| 582 | 今天这批 | 清单页 | 正文 / 说明 | 在 清单页 的 <p> 区域展示。 | src/pages/List.vue:283 | 无 | 否 | 待确认 |  |
| 583 | {selectedStatusLabel} · {filteredWishes.length} 条 | 清单页 | 正文 / 说明 | 在 清单页 的 <span> 区域展示。 | src/pages/List.vue:289 | 无 | 否 | 待确认 |  |
| 584 | 打开详情页进度区域 | 清单页 | 可访问性 / aria | 在 清单页 的 <RouterLink> 区域供屏幕阅读器或辅助技术感知。 | src/pages/List.vue:305 | 无 | 是 | 待确认 |  |
| 585 | `当前进度 {getWishSortContext}%` | 清单页 | 可访问性 / aria | 在 清单页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/List.vue:309 | getWishSortContext | 是 | 待确认 |  |
| 586 | 这次筛选后还没有结果 | 清单页 | 标题 | 在 清单页 的 <h3> 区域展示。 | src/pages/List.vue:319 | 无 | 否 | 待确认 |  |
| 587 | 可以先清空筛选，或者写下一条新愿望。 | 清单页 | 空态 / 缺省 | 在 清单页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/List.vue:320 | 无 | 否 | 待确认 |  |
| 588 | 清空筛选 | 清单页 | 按钮 / 链接 | 在 清单页 的 <button> 区域作为可点击操作出现。；另见 空间页。 | src/pages/List.vue:322；src/pages/Settings.vue:679 | 无 | 否 | 待确认 |  |
| 589 | ../composables/useSpacePageState | 空间页 | 正文 / 说明 | 在 空间页 的 <script> 区域展示。 | src/pages/Settings.vue:5 | 无 | 否 | 待确认 |  |
| 590 | 默认 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardKeywordSortTabs 区域展示。 | src/pages/Settings.vue:41 | 无 | 否 | 待确认 |  |
| 591 | 币数 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardKeywordSortTabs 区域展示。 | src/pages/Settings.vue:42 | 无 | 否 | 待确认 |  |
| 592 | 已存 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardKeywordSortTabs 区域展示。 | src/pages/Settings.vue:43 | 无 | 否 | 待确认 |  |
| 593 | 快满 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardKeywordSortTabs 区域展示。 | src/pages/Settings.vue:44 | 无 | 否 | 待确认 |  |
| 594 | 热门 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardKeywordSortTabs 区域展示。 | src/pages/Settings.vue:45 | 无 | 否 | 待确认 |  |
| 595 | 上新 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardKeywordSortTabs 区域展示。 | src/pages/Settings.vue:46 | 无 | 否 | 待确认 |  |
| 596 | 全部 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardKeywordOwnerTabs 区域展示。 | src/pages/Settings.vue:50 | 无 | 否 | 待确认 |  |
| 597 | 我的 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardKeywordOwnerTabs 区域展示。 | src/pages/Settings.vue:51；src/pages/Settings.vue:78 | 无 | 否 | 待确认 |  |
| 598 | 对方 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardKeywordOwnerTabs 区域展示。 | src/pages/Settings.vue:52；src/pages/Settings.vue:83 | 无 | 否 | 待确认 |  |
| 599 | 共同 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardKeywordOwnerTabs 区域展示。 | src/pages/Settings.vue:53 | 无 | 否 | 待确认 |  |
| 600 | 可领取 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardKeywordStatusTabs 区域展示。 | src/pages/Settings.vue:58 | 无 | 否 | 待确认 |  |
| 601 | 未存满 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardKeywordStatusTabs 区域展示。 | src/pages/Settings.vue:59 | 无 | 否 | 待确认 |  |
| 602 | 我能存 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardKeywordStatusTabs 区域展示。 | src/pages/Settings.vue:60 | 无 | 否 | 待确认 |  |
| 603 | 领奖 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardHubTabs 区域展示。 | src/pages/Settings.vue:65 | 无 | 否 | 待确认 |  |
| 604 | 待领 / 兑换 / 记录 | 空间页 | 正文 / 说明 | 在 空间页 的 rewardHubTabs 区域展示。 | src/pages/Settings.vue:66 | 无 | 否 | 待确认 |  |
| 605 | 编辑 | 空间页 | 标签 / 选项 | 在 空间页 的 rewardHubTabs 区域展示。 | src/pages/Settings.vue:70 | 无 | 否 | 待确认 |  |
| 606 | 写入 / 整理 / 奖池 | 空间页 | 正文 / 说明 | 在 空间页 的 rewardHubTabs 区域展示。 | src/pages/Settings.vue:71 | 无 | 否 | 待确认 |  |
| 607 | 可管理 | 空间页 | 正文 / 说明 | 在 空间页 的 rewardPoolScopeTabs 区域展示。 | src/pages/Settings.vue:79 | 无 | 否 | 待确认 |  |
| 608 | 只读 | 空间页 | 正文 / 说明 | 在 空间页 的 rewardPoolScopeTabs 区域展示。；另见 详情页。 | src/pages/Settings.vue:84；src/pages/WishDetailAtelier.vue:414 | 无 | 否 | 待确认 |  |
| 609 | 邀请 | 空间页 | 标签 / 选项 | 在 空间页 的 accessPanelTabs 区域展示。 | src/pages/Settings.vue:92 | 无 | 否 | 待确认 |  |
| 610 | 邮箱 | 空间页 | 标签 / 选项 | 在 空间页 的 accessPanelTabs 区域展示。 | src/pages/Settings.vue:97 | 无 | 否 | 待确认 |  |
| 611 | 未进入 | 空间页 | 正文 / 说明 | 在 空间页 的 accessPanelTabs 区域展示。 | src/pages/Settings.vue:98；src/pages/Settings.vue:1022 | 无 | 否 | 待确认 |  |
| 612 | 记住 | 空间页 | 标签 / 选项 | 在 空间页 的 accessPanelTabs 区域展示。 | src/pages/Settings.vue:104 | 无 | 否 | 待确认 |  |
| 613 | 领奖与兑换 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubTitle 区域展示。 | src/pages/Settings.vue:120 | 无 | 否 | 待确认 |  |
| 614 | 编辑奖励池 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubTitle 区域展示。 | src/pages/Settings.vue:120 | 无 | 否 | 待确认 |  |
| 615 | 愿望推进得到的星星币，会在这里换成真正想要的奖励。 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubLead 区域展示。 | src/pages/Settings.vue:125 | 无 | 否 | 待确认 |  |
| 616 | 写新奖励、改旧奖励、整理奖池，都在这里。 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubLead 区域展示。 | src/pages/Settings.vue:129 | 无 | 否 | 待确认 |  |
| 617 | 先写下一条会让自己开心的奖励。 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubLead 区域展示。 | src/pages/Settings.vue:132 | 无 | 否 | 待确认 |  |
| 618 | 星币 {space.currentMemberStarCoins} | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubPills 区域展示。 | src/pages/Settings.vue:138；src/pages/Settings.vue:147 | space.currentMemberStarCoins | 否 | 待确认 |  |
| 619 | 奖池 {rewardKeywordEntries.length} | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubPills 区域展示。 | src/pages/Settings.vue:139 | rewardKeywordEntries.length | 否 | 待确认 |  |
| 620 | 可领 {space.claimableRewardEntries.length} | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubPills 区域展示。 | src/pages/Settings.vue:140 | space.claimableRewardEntries.length | 否 | 待确认 |  |
| 621 | 记录 {space.recentRewardClaims.length} | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubPills 区域展示。 | src/pages/Settings.vue:141 | space.recentRewardClaims.length | 否 | 待确认 |  |
| 622 | 奖励 {space.currentMemberPremiumRewards.length} | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardHubPills 区域展示。 | src/pages/Settings.vue:146 | space.currentMemberPremiumRewards.length | 否 | 待确认 |  |
| 623 | 这条奖励还没有补充说明。 | 空间页 | 空态 / 缺省 | 在 空间页 的 createRewardDisplayEntries 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:153 | 无 | 否 | 待确认 |  |
| 624 | 星币奖励 | 空间页 | 标签 / 选项 | 在 空间页 的 createRewardDisplayEntries 区域展示。 | src/pages/Settings.vue:155 | 无 | 否 | 待确认 |  |
| 625 | 个人奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 createRewardDisplayEntries 区域展示。 | src/pages/Settings.vue:157 | 无 | 否 | 待确认 |  |
| 626 | 已换 {space.wishStore.getRewardItemClaimCount} 份 | 空间页 | 正文 / 说明 | 在 空间页 的 createRewardDisplayEntries 区域展示。 | src/pages/Settings.vue:158 | space.wishStore.getRewardItemClaimCount | 否 | 待确认 |  |
| 627 | {item.starCoinCost} 星星币兑换 | 空间页 | 空态 / 缺省 | 在 空间页 的 createRewardDisplayEntries 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:159 | item.starCoinCost | 否 | 待确认 |  |
| 628 | 还没有设置价格 | 空间页 | 空态 / 缺省 | 在 空间页 的 createRewardDisplayEntries 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:159 | 无 | 否 | 待确认 |  |
| 629 | 我的奖池 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardPoolMemberName 区域展示。 | src/pages/Settings.vue:206；src/pages/Settings.vue:828 | 无 | 否 | 待确认 |  |
| 630 | 对方奖池 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardPoolMemberName 区域展示。 | src/pages/Settings.vue:207 | 无 | 否 | 待确认 |  |
| 631 | 我的星币奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardPoolEyebrow 区域展示。 | src/pages/Settings.vue:212 | 无 | 否 | 待确认 |  |
| 632 | 对方星币奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardPoolEyebrow 区域展示。 | src/pages/Settings.vue:215 | 无 | 否 | 待确认 |  |
| 633 | 邀请对方加入后，就能在这里查看对方的奖池。 | 空间页 | 正文 / 说明 | 在 空间页 的 activeRewardPoolEmpty 区域展示。 | src/pages/Settings.vue:221 | 无 | 否 | 待确认 |  |
| 634 | 还没有其他成员 | 空间页 | 标题 | 在 空间页 的 activeRewardPoolEmpty 区域展示。 | src/pages/Settings.vue:222 | 无 | 否 | 待确认 |  |
| 635 | 星币奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 tierLabel 区域展示。 | src/pages/Settings.vue:227 | 无 | 否 | 待确认 |  |
| 636 | {ownerLabel}还没有{tierLabel}。 | 空间页 | 空态 / 缺省 | 在 空间页 的 tierLabel 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:230 | ownerLabel；tierLabel | 否 | 待确认 |  |
| 637 | 还没有{tierLabel} | 空间页 | 标题 | 在 空间页 的 tierLabel 区域展示。 | src/pages/Settings.vue:231 | tierLabel | 否 | 待确认 |  |
| 638 | 星币奖励池 | 空间页 | 正文 / 说明 | 在 空间页 的 isEditing 区域展示。 | src/pages/Settings.vue:368 | 无 | 否 | 待确认 |  |
| 639 | 奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 isEditing 区域展示。 | src/pages/Settings.vue:369 | 无 | 否 | 待确认 |  |
| 640 | 正在修改这条奖励。 | 空间页 | 按钮 / 链接 | 在 空间页 的 isEditing 区域作为可点击操作出现。 | src/pages/Settings.vue:371 | 无 | 否 | 待确认 |  |
| 641 | 保存后会进入星币奖励池。 | 空间页 | 按钮 / 链接 | 在 空间页 的 isEditing 区域作为可点击操作出现。 | src/pages/Settings.vue:371 | 无 | 否 | 待确认 |  |
| 642 | 保存中... | 空间页 | 按钮 / 链接 | 在 空间页 的 isEditing 区域作为可点击操作出现。 | src/pages/Settings.vue:372 | 无 | 否 | 待确认 |  |
| 643 | 更新奖励 | 空间页 | 按钮 / 链接 | 在 空间页 的 isEditing 区域作为可点击操作出现。 | src/pages/Settings.vue:372 | 无 | 否 | 待确认 |  |
| 644 | 加入奖励 | 空间页 | 按钮 / 链接 | 在 空间页 的 isEditing 区域作为可点击操作出现。 | src/pages/Settings.vue:372 | 无 | 否 | 待确认 |  |
| 645 | 已存 {getRewardDepositedAmount} | 空间页 | 正文 / 说明 | 在 空间页 的 getRewardKeywordMetricLabel 区域展示。 | src/pages/Settings.vue:433 | getRewardDepositedAmount | 否 | 待确认 |  |
| 646 | 还差 {getRewardRemainingAmount} | 空间页 | 正文 / 说明 | 在 空间页 的 getRewardKeywordMetricLabel 区域展示。 | src/pages/Settings.vue:437 | getRewardRemainingAmount | 否 | 待确认 |  |
| 647 | 可领 | 空间页 | 正文 / 说明 | 在 空间页 的 getRewardKeywordMetricLabel 区域展示。 | src/pages/Settings.vue:437 | 无 | 否 | 待确认 |  |
| 648 | 领 {getRewardClaimCount} | 空间页 | 正文 / 说明 | 在 空间页 的 getRewardKeywordMetricLabel 区域展示。 | src/pages/Settings.vue:441 | getRewardClaimCount | 否 | 待确认 |  |
| 649 | 今天新 | 空间页 | 正文 / 说明 | 在 空间页 的 days 区域展示。 | src/pages/Settings.vue:446 | 无 | 否 | 待确认 |  |
| 650 | {days}天新 | 空间页 | 正文 / 说明 | 在 空间页 的 days 区域展示。 | src/pages/Settings.vue:446 | days | 否 | 待确认 |  |
| 651 | {entry.item.starCoinCost}星星币 | 空间页 | 正文 / 说明 | 在 空间页 的 days 区域展示。 | src/pages/Settings.vue:449 | entry.item.starCoinCost | 否 | 待确认 |  |
| 652 | {entry.ownerName}的奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 getRewardKeywordOwnerLabel 区域展示。 | src/pages/Settings.vue:454 | entry.ownerName | 否 | 待确认 |  |
| 653 | 等待对方领取 | 空间页 | 正文 / 说明 | 在 空间页 的 getSelectedRewardPrimaryLabel 区域展示。 | src/pages/Settings.vue:462 | 无 | 否 | 待确认 |  |
| 654 | 共同空间 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:507 | 无 | 否 | 待确认 |  |
| 655 | 把两个人的日常收在同一页 | 空间页 | 标题 | 在 空间页 的 <h1> 区域展示。 | src/pages/Settings.vue:508 | 无 | 否 | 待确认 |  |
| 656 | 成员、邀请、奖励和照片，都从这里往后翻。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:509 | 无 | 否 | 待确认 |  |
| 657 | 空间摘要 | 空间页 | 可访问性 / aria | 在 空间页 的 <aside> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:512 | 无 | 是 | 待确认 |  |
| 658 | {space.currentRoleLabel} · 奖励 {space.currentMemberRewardCount} 条 · 星币 {space.currentMemberStarCoins} 枚 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:519 | 无 | 否 | 待确认 |  |
| 659 | 奖励中心 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:529 | 无 | 否 | 待确认 |  |
| 660 | 奖励中心切换 | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:539 | 无 | 是 | 待确认 |  |
| 661 | 手里星币 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:559 | 无 | 否 | 待确认 |  |
| 662 | 奖池词条 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:563 | 无 | 否 | 待确认 |  |
| 663 | 现在可领 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:567 | 无 | 否 | 待确认 |  |
| 664 | 管理奖励 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:573 | 无 | 否 | 待确认 |  |
| 665 | 写一条奖励 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:574；src/pages/Settings.vue:733 | 无 | 否 | 待确认 |  |
| 666 | 奖励奖池筛选排序 | 空间页 | 可访问性 / aria | 在 空间页 的 <section> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:580 | 无 | 是 | 待确认 |  |
| 667 | 排序方式 | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:583 | 无 | 是 | 待确认 |  |
| 668 | 归属 | 空间页 | 标签 / 选项 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:598 | 无 | 否 | 待确认 |  |
| 669 | 奖励归属筛选 | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:599 | 无 | 是 | 待确认 |  |
| 670 | 状态 | 空间页 | 标签 / 选项 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:614 | 无 | 否 | 待确认 |  |
| 671 | 奖励状态筛选 | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:615 | 无 | 是 | 待确认 |  |
| 672 | hasRewardKeywordFilters | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:633 | 无 | 否 | 待确认 |  |
| 673 | clearRewardKeywordFilters | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:633；src/pages/Settings.vue:679 | 无 | 否 | 待确认 |  |
| 674 | 清空 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:633 | 无 | 否 | 待确认 |  |
| 675 | 需要星币 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:638 | 无 | 否 | 待确认 |  |
| 676 | 最小 | 空间页 | 输入占位符 | 在 空间页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/Settings.vue:639；src/pages/Settings.vue:644 | 无 | 否 | 待确认 |  |
| 677 | 最大 | 空间页 | 输入占位符 | 在 空间页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/Settings.vue:640；src/pages/Settings.vue:645 | 无 | 否 | 待确认 |  |
| 678 | 已存星币 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:643 | 无 | 否 | 待确认 |  |
| 679 | 奖池 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:653；src/pages/Settings.vue:823 | 无 | 否 | 待确认 |  |
| 680 | 点一个奖励，看它现在能不能兑现 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:654 | 无 | 否 | 待确认 |  |
| 681 | {visibleRewardKeywordEntries.length} / {rewardKeywordEntries.length} 条 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:656 | 无 | 否 | 待确认 |  |
| 682 | 奖励词条奖池 | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:659 | 无 | 是 | 待确认 |  |
| 683 | 没有符合条件的奖励 | 空间页 | 空态 / 缺省 | 在 空间页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:677 | 无 | 否 | 待确认 |  |
| 684 | 试试放宽币数区间，或清空筛选。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:678 | 无 | 否 | 待确认 |  |
| 685 | {selectedRewardEntry.item.starCoinCost} 星币 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:689 | 无 | 否 | 待确认 |  |
| 686 | `已存入 {space.getRewardDepositPercent}%` | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:692 | space.getRewardDepositPercent | 是 | 待确认 |  |
| 687 | 已存 {space.getRewardDepositedStarCoins(selectedRewardEntry.item)} / {selectedRewardEntry.item.starCoinCost} | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:697 | 无 | 否 | 待确认 |  |
| 688 | 还差 {space.getRewardRemainingStarCoins} 枚 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:698 | space.getRewardRemainingStarCoins | 否 | 待确认 |  |
| 689 | 已经存满 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:698 | 无 | 否 | 待确认 |  |
| 690 | {space.getRewardRemainingStarCoins(selectedRewardEntry.item) > 0 ? `还差 {space.getRewardRemainingStarCoins} 枚` : '已经存满'} | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:698 | space.getRewardRemainingStarCoins | 否 | 待确认 |  |
| 691 | 已领 {space.wishStore.getRewardItemClaimCount(selectedRewardEntry.item)} 份 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:699 | 无 | 否 | 待确认 |  |
| 692 | 处理中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:709 | 无 | 否 | 待确认 |  |
| 693 | selectedRewardEntry.kind === 'assist' ? '快捷助力金额' : '快捷存入金额' | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:714 | 无 | 是 | 待确认 |  |
| 694 | 还没有可以推进的奖励 | 空间页 | 空态 / 缺省 | 在 空间页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:731 | 无 | 否 | 待确认 |  |
| 695 | 先写一条有星星币价格的奖励，它就会出现在这里。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:732 | 无 | 否 | 待确认 |  |
| 696 | 奖励记录 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:740 | 无 | 否 | 待确认 |  |
| 697 | {space.recentRewardClaims.length} 笔 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:742 | 无 | 否 | 待确认 |  |
| 698 | 还没有领取记录 | 空间页 | 空态 / 缺省 | 在 空间页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:757 | 无 | 否 | 待确认 |  |
| 699 | 第一次存入或领取后会显示在这里。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:758 | 无 | 否 | 待确认 |  |
| 700 | 编辑区 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:767 | 无 | 否 | 待确认 |  |
| 701 | 写下和整理奖励 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:768 | 无 | 否 | 待确认 |  |
| 702 | 奖励名称 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:777 | 无 | 否 | 待确认 |  |
| 703 | 例如：心仪很久的大件 / 一次认真放松的体验 | 空间页 | 输入占位符 | 在 空间页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/Settings.vue:778 | 无 | 否 | 待确认 |  |
| 704 | 说明（可选） | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:781 | 无 | 否 | 待确认 |  |
| 705 | 写下这个奖励真正吸引你的地方 | 空间页 | 输入占位符 | 在 空间页 的 <textarea> 表单输入框为空时作为占位提示出现。 | src/pages/Settings.vue:782 | 无 | 否 | 待确认 |  |
| 706 | 星星币兑换价 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:785 | 无 | 否 | 待确认 |  |
| 707 | 奖励归属 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:789 | 无 | 否 | 待确认 |  |
| 708 | 奖励归属 | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:790 | 无 | 是 | 待确认 |  |
| 709 | 个人 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:793 | 无 | 否 | 待确认 |  |
| 710 | 取消编辑 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:810 | 无 | 否 | 待确认 |  |
| 711 | 查看和管理奖励 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:824 | 无 | 否 | 待确认 |  |
| 712 | 对方只读 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:828 | 无 | 否 | 待确认 |  |
| 713 | {rewardPoolScope === 'mine' ? '我的奖池' : '对方只读'} | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:828 | 无 | 否 | 待确认 |  |
| 714 | {activeRewardPoolEntries.length} 条 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:829；src/pages/Settings.vue:882 | 无 | 否 | 待确认 |  |
| 715 | 奖池范围切换 | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:834 | 无 | 是 | 待确认 |  |
| 716 | 选择要查看的成员奖池 | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:850 | 无 | 是 | 待确认 |  |
| 717 | 对方 · {item.starCoins} 枚星星币 · {item.rewardCount} 条奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:863 | 无 | 否 | 待确认 |  |
| 718 | 成员奖励摘要 | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:867 | 无 | 是 | 待确认 |  |
| 719 | {item.premiumRewards.length} 奖励 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:868 | 无 | 否 | 待确认 |  |
| 720 | {item.starCoins} 星币 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:869 | 无 | 否 | 待确认 |  |
| 721 | 管理 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:890 | 无 | 否 | 待确认 |  |
| 722 | 只读查看 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:892 | 无 | 否 | 待确认 |  |
| 723 | 编辑 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:916 | 无 | 否 | 待确认 |  |
| 724 | 删除中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。；另见 详情页。 | src/pages/Settings.vue:923；src/pages/WishDetailAtelier.vue:617；src/pages/WishDetailAtelier.vue:961 | 无 | 否 | 待确认 |  |
| 725 | 删除 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。；另见 详情页。 | src/pages/Settings.vue:923；src/pages/WishDetailAtelier.vue:803；src/pages/WishDetailAtelier.vue:910 | 无 | 否 | 待确认 |  |
| 726 | 后页工具 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:942 | 无 | 否 | 待确认 |  |
| 727 | 需要时再往后翻 | 空间页 | 标题 | 在 空间页 的 <h2> 区域展示。 | src/pages/Settings.vue:943 | 无 | 否 | 待确认 |  |
| 728 | 进入与邀请 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:952 | 无 | 否 | 待确认 |  |
| 729 | 需要时再来处理进入方式 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:953 | 无 | 否 | 待确认 |  |
| 730 | 进入方式 | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:969 | 无 | 是 | 待确认 |  |
| 731 | 把对方带进来 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:988 | 无 | 否 | 待确认 |  |
| 732 | 邀请对方 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:989 | 无 | 否 | 待确认 |  |
| 733 | 邀请口令 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:998 | 无 | 否 | 待确认 |  |
| 734 | 复制 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:1001 | 无 | 否 | 待确认 |  |
| 735 | space.joinSpace | 空间页 | 按钮 / 链接 | 在 空间页 的 <form> 区域作为可点击操作出现。 | src/pages/Settings.vue:1004 | 无 | 否 | 待确认 |  |
| 736 | 对方发来的邀请口令 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:1006 | 无 | 否 | 待确认 |  |
| 737 | space.isJoiningSpace | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:1009 | 无 | 否 | 待确认 |  |
| 738 | 确认中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:1010 | 无 | 否 | 待确认 |  |
| 739 | 确认加入 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:1010 | 无 | 否 | 待确认 |  |
| 740 | 确认后会尝试走进同一间空间，不会盖掉你已经写下的愿望。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:1013 | 无 | 否 | 待确认 |  |
| 741 | 邮箱走进来 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:1019 | 无 | 否 | 待确认 |  |
| 742 | 邮箱进入 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:1020 | 无 | 否 | 待确认 |  |
| 743 | {space.authStore.isAuthenticated ? '已进入' : '未进入'} | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:1022 | 无 | 否 | 待确认 |  |
| 744 | 把邮箱和这间空间连上，回来就不用每次都靠邀请码。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:1025 | 无 | 否 | 待确认 |  |
| 745 | 邮箱 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:1029；src/pages/Settings.vue:1064 | 无 | 否 | 待确认 |  |
| 746 | 发送中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:1033 | 无 | 否 | 待确认 |  |
| 747 | 发送验证邮件 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:1033 | 无 | 否 | 待确认 |  |
| 748 | 邮箱验证码 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:1039 | 无 | 否 | 待确认 |  |
| 749 | 输入邮件里的验证码 | 空间页 | 输入占位符 | 在 空间页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/Settings.vue:1040 | 无 | 否 | 待确认 |  |
| 750 | 校验中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:1043 | 无 | 否 | 待确认 |  |
| 751 | 确认进入 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:1043 | 无 | 否 | 待确认 |  |
| 752 | 按 {space.otpTargetEmail} 校验；换邮箱后先重发一次。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:1046 | 无 | 否 | 待确认 |  |
| 753 | 记住这个入口 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:1054 | 无 | 否 | 待确认 |  |
| 754 | 记住常用邮箱 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:1055 | 无 | 否 | 待确认 |  |
| 755 | 仅创建者可用 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:1057 | 无 | 否 | 待确认 |  |
| 756 | 把常用邮箱记在这间空间上，后面回来会更快。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:1060 | 无 | 否 | 待确认 |  |
| 757 | 显示名称（可选） | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:1068 | 无 | 否 | 待确认 |  |
| 758 | 例如：晨光 / 星野 | 空间页 | 输入占位符 | 在 空间页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/Settings.vue:1069 | 无 | 否 | 待确认 |  |
| 759 | 保存中... | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。；另见 详情页。 | src/pages/Settings.vue:1072；src/pages/WishDetailAtelier.vue:628；src/pages/WishDetailAtelier.vue:749；src/pages/WishDetailAtelier.vue:856 | 无 | 否 | 待确认 |  |
| 760 | 记住这个邮箱 | 空间页 | 正文 / 说明 | 在 空间页 的 <button> 区域展示。 | src/pages/Settings.vue:1072 | 无 | 否 | 待确认 |  |
| 761 | 这里只是把邮箱和显示名称记在这间空间上，不会替你发送邮件。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:1075 | 无 | 否 | 待确认 |  |
| 762 | 照片与备份 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:1086 | 无 | 否 | 待确认 |  |
| 763 | 照片空间和备份都放在这里 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:1087 | 无 | 否 | 待确认 |  |
| 764 | 已用 {space.storageSummary.usagePercent}% | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:1093 | 无 | 否 | 待确认 |  |
| 765 | 云端空间 | 空间页 | 空态 / 缺省 | 在 空间页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:1094 | 无 | 否 | 待确认 |  |
| 766 | 本地体验空间 | 空间页 | 空态 / 缺省 | 在 空间页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:1094 | 无 | 否 | 待确认 |  |
| 767 | {space.authStore.usesSupabaseSpace ? '云端空间' : '本地体验空间'} | 空间页 | 空态 / 缺省 | 在 空间页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:1094 | 无 | 否 | 待确认 |  |
| 768 | `照片空间已使用 {space.storageSummary.usagePercent}%` | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:1106 | space.storageSummary.usagePercent | 是 | 待确认 |  |
| 769 | 再多传几张后，这里会显示还能放多少。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:1124 | 无 | 否 | 待确认 |  |
| 770 | 按现在的大小，大约还能放 {space.estimatedRemainingImageCount} 张。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:1125 | space.estimatedRemainingImageCount | 否 | 待确认 |  |
| 771 | 备份会带上清单、星币奖励和记录 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:1128 | 无 | 否 | 待确认 |  |
| 772 | 两个人最好各自留一份 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:1129 | 无 | 否 | 待确认 |  |
| 773 | 备份清单 | 空间页 | 按钮 / 链接 | 在 空间页 的 <button> 区域作为可点击操作出现。 | src/pages/Settings.vue:1132 | 无 | 否 | 待确认 |  |
| 774 | 同步与退出 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:1143 | 无 | 否 | 待确认 |  |
| 775 | 同步详情和退出 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:1144 | 无 | 否 | 待确认 |  |
| 776 | 同步状态 | 空间页 | 标签 / 选项 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:1163 | 无 | 否 | 待确认 |  |
| 777 | 云端数据 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:1166 | 无 | 否 | 待确认 |  |
| 778 | 本地体验 | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:1166 | 无 | 否 | 待确认 |  |
| 779 | {space.authStore.usesSupabaseSpace ? '云端数据' : '本地体验'} | 空间页 | 正文 / 说明 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:1166 | 无 | 否 | 待确认 |  |
| 780 | 同步详情 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:1175 | 无 | 否 | 待确认 |  |
| 781 | 连接与数据来源 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:1176 | 无 | 否 | 待确认 |  |
| 782 | 离开这台设备 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:1200 | 无 | 否 | 待确认 |  |
| 783 | 退出登录 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:1201 | 无 | 否 | 待确认 |  |
| 784 | 这里只会退出当前设备上的登录状态，不会删掉这间空间或已经写下的内容。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:1205 | 无 | 否 | 待确认 |  |
| 785 | 当前还没有登录中的邮箱会话。 | 空间页 | 空态 / 缺省 | 在 空间页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Settings.vue:1211 | 无 | 否 | 待确认 |  |
| 786 | 外观 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:1221 | 无 | 否 | 待确认 |  |
| 787 | 选择这台设备的页面颜色 | 空间页 | 标题 | 在 空间页 的 <h3> 区域展示。 | src/pages/Settings.vue:1222 | 无 | 否 | 待确认 |  |
| 788 | 当前：{selectedTheme.label} | 空间页 | 标签 / 选项 | 在 空间页 的 <span> 区域展示。 | src/pages/Settings.vue:1225 | 无 | 否 | 待确认 |  |
| 789 | 这里会保存到当前浏览器。切换正式外观时，会清掉调色工作台的临时草稿。 | 空间页 | 正文 / 说明 | 在 空间页 的 <p> 区域展示。 | src/pages/Settings.vue:1233 | 无 | 否 | 待确认 |  |
| 790 | 外观切换 | 空间页 | 可访问性 / aria | 在 空间页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Settings.vue:1235 | 无 | 是 | 待确认 |  |
| 791 | 这一期封面 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:50 | 无 | 否 | 待确认 |  |
| 792 | 这一期的成员近况 | 回顾页 | 可访问性 / aria | 在 回顾页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Stats.vue:57 | 无 | 是 | 待确认 |  |
| 793 | {currentMonthLabel} 正在写这一期 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <span> 区域作为可点击操作出现。 | src/pages/Stats.vue:66 | 无 | 否 | 待确认 |  |
| 794 | 翻这一期 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <button> 区域作为可点击操作出现。 | src/pages/Stats.vue:72 | 无 | 否 | 待确认 |  |
| 795 | 回清单添一笔 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Stats.vue:73 | 无 | 否 | 待确认 |  |
| 796 | 这一期最先翻到 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:81 | 无 | 否 | 待确认 |  |
| 797 | 最近留下的共同记录 | 回顾页 | 标题 | 在 回顾页 的 <h3> 区域展示。 | src/pages/Stats.vue:82 | 无 | 否 | 待确认 |  |
| 798 | {featuredReviewThreads.length} 条 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:84 | 无 | 否 | 待确认 |  |
| 799 | 继续翻阅 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:115 | 无 | 否 | 待确认 |  |
| 800 | 接着翻哪一章 | 回顾页 | 标题 | 在 回顾页 的 <h3> 区域展示。 | src/pages/Stats.vue:116 | 无 | 否 | 待确认 |  |
| 801 | 先看正在发生的这一期，再回头看完成和封存。 | 回顾页 | 状态 / 反馈 / 错误 | 在 回顾页 的 <p> 触发成功、失败、加载或状态更新时出现。 | src/pages/Stats.vue:117 | 无 | 否 | 待确认 |  |
| 802 | 完成册页 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:146 | 无 | 否 | 待确认 |  |
| 803 | 已经走完整条路的这些册页 | 回顾页 | 标题 | 在 回顾页 的 <h2> 区域展示。 | src/pages/Stats.vue:147 | 无 | 否 | 待确认 |  |
| 804 | 这些愿望已经完成，更适合回头翻过程。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:148 | 无 | 否 | 待确认 |  |
| 805 | 完成手账 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:156 | 无 | 否 | 待确认 |  |
| 806 | 实现于 {formatDateLabel(wish.completedAt ?? wish.updatedAt)} | 回顾页 | 正文 / 说明 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:157 | 无 | 否 | 待确认 |  |
| 807 | 这条愿望已经完成，适合回头翻过程。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:167 | 无 | 否 | 待确认 |  |
| 808 | 最近摘录 | 回顾页 | 标签 / 选项 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:171 | 无 | 否 | 待确认 |  |
| 809 | 最近翻到的三笔 | 回顾页 | 标签 / 选项 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:177 | 无 | 否 | 待确认 |  |
| 810 | 先从最后几句开始读，会更快想起来。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:178 | 无 | 否 | 待确认 |  |
| 811 | 翻完整过程 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Stats.vue:193 | 无 | 否 | 待确认 |  |
| 812 | 完成手账还在等第一册 | 回顾页 | 空态 / 缺省 | 在 回顾页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Stats.vue:199 | 无 | 否 | 待确认 |  |
| 813 | 还没有愿望被正式收进这册手账 | 回顾页 | 标题 | 在 回顾页 的 <h3> 区域展示。 | src/pages/Stats.vue:200 | 无 | 否 | 待确认 |  |
| 814 | 等第一条愿望完成后，它就会留在这里。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:201 | 无 | 否 | 待确认 |  |
| 815 | 先从清单里挑一条 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <strong> 区域展示。 | src/pages/Stats.vue:204 | 无 | 否 | 待确认 |  |
| 816 | 挑一条最想先看见结果的愿望。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:205 | 无 | 否 | 待确认 |  |
| 817 | 推进、留言、投币 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <strong> 区域展示。 | src/pages/Stats.vue:208 | 无 | 否 | 待确认 |  |
| 818 | 这些过程会先被详情页收住，完成后再翻到这里。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:209 | 无 | 否 | 待确认 |  |
| 819 | 回清单推进一条 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Stats.vue:213；src/pages/Stats.vue:287 | 无 | 否 | 待确认 |  |
| 820 | 再写下一条愿望 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Stats.vue:214 | 无 | 否 | 待确认 |  |
| 821 | {currentMonthLabel} 还在继续写 | 回顾页 | 标题 | 在 回顾页 的 <h2> 区域展示。 | src/pages/Stats.vue:223 | 无 | 否 | 待确认 |  |
| 822 | 这里先保留这个月还在发生的记录。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:224 | 无 | 否 | 待确认 |  |
| 823 | 这条记录收到的表情 | 回顾页 | 可访问性 / aria | 在 回顾页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/Stats.vue:242 | 无 | 是 | 待确认 |  |
| 824 | 回到这条愿望 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Stats.vue:267 | 无 | 否 | 待确认 |  |
| 825 | 本月页还很安静 | 回顾页 | 空态 / 缺省 | 在 回顾页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Stats.vue:273 | 无 | 否 | 待确认 |  |
| 826 | 这一期还没有新的实时记录 | 回顾页 | 标题 | 在 回顾页 的 <h3> 区域展示。 | src/pages/Stats.vue:274 | 无 | 否 | 待确认 |  |
| 827 | 评论、投币、完成步骤和领奖都会先落在这里，月后再封存。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:275 | 无 | 否 | 待确认 |  |
| 828 | 先让这一期开始动起来 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <strong> 区域展示。 | src/pages/Stats.vue:278 | 无 | 否 | 待确认 |  |
| 829 | 只要有一条愿望被留言、推进或投币，这里就会开始有内容。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:279 | 无 | 否 | 待确认 |  |
| 830 | 月底会自动封存 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <strong> 区域展示。 | src/pages/Stats.vue:282 | 无 | 否 | 待确认 |  |
| 831 | 现在发生的是实时版本，过了这个月才会成册。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:283 | 无 | 否 | 待确认 |  |
| 832 | 先写下一条愿望 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/Stats.vue:288 | 无 | 否 | 待确认 |  |
| 833 | 已封存月刊 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:296 | 无 | 否 | 待确认 |  |
| 834 | 已经封存下来的固定月刊 | 回顾页 | 标题 | 在 回顾页 的 <h2> 区域展示。 | src/pages/Stats.vue:297 | 无 | 否 | 待确认 |  |
| 835 | 这些页面不会再变化，适合回头慢慢翻看。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:298 | 无 | 否 | 待确认 |  |
| 836 | 固定月刊 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:306 | 无 | 否 | 待确认 |  |
| 837 | {formatDateLabel(snapshot.createdAt)} 冻结 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:307 | 无 | 否 | 待确认 |  |
| 838 | 收进本册的记录 | 回顾页 | 标签 / 选项 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:318 | 无 | 否 | 待确认 |  |
| 839 | 卷期 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:332 | 无 | 否 | 待确认 |  |
| 840 | 封面前三段 | 回顾页 | 标签 / 选项 | 在 回顾页 的 <span> 区域展示。 | src/pages/Stats.vue:339 | 无 | 否 | 待确认 |  |
| 841 | 先看这册最前面的几段，再决定要不要回头翻完整过程。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:340 | 无 | 否 | 待确认 |  |
| 842 | 固定月刊还没有第一册 | 回顾页 | 空态 / 缺省 | 在 回顾页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/Stats.vue:363 | 无 | 否 | 待确认 |  |
| 843 | 还没有封存好的月刊 | 回顾页 | 标题 | 在 回顾页 的 <h3> 区域展示。 | src/pages/Stats.vue:364 | 无 | 否 | 待确认 |  |
| 844 | 月份切换时，系统会把已经过去的月份自动冻结成固定版本。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:365 | 无 | 否 | 待确认 |  |
| 845 | 先让这个月留下内容 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <strong> 区域展示。 | src/pages/Stats.vue:368 | 无 | 否 | 待确认 |  |
| 846 | 实时回顾里要先有过程，月底它才有东西能被封存。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:369 | 无 | 否 | 待确认 |  |
| 847 | 等月份切换自动成册 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <strong> 区域展示。 | src/pages/Stats.vue:372 | 无 | 否 | 待确认 |  |
| 848 | 这一步不用手动操作，月份过去后系统会自己归档。 | 回顾页 | 正文 / 说明 | 在 回顾页 的 <p> 区域展示。 | src/pages/Stats.vue:373 | 无 | 否 | 待确认 |  |
| 849 | 先看这一期 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <button> 区域作为可点击操作出现。 | src/pages/Stats.vue:377 | 无 | 否 | 待确认 |  |
| 850 | 回清单继续推进 | 回顾页 | 按钮 / 链接 | 在 回顾页 的 <RouterLink> 区域作为可点击操作出现。；另见 详情页。 | src/pages/Stats.vue:378；src/pages/WishDetailAtelier.vue:233 | 无 | 否 | 待确认 |  |
| 851 | 还没有分类 | 详情页 | 空态 / 缺省 | 在 详情页 的 detailTags 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:124 | 无 | 否 | 待确认 |  |
| 852 | 已完成 | 详情页 | 正文 / 说明 | 在 详情页 的 detailTags 区域展示。 | src/pages/WishDetailAtelier.vue:126 | 无 | 否 | 待确认 |  |
| 853 | 进行中 | 详情页 | 正文 / 说明 | 在 详情页 的 detailTags 区域展示。 | src/pages/WishDetailAtelier.vue:126 | 无 | 否 | 待确认 |  |
| 854 | 封面图 | 详情页 | 正文 / 说明 | 在 详情页 的 getPreviewImageCaption 区域展示。 | src/pages/WishDetailAtelier.vue:180 | 无 | 否 | 待确认 |  |
| 855 | 愿望图片 | 详情页 | 正文 / 说明 | 在 详情页 的 getPreviewImageCaption 区域展示。 | src/pages/WishDetailAtelier.vue:180 | 无 | 否 | 待确认 |  |
| 856 | 评论图片 | 详情页 | 正文 / 说明 | 在 详情页 的 threadMessage 区域展示。 | src/pages/WishDetailAtelier.vue:186 | 无 | 否 | 待确认 |  |
| 857 | 这条愿望暂时还没有移走，请稍后再试。 | 详情页 | 状态 / 反馈 / 错误 | 在 详情页 的 deleted 触发成功、失败、加载或状态更新时出现。 | src/pages/WishDetailAtelier.vue:215 | 无 | 否 | 待确认 |  |
| 858 | 这一页愿望 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:232 | 无 | 否 | 待确认 |  |
| 859 | 先留一个短标题也没关系，后面还可以在这里补充动机、背景和下一步。 | 详情页 | 标题 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:239 | 无 | 否 | 待确认 |  |
| 860 | 手账记录 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:249 | 无 | 否 | 待确认 |  |
| 861 | 推进、留言和完成都会留在这里 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:251 | 无 | 否 | 待确认 |  |
| 862 | {currentMemberStarCoins} 枚 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:255 | 无 | 否 | 待确认 |  |
| 863 | 攒着，去空间页接住大奖励 | 详情页 | 空态 / 缺省 | 在 详情页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:256 | 无 | 否 | 待确认 |  |
| 864 | `{selectedWish.title} 首图` | 详情页 | 标题 | 在 详情页 的 <img> 区域展示。 | src/pages/WishDetailAtelier.vue:268；src/pages/WishDetailAtelier.vue:330 | selectedWish.title；title | 否 | 待确认 |  |
| 865 | 上传中... | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:277；src/pages/WishDetailAtelier.vue:339 | 无 | 否 | 待确认 |  |
| 866 | 添加首图 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:277；src/pages/WishDetailAtelier.vue:339；src/pages/WishDetailAtelier.vue:357 | 无 | 否 | 待确认 |  |
| 867 | {isUploadingImages ? '上传中...' : '添加首图'} | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:277；src/pages/WishDetailAtelier.vue:339 | 无 | 否 | 待确认 |  |
| 868 | 还没有封面 | 详情页 | 空态 / 缺省 | 在 详情页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:280 | 无 | 否 | 待确认 |  |
| 869 | 写下的人 | 详情页 | 标签 / 选项 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:287；src/pages/WishDetailAtelier.vue:307 | 无 | 否 | 待确认 |  |
| 870 | 当前标签 | 详情页 | 标签 / 选项 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:291；src/pages/WishDetailAtelier.vue:311 | 无 | 否 | 待确认 |  |
| 871 | 这页进展 | 详情页 | 标签 / 选项 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:295；src/pages/WishDetailAtelier.vue:315 | 无 | 否 | 待确认 |  |
| 872 | {detailImageCount} 张图 · {wishJournalEntries.length} 条记录 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:296；src/pages/WishDetailAtelier.vue:316 | 无 | 否 | 待确认 |  |
| 873 | 创建时间 | 详情页 | 标签 / 选项 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:299；src/pages/WishDetailAtelier.vue:319 | 无 | 否 | 待确认 |  |
| 874 | rewardFeedback && !stepRewardFeedbackTargetId && !isCountProgressFeedback | 详情页 | 可访问性 / aria | 在 详情页 的 <p> 区域供屏幕阅读器或辅助技术感知。 | src/pages/WishDetailAtelier.vue:325 | 无 | 是 | 待确认 |  |
| 875 | 这页还在等一张封面 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:342 | 无 | 否 | 待确认 |  |
| 876 | 封面首图 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:346 | 无 | 否 | 待确认 |  |
| 877 | 已经留住一张首图 | 详情页 | 空态 / 缺省 | 在 详情页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:347 | 无 | 否 | 待确认 |  |
| 878 | 还没有留下首图 | 详情页 | 空态 / 缺省 | 在 详情页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:347 | 无 | 否 | 待确认 |  |
| 879 | {coverImageEntry ? '已经留住一张首图' : '还没有留下首图'} | 详情页 | 空态 / 缺省 | 在 详情页 的 <span> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:347 | 无 | 否 | 待确认 |  |
| 880 | 换图 | 详情页 | 正文 / 说明 | 在 详情页 的 <input> 区域展示。 | src/pages/WishDetailAtelier.vue:357 | 无 | 否 | 待确认 |  |
| 881 | 推进痕迹 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:375 | 无 | 否 | 待确认 |  |
| 882 | 这条愿望正走到哪里 | 详情页 | 标题 | 在 详情页 的 <h2> 区域展示。 | src/pages/WishDetailAtelier.vue:376 | 无 | 否 | 待确认 |  |
| 883 | 还没开始 | 详情页 | 标签 / 选项 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:378 | 无 | 否 | 待确认 |  |
| 884 | {progressSnapshot?.label \|\| '还没开始'} | 详情页 | 标签 / 选项 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:378 | 无 | 否 | 待确认 |  |
| 885 | 步骤进度 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:385；src/pages/WishDetailAtelier.vue:433 | 无 | 否 | 待确认 |  |
| 886 | 进度记录 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:385 | 无 | 否 | 待确认 |  |
| 887 | {progressSnapshot?.mode === 'steps' ? '步骤进度' : progressSnapshot?.mode === 'count' ? '数字进度' : '进度记录'} | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:385 | 无 | 否 | 待确认 |  |
| 888 | `当前进度 {progressSnapshot}` | 详情页 | 可访问性 / aria | 在 详情页 的 <div> 区域供屏幕阅读器或辅助技术感知。 | src/pages/WishDetailAtelier.vue:388 | progressSnapshot | 是 | 待确认 |  |
| 889 | 先让它继续往前一点 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:396 | 无 | 否 | 待确认 |  |
| 890 | 你可以评论和打气，进度由愿望归属人推进。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:397 | 无 | 否 | 待确认 |  |
| 891 | {canProgressSelectedWish ? getCountStarCoinLabel() : '你可以评论和打气，进度由愿望归属人推进。'} | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:397 | 无 | 否 | 待确认 |  |
| 892 | canProgressSelectedWish | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:399；src/pages/WishDetailAtelier.vue:409；src/pages/WishDetailAtelier.vue:449；src/pages/WishDetailAtelier.vue:463 | 无 | 否 | 待确认 |  |
| 893 | void adjustCountProgress(1) | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:399 | 无 | 否 | 待确认 |  |
| 894 | rewardFeedback && isCountProgressFeedback | 详情页 | 可访问性 / aria | 在 详情页 的 <p> 区域供屏幕阅读器或辅助技术感知。 | src/pages/WishDetailAtelier.vue:402 | 无 | 是 | 待确认 |  |
| 895 | !canProgressSelectedWish | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:414 | 无 | 否 | 待确认 |  |
| 896 | 还没有下一步 | 详情页 | 标题 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:429 | 无 | 否 | 待确认 |  |
| 897 | {mobilePrimaryStep?.title \|\| '还没有下一步'} | 详情页 | 标题 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:429 | title | 否 | 待确认 |  |
| 898 | 先把眼前这一步走完。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:430 | 无 | 否 | 待确认 |  |
| 899 | 这条步骤愿望已经全部走完。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:430 | 无 | 否 | 待确认 |  |
| 900 | {mobileNextPendingStep ? '先把眼前这一步走完。' : '这条步骤愿望已经全部走完。'} | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:430 | 无 | 否 | 待确认 |  |
| 901 | 已经全部完成 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:435 | 无 | 否 | 待确认 |  |
| 902 | 还剩 {selectedWish.steps.length - mobileCompletedStepCount} 步 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:435 | selectedWish.steps.length - mobileCompletedStepCount | 否 | 待确认 |  |
| 903 | {mobileCompletedStepCount === selectedWish.steps.length ? '已经全部完成' : `还剩 {selectedWish.steps.length - mobileCompletedStepCount} 步`} | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:435 | selectedWish.steps.length - mobileCompletedStepCount | 否 | 待确认 |  |
| 904 | 还没有拆出小步骤 | 详情页 | 空态 / 缺省 | 在 详情页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:440 | 无 | 否 | 待确认 |  |
| 905 | 可以先写下第一个很具体的小目标，例如订票、办签证、买装备。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:441 | 无 | 否 | 待确认 |  |
| 906 | 先完成眼前这一步 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:446 | 无 | 否 | 待确认 |  |
| 907 | 先写下第一步 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:446 | 无 | 否 | 待确认 |  |
| 908 | {selectedWish.steps.length ? '先完成眼前这一步' : '先写下第一步'} | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:446 | 无 | 否 | 待确认 |  |
| 909 | 走完下一步时，星星币会自动到账。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:447 | 无 | 否 | 待确认 |  |
| 910 | 有了第一步，这条愿望会更容易继续往前。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:447 | 无 | 否 | 待确认 |  |
| 911 | 你可以在下面评论和打气，步骤由愿望归属人推进。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:447 | 无 | 否 | 待确认 |  |
| 912 | {canProgressSelectedWish ? (selectedWish.steps.length ? '走完下一步时，星星币会自动到账。' : '有了第一步，这条愿望会更容易继续往前。') : '你可以在下面评论和打气，步骤由愿望归属人推进。'} | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:447 | 无 | 否 | 待确认 |  |
| 913 | 完成这一步 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:450 | 无 | 否 | 待确认 |  |
| 914 | 先去下面补一步 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:450 | 无 | 否 | 待确认 |  |
| 915 | 全部步骤 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:457 | 无 | 否 | 待确认 |  |
| 916 | 展开查看这 {selectedWish.steps.length} 步 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:458 | 无 | 否 | 待确认 |  |
| 917 | 这条愿望可以一步完成 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:482 | 无 | 否 | 待确认 |  |
| 918 | 没有拆数字或步骤时，完成按钮就直接放在这里。 | 详情页 | 空态 / 缺省 | 在 详情页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:483 | 无 | 否 | 待确认 |  |
| 919 | canShowProgressCompletionAction && canProgressSelectedWish | 详情页 | 按钮 / 链接 | 在 详情页 的 <div> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:487 | 无 | 否 | 待确认 |  |
| 920 | 完成并获得 {getCompletionStarCoinLabel()} | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:488 | 无 | 否 | 待确认 |  |
| 921 | 写一笔近况 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:497 | 无 | 否 | 待确认 |  |
| 922 | 先记下一笔近况 | 详情页 | 标题 | 在 详情页 的 <h2> 区域展示。 | src/pages/WishDetailAtelier.vue:498 | 无 | 否 | 待确认 |  |
| 923 | 先写一句，想带图也可以；发出去后会顺着往下留下。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:502 | 无 | 否 | 待确认 |  |
| 924 | 留言内容 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:506 | 无 | 否 | 待确认 |  |
| 925 | 先写一句今天的近况 | 详情页 | 输入占位符 | 在 详情页 的 <textarea> 表单输入框为空时作为占位提示出现。 | src/pages/WishDetailAtelier.vue:507 | 无 | 否 | 待确认 |  |
| 926 | 图片附件 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:512 | 无 | 否 | 待确认 |  |
| 927 | 已选 {commentImageFiles.length} 张图 | 详情页 | 正文 / 说明 | 在 详情页 的 <input> 区域展示。 | src/pages/WishDetailAtelier.vue:525；src/pages/WishDetailAtelier.vue:550 | commentImageFiles.length | 否 | 待确认 |  |
| 928 | 选图 | 详情页 | 正文 / 说明 | 在 详情页 的 <input> 区域展示。 | src/pages/WishDetailAtelier.vue:525；src/pages/WishDetailAtelier.vue:550 | 无 | 否 | 待确认 |  |
| 929 | 清空已选 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:527；src/pages/WishDetailAtelier.vue:552 | 无 | 否 | 待确认 |  |
| 930 | 图片留言暂需云端同步 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:530；src/pages/WishDetailAtelier.vue:555 | 无 | 否 | 待确认 |  |
| 931 | 发送中... | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:567 | 无 | 否 | 待确认 |  |
| 932 | 发送留言 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:567 | 无 | 否 | 待确认 |  |
| 933 | 重试发送 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:569 | 无 | 否 | 待确认 |  |
| 934 | 共同手账 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:582 | 无 | 否 | 待确认 |  |
| 935 | 这一页已经留下的过程 | 详情页 | 标题 | 在 详情页 的 <h2> 区域展示。 | src/pages/WishDetailAtelier.vue:583 | 无 | 否 | 待确认 |  |
| 936 | 最新在上 · {visibleThreads.length} 笔 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:585 | 无 | 否 | 待确认 |  |
| 937 | 最上面这一笔就是最近一次近况，往下是更早的记录。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:588 | 无 | 否 | 待确认 |  |
| 938 | {thread.images.length} 张图 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:606；src/pages/WishDetailAtelier.vue:735；src/pages/WishDetailAtelier.vue:842 | 无 | 否 | 待确认 |  |
| 939 | 取消编辑 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:614 | 无 | 否 | 待确认 |  |
| 940 | 编辑评论 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:614 | 无 | 否 | 待确认 |  |
| 941 | 删除评论 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:617 | 无 | 否 | 待确认 |  |
| 942 | 编辑留言内容 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:623；src/pages/WishDetailAtelier.vue:744；src/pages/WishDetailAtelier.vue:851 | 无 | 否 | 待确认 |  |
| 943 | 取消 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:626；src/pages/WishDetailAtelier.vue:747；src/pages/WishDetailAtelier.vue:854 | 无 | 否 | 待确认 |  |
| 944 | 保存留言 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:628；src/pages/WishDetailAtelier.vue:749；src/pages/WishDetailAtelier.vue:856 | 无 | 否 | 待确认 |  |
| 945 | 这张图正在出现 | 详情页 | 状态 / 反馈 / 错误 | 在 详情页 的 <span> 触发成功、失败、加载或状态更新时出现。 | src/pages/WishDetailAtelier.vue:644；src/pages/WishDetailAtelier.vue:765；src/pages/WishDetailAtelier.vue:872 | 无 | 否 | 待确认 |  |
| 946 | isThreadReactionExpanded(thread.id) ? '收起表情选项' : '打开表情选项' | 详情页 | 可访问性 / aria | 在 详情页 的 <button> 区域供屏幕阅读器或辅助技术感知。 | src/pages/WishDetailAtelier.vue:670 | 无 | 是 | 待确认 |  |
| 947 | 收起表情 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:673 | 无 | 否 | 待确认 |  |
| 948 | 表情 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:673；src/pages/WishDetailAtelier.vue:780；src/pages/WishDetailAtelier.vue:887 | 无 | 否 | 待确认 |  |
| 949 | {thread.reactions.length} 种回应 | 详情页 | 按钮 / 链接 | 在 详情页 的 <span> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:676 | 无 | 否 | 待确认 |  |
| 950 | 处理中 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:699；src/pages/WishDetailAtelier.vue:1088；src/pages/WishDetailAtelier.vue:1120 | 无 | 否 | 待确认 |  |
| 951 | isThreadReactionPickerOpen(thread.id) ? '收起表情选项' : '打开表情选项' | 详情页 | 可访问性 / aria | 在 详情页 的 <button> 区域供屏幕阅读器或辅助技术感知。 | src/pages/WishDetailAtelier.vue:776；src/pages/WishDetailAtelier.vue:883 | 无 | 是 | 待确认 |  |
| 952 | 还没有回应 | 详情页 | 按钮 / 链接 | 在 详情页 的 <span> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:796；src/pages/WishDetailAtelier.vue:903 | 无 | 否 | 待确认 |  |
| 953 | 取消 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:800；src/pages/WishDetailAtelier.vue:907 | 无 | 否 | 待确认 |  |
| 954 | 编辑 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:800；src/pages/WishDetailAtelier.vue:907 | 无 | 否 | 待确认 |  |
| 955 | 删除中 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:803；src/pages/WishDetailAtelier.vue:910 | 无 | 否 | 待确认 |  |
| 956 | 更早记录 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:822 | 无 | 否 | 待确认 |  |
| 957 | 再往前翻 {mobileOverflowThreads.length} 笔 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:823 | 无 | 否 | 待确认 |  |
| 958 | 这条愿望还没有留下手账记录 | 详情页 | 空态 / 缺省 | 在 详情页 的 <strong> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:929 | 无 | 否 | 待确认 |  |
| 959 | 先从上面的留言口写下一句，后面的变化会继续接进来。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:930 | 无 | 否 | 待确认 |  |
| 960 | 低频工具 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:941 | 无 | 否 | 待确认 |  |
| 961 | 整理这页愿望 | 详情页 | 正文 / 说明 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:942 | 无 | 否 | 待确认 |  |
| 962 | 补详情、整理进度和移走愿望，都放在这里。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:946 | 无 | 否 | 待确认 |  |
| 963 | 编辑愿望 | 详情页 | 按钮 / 链接 | 在 详情页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:952 | 无 | 否 | 待确认 |  |
| 964 | 移走这条愿望 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:953 | 无 | 否 | 待确认 |  |
| 965 | 移走后会回到清单页 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:958 | 无 | 否 | 待确认 |  |
| 966 | 先不删 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:959 | 无 | 否 | 待确认 |  |
| 967 | 确认删除 | 详情页 | 正文 / 说明 | 在 详情页 的 <button> 区域展示。 | src/pages/WishDetailAtelier.vue:961 | 无 | 否 | 待确认 |  |
| 968 | progressSnapshot?.mode === 'count' && canProgressSelectedWish | 详情页 | 正文 / 说明 | 在 详情页 的 <div> 区域展示。 | src/pages/WishDetailAtelier.vue:965 | 无 | 否 | 待确认 |  |
| 969 | 数字进度校正 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:967 | 无 | 否 | 待确认 |  |
| 970 | 只有当你想回头整理记录时，再从这里校正现在的数值。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:968 | 无 | 否 | 待确认 |  |
| 971 | shouldRecordCountProgressLog | 详情页 | 正文 / 说明 | 在 详情页 的 <input> 区域展示。 | src/pages/WishDetailAtelier.vue:972 | 无 | 否 | 待确认 |  |
| 972 | 每次推进数字进度时，顺手记一笔手账记录 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:973 | 无 | 否 | 待确认 |  |
| 973 | 把它改成现在的位置 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:978 | 无 | 否 | 待确认 |  |
| 974 | countProgressDraft | 详情页 | 正文 / 说明 | 在 详情页 的 <input> 区域展示。 | src/pages/WishDetailAtelier.vue:979 | 无 | 否 | 待确认 |  |
| 975 | void adjustCountProgress(-1) | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:982 | 无 | 否 | 待确认 |  |
| 976 | 往回调 1 点 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:982 | 无 | 否 | 待确认 |  |
| 977 | void saveCountProgress() | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:983 | 无 | 否 | 待确认 |  |
| 978 | 保存现在的位置 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:983 | 无 | 否 | 待确认 |  |
| 979 | progressSnapshot?.mode === 'steps' && canProgressSelectedWish | 详情页 | 正文 / 说明 | 在 详情页 的 <div> 区域展示。 | src/pages/WishDetailAtelier.vue:988 | 无 | 否 | 待确认 |  |
| 980 | 步骤整理 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:990 | 无 | 否 | 待确认 |  |
| 981 | 当你想回头整理步骤顺序时，再从这里增删小步骤就好。 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:991 | 无 | 否 | 待确认 |  |
| 982 | 补一小步 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:996 | 无 | 否 | 待确认 |  |
| 983 | 例如：先确认路线和预算 | 详情页 | 输入占位符 | 在 详情页 的 <input> 表单输入框为空时作为占位提示出现。 | src/pages/WishDetailAtelier.vue:997 | 无 | 否 | 待确认 |  |
| 984 | 完成可得星星币 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:1000 | 无 | 否 | 待确认 |  |
| 985 | 正在加入... | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:1005 | 无 | 否 | 待确认 |  |
| 986 | 加入这一步 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:1005 | 无 | 否 | 待确认 |  |
| 987 | 移走这一步 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:1013 | 无 | 否 | 待确认 |  |
| 988 | 还没有找到这条愿望 | 详情页 | 标题 | 在 详情页 的 <h2> 区域展示。 | src/pages/WishDetailAtelier.vue:1023 | 无 | 否 | 待确认 |  |
| 989 | 它可能已经被删除；如果你还没有写下任何愿望，就先从第一条开始。 | 详情页 | 空态 / 缺省 | 在 详情页 的 <p> 区域数据为空、不可用或尚未开始时出现。 | src/pages/WishDetailAtelier.vue:1024 | 无 | 否 | 待确认 |  |
| 990 | 回清单看看 | 详情页 | 按钮 / 链接 | 在 详情页 的 <RouterLink> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:1026 | 无 | 否 | 待确认 |  |
| 991 | 手账回应 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:1044 | 无 | 否 | 待确认 |  |
| 992 | 给这笔一点回应 | 详情页 | 标题 | 在 详情页 的 <h3> 区域展示。 | src/pages/WishDetailAtelier.vue:1045 | 无 | 否 | 待确认 |  |
| 993 | 关闭 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:1048；src/pages/WishDetailAtelier.vue:1137 | 无 | 否 | 待确认 |  |
| 994 | 还可以再选 {getThreadReactionRemainingCount} 个 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:1057 | getThreadReactionRemainingCount | 否 | 待确认 |  |
| 995 | 已经选满 3 个，点已选表情可以收回 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:1057 | 无 | 否 | 待确认 |  |
| 996 | {getThreadReactionRemainingCount(activeReactionPickerThread) ? `还可以再选 {getThreadReactionRemainingCount} 个` : '已经选满 3 个，点已选表情可以收回'} | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:1057 | getThreadReactionRemainingCount | 否 | 待确认 |  |
| 997 | 常用回应 | 详情页 | 标题 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:1063 | 无 | 否 | 待确认 |  |
| 998 | 点一下就记上 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:1064 | 无 | 否 | 待确认 |  |
| 999 | 更多情绪 | 详情页 | 标题 | 在 详情页 的 <strong> 区域展示。 | src/pages/WishDetailAtelier.vue:1096 | 无 | 否 | 待确认 |  |
| 1000 | 细一点也可以 | 详情页 | 正文 / 说明 | 在 详情页 的 <span> 区域展示。 | src/pages/WishDetailAtelier.vue:1097 | 无 | 否 | 待确认 |  |
| 1001 | 图片预览 | 详情页 | 正文 / 说明 | 在 详情页 的 <p> 区域展示。 | src/pages/WishDetailAtelier.vue:1134 | 无 | 否 | 待确认 |  |
| 1002 | 上一张 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:1144 | 无 | 否 | 待确认 |  |
| 1003 | 下一张 | 详情页 | 按钮 / 链接 | 在 详情页 的 <button> 区域作为可点击操作出现。 | src/pages/WishDetailAtelier.vue:1145 | 无 | 否 | 待确认 |  |
| 1004 | 晨光 x 星野 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 DEFAULT_SPACE 区域展示。 | src/stores/auth.ts:43 | 无 | 否 | 待确认 |  |
| 1005 | 晨光 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 DEFAULT_MEMBERS 区域展示。 | src/stores/auth.ts:51 | 无 | 否 | 待确认 |  |
| 1006 | 星野 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 DEFAULT_MEMBERS 区域展示。 | src/stores/auth.ts:58 | 无 | 否 | 待确认 |  |
| 1007 | 登录邮件已发出，等待邮箱确认后会建立 Supabase 会话；如果邮件里提供的是验证码，也可以在首页手动输入。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 sessionSummary 区域展示。 | src/stores/auth.ts:193 | 无 | 否 | 待确认 |  |
| 1008 | 尚未登录，当前显示的是本地演示数据。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 sessionSummary 区域展示。 | src/stores/auth.ts:197 | 无 | 否 | 待确认 |  |
| 1009 | {currentMember} 已登录，当前空间与愿望将优先走 Supabase。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 sessionSummary 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:201 | currentMember；displayName | 否 | 待确认 |  |
| 1010 | {currentMember} 已登录，但当前仍停留在本地演示空间。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 sessionSummary 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:204 | currentMember；displayName | 否 | 待确认 |  |
| 1011 | {displayName} 的愿望空间 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 displayName 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:353 | displayName | 否 | 待确认 |  |
| 1012 | hasBoundSpaceMemberships | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 normalizedEmail 区域展示。 | src/stores/auth.ts:381；src/stores/auth.ts:810；src/stores/auth.ts:813；src/stores/auth.ts:837 | 无 | 否 | 待确认 |  |
| 1013 | 已登录，但未找到可访问的 Supabase 空间，也未能自动创建个人空间。 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 createdSpace 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:417 | 无 | 否 | 待确认 |  |
| 1014 | 已登录，但当前账号还没有任何 Supabase 空间成员记录。请确认初始 schema migration 已完整执行。 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 createdSpace 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:425 | 无 | 否 | 待确认 |  |
| 1015 | 已登录，但读取 Supabase 空间详情失败。请确认 spaces 和 space_members 表都已创建并开放给前端访问。 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 targetSpace 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:440 | 无 | 否 | 待确认 |  |
| 1016 | 已登录，但同步 Supabase 空间失败 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:460 | 无 | 否 | 待确认 |  |
| 1017 | 登录回跳失败：{decodeURIComponent} | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 callbackError 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:533 | decodeURIComponent | 否 | 待确认 |  |
| 1018 | 登录回跳失败：{error.message} | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 authCode 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:546；src/stores/auth.ts:574；src/stores/auth.ts:594 | error.message；message | 否 | 待确认 |  |
| 1019 | 邮箱验证成功，正在恢复登录会话。 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 authCode 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:550；src/stores/auth.ts:578；src/stores/auth.ts:598 | 无 | 否 | 待确认 |  |
| 1020 | 登录回跳失败：无法识别回调类型 {tokenType} | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 normalizedType 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:563 | tokenType | 否 | 待确认 |  |
| 1021 | 请输入有效邮箱后再继续。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 normalizedEmail 区域展示。 | src/stores/auth.ts:633 | 无 | 否 | 待确认 |  |
| 1022 | Supabase 发送验证码失败 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:659 | 无 | 否 | 待确认 |  |
| 1023 | 已向 {normalizedEmail} 发送登录验证码。只有最后一封邮件里的验证码有效；如果邮件里还带有登录链接，不要点那个链接，只用验证码。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/auth.ts:668 | normalizedEmail | 否 | 待确认 |  |
| 1024 | 已为 {matchedMember.displayName} 建立本地 mock 会话。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/auth.ts:677 | matchedMember.displayName；displayName | 否 | 待确认 |  |
| 1025 | 请输入邮箱和验证码后再继续。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 normalizedToken 区域展示。 | src/stores/auth.ts:691 | 无 | 否 | 待确认 |  |
| 1026 | 当前环境未接入 Supabase，无法校验邮箱验证码。 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 normalizedToken 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:699 | 无 | 否 | 待确认 |  |
| 1027 | 邮箱验证码校验成功，已完成登录。 | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 confirmedSession 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:726 | 无 | 否 | 待确认 |  |
| 1028 | 请输入邀请码后再继续。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 normalizedCode 区域展示。 | src/stores/auth.ts:737 | 无 | 否 | 待确认 |  |
| 1029 | 加入空间失败：{error.message} | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:751 | error.message；message | 否 | 待确认 |  |
| 1030 | 已通过 Supabase 加入空间，成员和邀请码已经刷新。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 joinedMember 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:761 | 无 | 否 | 待确认 |  |
| 1031 | 请先通过邮箱验证码登录，再加入空间。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 joinedMember 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:769 | 无 | 否 | 待确认 |  |
| 1032 | 邀请码不正确，当前只接受示例码。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/auth.ts:777 | 无 | 否 | 待确认 |  |
| 1033 | 邀请码校验通过；前端暂时还是本地流程，数据库侧的 join_space_by_invite RPC 已准备好。 | 认证与空间状态 | 正文 / 说明 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/auth.ts:785 | 无 | 否 | 待确认 |  |
| 1034 | 请输入要固定到当前空间的邮箱。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 normalizedDisplayName 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:797 | 无 | 否 | 待确认 |  |
| 1035 | 请先登录到 Supabase 空间，再绑定固定邮箱。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 normalizedDisplayName 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:805 | 无 | 否 | 待确认 |  |
| 1036 | 只有当前空间的 owner 可以绑定固定邮箱。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:821 | 无 | 否 | 待确认 |  |
| 1037 | 固定邮箱失败：{error.message} | 认证与空间状态 | 状态 / 反馈 / 错误 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/auth.ts:844 | error.message；message | 否 | 待确认 |  |
| 1038 | 已把 {normalizedEmail} 绑定到当前空间，默认身份会显示为 {normalizedDisplayName}。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:852 | normalizedEmail；normalizedDisplayName | 否 | 待确认 |  |
| 1039 | 已把 {normalizedEmail} 绑定到当前空间。后续这个邮箱登录时会优先进入这里。 | 认证与空间状态 | 空态 / 缺省 | 在 认证与空间状态 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/stores/auth.ts:853 | normalizedEmail | 否 | 待确认 |  |
| 1040 | 一起完成一次 10 天长途旅行 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 seedWishes 区域展示。 | src/stores/wishes.ts:632 | 无 | 否 | 待确认 |  |
| 1041 | 先把预算、时间窗和三个候选目的地列出来，再决定路线。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 seedWishes 区域展示。 | src/stores/wishes.ts:636 | 无 | 否 | 待确认 |  |
| 1042 | 列出预算和时间窗 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:650 | 无 | 否 | 待确认 |  |
| 1043 | 确定 3 个候选目的地 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:657 | 无 | 否 | 待确认 |  |
| 1044 | 等行程确认后再订票 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:662 | 无 | 否 | 待确认 |  |
| 1045 | 这条在正式版里就是愿望详情下留言的最小形态。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:670 | 无 | 否 | 待确认 |  |
| 1046 | 后面接 Supabase Realtime 时，这里可以直接替换成云端订阅。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:676 | 无 | 否 | 待确认 |  |
| 1047 | 拿下数据分析证书 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:685 | 无 | 否 | 待确认 |  |
| 1048 | 每周完成两个模块，月底做一次模拟题回顾。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:689 | 无 | 否 | 待确认 |  |
| 1049 | 模块 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:697 | 无 | 否 | 待确认 |  |
| 1050 | 私密愿望在后续会接 RLS 隔离。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:704 | 无 | 否 | 待确认 |  |
| 1051 | 在夏天前累计完成 12 次慢跑 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:713 | 无 | 否 | 待确认 |  |
| 1052 | 每周至少跑两次，先把出门频率养稳，再慢慢拉长距离。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:717 | 无 | 否 | 待确认 |  |
| 1053 | 这条会在首页里展示成数字型进度愿望。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:732 | 无 | 否 | 待确认 |  |
| 1054 | 把客厅整理成周末电影角 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:741 | 无 | 否 | 待确认 |  |
| 1055 | 居家 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:742 | 无 | 否 | 待确认 |  |
| 1056 | 先挑一盏落地灯和一条薄毯，再把零散线材、边桌和投影位收顺。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:745 | 无 | 否 | 待确认 |  |
| 1057 | 这条故意不设进度，保留成只写下来的轻愿望。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:760 | 无 | 否 | 待确认 |  |
| 1058 | 学会做三道拿手宴客菜 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:769 | 无 | 否 | 待确认 |  |
| 1059 | 糖醋排骨、烤鸡和一道甜点，先完成菜单和食材清单。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:773 | 无 | 否 | 待确认 |  |
| 1060 | 终于能把这三道菜顺着做完一轮了，下次可以直接请你吃。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:789 | 无 | 否 | 待确认 |  |
| 1061 | 这条会保留成软件里默认的“已完成愿望”示例。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:795 | 无 | 否 | 待确认 |  |
| 1062 | 上班路上买一杯拿铁 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 seedRewardPoolItems 区域展示。 | src/stores/wishes.ts:854 | 无 | 否 | 待确认 |  |
| 1063 | 不用纠结价格，今天就喝喜欢的那一杯。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 seedRewardPoolItems 区域展示。 | src/stores/wishes.ts:855 | 无 | 否 | 待确认 |  |
| 1064 | 给书桌换一小束鲜花 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 seedRewardPoolItems 区域展示。 | src/stores/wishes.ts:863 | 无 | 否 | 待确认 |  |
| 1065 | 让这周的房间先亮起来一点。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 seedRewardPoolItems 区域展示。 | src/stores/wishes.ts:864 | 无 | 否 | 待确认 |  |
| 1066 | 找一家窗边早餐店 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:872 | 无 | 否 | 待确认 |  |
| 1067 | 慢慢吃一顿不赶时间的早餐。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:873 | 无 | 否 | 待确认 |  |
| 1068 | 挑一本新的手账本 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:881 | 无 | 否 | 待确认 |  |
| 1069 | 给接下来的计划换一个更顺手的地方。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:882 | 无 | 否 | 待确认 |  |
| 1070 | 带一盒小甜点回家 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:890 | 无 | 否 | 待确认 |  |
| 1071 | 选两个口味，留一个明天再吃。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:891 | 无 | 否 | 待确认 |  |
| 1072 | 在书店待满一小时 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:899 | 无 | 否 | 待确认 |  |
| 1073 | 不带任务，只允许自己慢慢翻。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:900 | 无 | 否 | 待确认 |  |
| 1074 | 看一场工作日夜场电影 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:908 | 无 | 否 | 待确认 |  |
| 1075 | 买好爆米花，手机静音。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:909 | 无 | 否 | 待确认 |  |
| 1076 | 买一套喜欢的沐浴用品 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:917 | 无 | 否 | 待确认 |  |
| 1077 | 让睡前洗澡变成真正放松的一段。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:918 | 无 | 否 | 待确认 |  |
| 1078 | 去看一个小展览 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:926 | 无 | 否 | 待确认 |  |
| 1079 | 看完顺路喝杯茶，把喜欢的作品记下来。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:927 | 无 | 否 | 待确认 |  |
| 1080 | 订一家想吃很久的餐厅 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:935 | 无 | 否 | 待确认 |  |
| 1081 | 认真点一道招牌菜，不急着走。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:936 | 无 | 否 | 待确认 |  |
| 1082 | 做一次肩颈放松 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:944 | 无 | 否 | 待确认 |  |
| 1083 | 把紧绷的肩膀交给专业的人处理。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:945 | 无 | 否 | 待确认 |  |
| 1084 | 换一盏舒服的床头灯 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:953 | 无 | 否 | 待确认 |  |
| 1085 | 让夜晚阅读不用再凑合。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:954 | 无 | 否 | 待确认 |  |
| 1086 | 报名一次周末手作课 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:962 | 无 | 否 | 待确认 |  |
| 1087 | 陶艺、银饰或香薰，选一个真正想试的。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:963 | 无 | 否 | 待确认 |  |
| 1088 | 住一晚城市里的舒服酒店 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:971 | 无 | 否 | 待确认 |  |
| 1089 | 不出远门，也给自己换一个安静空间。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:972 | 无 | 否 | 待确认 |  |
| 1090 | 安排一次两天一夜短途旅行 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:980 | 无 | 否 | 待确认 |  |
| 1091 | 选一个能慢慢散步、吃好饭的小城。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:981 | 无 | 否 | 待确认 |  |
| 1092 | 下班后买一杯冰饮散步 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:989 | 无 | 否 | 待确认 |  |
| 1093 | 绕一条不赶路的路线回家。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:990 | 无 | 否 | 待确认 |  |
| 1094 | 周末早上吃一碗热汤面 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:998 | 无 | 否 | 待确认 |  |
| 1095 | 不用外卖，去店里慢慢吃。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:999 | 无 | 否 | 待确认 |  |
| 1096 | 留一个晚上安心打游戏 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1007 | 无 | 否 | 待确认 |  |
| 1097 | 提前收拾好杂事，玩的时候不内疚。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1008 | 无 | 否 | 待确认 |  |
| 1098 | 买几双舒服的新袜子 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1016 | 无 | 否 | 待确认 |  |
| 1099 | 把那些松掉的旧袜子正式换掉。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1017 | 无 | 否 | 待确认 |  |
| 1100 | 去夜市随便吃三样小吃 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1025 | 无 | 否 | 待确认 |  |
| 1101 | 只负责开心，不负责算热量。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1026 | 无 | 否 | 待确认 |  |
| 1102 | 买一张喜欢的黑胶或专辑 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1034 | 无 | 否 | 待确认 |  |
| 1103 | 给最近反复听的歌一个实体位置。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1035 | 无 | 否 | 待确认 |  |
| 1104 | 认真剪一次头发 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1043 | 无 | 否 | 待确认 |  |
| 1105 | 预约喜欢的发型师，不临时将就。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1044 | 无 | 否 | 待确认 |  |
| 1106 | 添一件顺手的厨房小工具 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1052 | 无 | 否 | 待确认 |  |
| 1107 | 比如削皮刀、温度计或好用的锅铲。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1053 | 无 | 否 | 待确认 |  |
| 1108 | 买一件透气运动 T 恤 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1061 | 无 | 否 | 待确认 |  |
| 1109 | 让下一次出门运动少一点阻力。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1062 | 无 | 否 | 待确认 |  |
| 1110 | 升级一个小音箱 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1070 | 无 | 否 | 待确认 |  |
| 1111 | 做饭和收拾屋子时都能放喜欢的歌。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1071 | 无 | 否 | 待确认 |  |
| 1112 | 买一把折叠露营椅 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1079 | 无 | 否 | 待确认 |  |
| 1113 | 公园、天台和短途出门都能用上。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1080 | 无 | 否 | 待确认 |  |
| 1114 | 做一次足部护理 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1088 | 无 | 否 | 待确认 |  |
| 1115 | 走了很多路之后，认真照顾一下自己。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1089 | 无 | 否 | 待确认 |  |
| 1116 | 租车骑一下午河边路线 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1097 | 无 | 否 | 待确认 |  |
| 1117 | 找一条风景舒服、坡度不狠的路线。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1098 | 无 | 否 | 待确认 |  |
| 1118 | 吃一次周末早午餐 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1106 | 无 | 否 | 待确认 |  |
| 1119 | 点一份平时不会点的主菜。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1107 | 无 | 否 | 待确认 |  |
| 1120 | 换一副通勤耳机 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1115 | 无 | 否 | 待确认 |  |
| 1121 | 让路上的音乐和播客都更舒服。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:1116 | 无 | 否 | 待确认 |  |
| 1122 | 当前使用本地演示数据。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 syncMessage 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:1168；src/stores/wishes.ts:3454 | 无 | 否 | 待确认 |  |
| 1123 | Realtime 未启用，当前显示本地演示数据。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 realtimeMessage 区域展示。 | src/stores/wishes.ts:1179 | 无 | 否 | 待确认 |  |
| 1124 | Realtime 连接中，当前空间的变更很快会自动刷新。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 realtimeMessage 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:1183 | 无 | 否 | 待确认 |  |
| 1125 | Realtime 已连接，当前空间的愿望和留言会自动刷新。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 realtimeMessage 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:1187 | 无 | 否 | 待确认 |  |
| 1126 | Realtime 连接异常，当前仍会在写入后自动重新拉取云端数据。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 realtimeMessage 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:1191 | 无 | 否 | 待确认 |  |
| 1127 | Realtime 当前未连接。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 realtimeMessage 区域展示。 | src/stores/wishes.ts:1194 | 无 | 否 | 待确认 |  |
| 1128 | 愿望 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 previousWishId 区域展示。 | src/stores/wishes.ts:1921 | 无 | 否 | 待确认 |  |
| 1129 | 小步骤 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 visibleWishIds 区域展示。 | src/stores/wishes.ts:1928 | 无 | 否 | 待确认 |  |
| 1130 | 图片 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 visibleWishIds 区域展示。 | src/stores/wishes.ts:1943 | 无 | 否 | 待确认 |  |
| 1131 | 留言图片 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 visibleCommentIds 区域展示。 | src/stores/wishes.ts:1960 | 无 | 否 | 待确认 |  |
| 1132 | 手账图片 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 visibleThreadIds 区域展示。 | src/stores/wishes.ts:1968 | 无 | 否 | 待确认 |  |
| 1133 | 表情回应 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 eventType 区域展示。 | src/stores/wishes.ts:1979 | 无 | 否 | 待确认 |  |
| 1134 | 愿望手账 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:2020 | 无 | 否 | 待确认 |  |
| 1135 | hasWishProgress | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:2052；src/stores/wishes.ts:2195；src/stores/wishes.ts:2208；src/stores/wishes.ts:2234；src/stores/wishes.ts:2251；src/stores/wishes.ts:2360；src/stores/wishes.ts:2504；src/stores/wishes.ts:2682；src/stores/wishes.ts:2743；src/stores/wishes.ts:2798；src/stores/wishes.ts:2846 | 无 | 否 | 待确认 |  |
| 1136 | 奖励池 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:2072 | 无 | 否 | 待确认 |  |
| 1137 | 领奖记录 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:2080 | 无 | 否 | 待确认 |  |
| 1138 | 月刊快照 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:2088 | 无 | 否 | 待确认 |  |
| 1139 | 当前显示的是 Supabase 云端愿望数据。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 composed 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2141 | 无 | 否 | 待确认 |  |
| 1140 | 愿望修改已同步到 Supabase。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 区域展示。 | src/stores/wishes.ts:2269 | 无 | 否 | 待确认 |  |
| 1141 | 愿望修改已同步到 Supabase。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2275 | 无 | 否 | 待确认 |  |
| 1142 | 愿望已从 Supabase 删除。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 client 区域展示。 | src/stores/wishes.ts:2299 | 无 | 否 | 待确认 |  |
| 1143 | 愿望已从 Supabase 删除。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 client 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2305 | 无 | 否 | 待确认 |  |
| 1144 | 当前没有可完成的愿望。 | 愿望/奖励/同步状态 | 空态 / 缺省 | 在 愿望/奖励/同步状态 的 memberId 区域数据为空、不可用或尚未开始时出现。 | src/stores/wishes.ts:2427 | 无 | 否 | 待确认 |  |
| 1145 | 只有这条愿望的归属人可以推进和完成它。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 memberId 区域展示。 | src/stores/wishes.ts:2431 | 无 | 否 | 待确认 |  |
| 1146 | 这个愿望已经完成了。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 memberId 区域展示。 | src/stores/wishes.ts:2435 | 无 | 否 | 待确认 |  |
| 1147 | 这条愿望的完成星星币已经发过了。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 memberId 区域展示。 | src/stores/wishes.ts:2439 | 无 | 否 | 待确认 |  |
| 1148 | 完成「{wish.title}」时自动获得的额外星星币。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 localWish 区域展示。 | src/stores/wishes.ts:2454 | wish.title；title | 否 | 待确认 |  |
| 1149 | {formatStarCoinAmount} 星星币 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 localWish 区域展示。 | src/stores/wishes.ts:2458；src/stores/wishes.ts:2722；src/stores/wishes.ts:2835 | formatStarCoinAmount | 否 | 待确认 |  |
| 1150 | 这条愿望已经完成，{formatStarCoinAmount} 枚星星币已经自动到账。 | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 localWish 区域展示。 | src/stores/wishes.ts:2460 | formatStarCoinAmount | 否 | 待确认 |  |
| 1151 | 已标记为重点愿望。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 now 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2677 | 无 | 否 | 待确认 |  |
| 1152 | 已取消重点标记。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 now 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2677 | 无 | 否 | 待确认 |  |
| 1153 | 只有这条愿望的归属人可以推进它。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 normalizedCurrent 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2693；src/stores/wishes.ts:2809 | 无 | 否 | 待确认 |  |
| 1154 | 「{wish.title}」数字进度新增 {gainedUnits} {wish.progressUnit \|\| 点}，自动获得星星币。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 starCoinDelta 区域展示。 | src/stores/wishes.ts:2717 | wish.title；gainedUnits；wish.progressUnit \|\| 点；title | 否 | 待确认 |  |
| 1155 | 只有这条愿望的归属人可以整理步骤。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 wish 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2753；src/stores/wishes.ts:2856 | 无 | 否 | 待确认 |  |
| 1156 | 完成「{wish.title}」里的步骤「{step.title}」时自动获得星星币。 | 愿望/奖励/同步状态 | 标题 | 在 愿望/奖励/同步状态 的 starCoinDelta 区域展示。 | src/stores/wishes.ts:2830 | wish.title；step.title；title | 否 | 待确认 |  |
| 1157 | 留言已保存到本地。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 wish 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2927 | 无 | 否 | 待确认 |  |
| 1158 | 图片上传失败：{error instanceof Error} | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 页面/模块渲染或状态计算时 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:2968 | error instanceof Error；message | 否 | 待确认 |  |
| 1159 | 留言已更新。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 comment 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3002 | 无 | 否 | 待确认 |  |
| 1160 | 留言已删除。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 wish 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3034 | 无 | 否 | 待确认 |  |
| 1161 | 表情回应已先收起，正在同步云端。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 optimisticReaction 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3087 | 无 | 否 | 待确认 |  |
| 1162 | 表情回应已先留下，正在同步云端。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 optimisticReaction 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3087 | 无 | 否 | 待确认 |  |
| 1163 | hasWishImageCover | 愿望/奖励/同步状态 | 正文 / 说明 | 在 愿望/奖励/同步状态 的 imageCoverCapabilityMessage 区域展示。 | src/stores/wishes.ts:3286 | 无 | 否 | 待确认 |  |
| 1164 | 云端模式下不支持恢复本地示例数据。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 resetToSeed 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3361 | 无 | 否 | 待确认 |  |
| 1165 | 已恢复本地示例数据。 | 愿望/奖励/同步状态 | 状态 / 反馈 / 错误 | 在 愿望/奖励/同步状态 的 seedState 触发成功、失败、加载或状态更新时出现。 | src/stores/wishes.ts:3372 | 无 | 否 | 待确认 |  |
| 1166 | 未设置日期 | 日期时间工具 | 空态 / 缺省 | 在 日期时间工具 的 formatBeijingDate 区域数据为空、不可用或尚未开始时出现。 | src/utils/datetime.ts:30 | 无 | 否 | 待确认 |  |
| 1167 | 未设置时间 | 日期时间工具 | 空态 / 缺省 | 在 日期时间工具 的 formatBeijingDateTime 区域数据为空、不可用或尚未开始时出现。 | src/utils/datetime.ts:44 | 无 | 否 | 待确认 |  |

## 附录：本地演示 seed/sample 内容（0 条）

这部分属于演示内容，可能在本地演示模式或初始化数据中被看到；不作为系统固定文案处理。

| 序号 | 文案原文 | 页面/模块 | 类型 | 出现位置/情形 | 文件与行号 | 动态变量 | 辅助感知 | 确认状态 | 备注 |
|---:|---|---|---|---|---|---|---|---|---|
