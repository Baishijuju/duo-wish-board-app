# 会话交接索引

## 这份文件是干什么的
当 VS Code 切工作区、迁移目录、重开窗口或重新开启聊天时，用这份文件快速恢复当前项目最重要的上下文。

## 当前项目状态
- 当前主要仓库：repo-sync
- 当前重点页面：空间页
- 当前正在做的迭代：P0 第一轮落地
- 当前最近完成的实际代码优化：空间页奖励区默认态减重与管理入口降权

## 当前最重要的设计结论
### 空间页奖励区
- 默认态应该服务“领奖/存入”主流程。
- 管理能力应后置，不能在首屏抢主流程注意力。
- “管理”和“查看更多奖励”应作为低权重入口出现。
- 当前已接受的方向：两个弱入口都放在奖励区右下角同一侧。
- 奖励筛选默认值当前为：默认 + 我的 + 我能存。

### 空状态文案
- 当前采用的通用文案：当前筛选下还没有奖励，试试清空筛选。
- 目的：避免文案绑定特定筛选语义。

## 当前已沉淀的关键文件
### 角色与协作机制
- docs/roles/README.md
- docs/roles/00-role-orchestration.md
- docs/roles/01-experience-auditor.md
- docs/roles/02-product-manager.md
- docs/roles/03-ui-ue-designer.md
- docs/roles/04-staff-fullstack-engineer.md

### 体验 / 产品 / 设计 / 开发判断
- docs/ux-experience-audit-2026-07-03.md
- docs/pm-retention-architecture-plan-2026-07-03.md
- docs/ui-ue-redesign-critique-2026-07-03.md
- docs/dev-feasibility-priority-plan-2026-07-03.md

### 当前执行方案
- docs/pm-execution-direction-v1-2026-07-03.md
- docs/dev-p0-implementation-plan-v1-2026-07-03.md

### 环境稳定性分析
- docs/onedrive-vscode-stability-analysis-2026-07-03.md

## 当前已做的实际工程优化
- 新增仓库级 VS Code 配置：.vscode/settings.json
- 已对 watcher/search/explorer 做保守排除，减少 node_modules、dist、测试产物的监听与搜索压力
- .gitignore 已允许 .vscode/settings.json 纳入版本控制

## 关于 VS Code 稳定性的重要结论
- 更可能是 node_modules + OneDrive + VS Code 语言服务/扩展叠加导致的高内存/高 CPU
- src 业务代码结构不是主因
- dist 不是主因
- archive 不是主因
- 建议只打开 repo-sync 作为工作区根，而不是上一级“人生愿望清单”目录
- 如果优化后仍频繁闪退，建议迁出 OneDrive 到本地目录开发，例如 C:/dev/duo-wish-board-app

## 如果以后要在新会话里快速续上
建议把下面这段话直接发给新的聊天：

请先阅读以下文件并基于它们继续，不要重新发散：
- docs/session-handoff-index-2026-07-03.md
- docs/dev-p0-implementation-plan-v1-2026-07-03.md
- docs/pm-execution-direction-v1-2026-07-03.md
- docs/roles/README.md

当前重点是：
- 延续 P0 第一轮落地
- 优先处理空间页，再继续清单页
- 保持默认态轻量化，管理能力后置

## 当前下一步建议
1. 如果继续做产品优化：进入 P0-2，开始清单页条目骨架统一。
2. 如果先处理环境稳定性：新开 VS Code 窗口，只打开 repo-sync，观察 1-3 天。
3. 如果仍不稳定：迁移仓库到 C:/dev 下开发，再继续后续迭代。
