# 角色调用索引

## 先读总控
- docs/roles/00-role-orchestration.md

## 四个固定角色
- 体验师：docs/roles/01-experience-auditor.md
- 产品经理：docs/roles/02-product-manager.md
- UI/UE 设计师：docs/roles/03-ui-ue-designer.md
- 资深全栈开发：docs/roles/04-staff-fullstack-engineer.md

## 推荐调用方式
1. 单角色深度评审
- 直接引用对应角色文件。
- 输出该角色的挑刺、风险、方案、优先级。

2. 多角色联合会审
- 先引用 00-role-orchestration.md。
- 再引用 1-4 个角色文件。
- 按第 1 轮对齐、第 2 轮方案、第 3 轮验收输出。

3. 重要优化标准流程
- 先出第 1 轮问题定义。
- 再出第 2 轮 P0/P1/P2。
- 最后第 3 轮按指标验收。

## 使用约束
- 每个角色都必须有态度、有挑刺、有解决方案。
- 任何主张都尽量给可量化验收口径。
- 没有边界和指标的需求不进入开发排期。

## 终端优先级约束（新增）
- 本项目会审默认以 iOS 手机端为优先（iPhone 16 Pro 网页 App 为主），桌面网页为兼顾目标。
- 涉及 UI/UE 的方案与验收，先给 iOS 结论，再补桌面结论。
