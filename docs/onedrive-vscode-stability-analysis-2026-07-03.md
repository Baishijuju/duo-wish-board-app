# VS Code 稳定性与 OneDrive 判断说明

## 结论
这个项目最近在 VS Code 中出现高内存、高 CPU、偶发闪退，更像是“开发环境压力”问题，而不是“源码结构太差”问题。

当前更高概率的原因排序：
1. node_modules 文件数过大，触发 VS Code watcher、搜索、语言服务和扩展索引压力。
2. 项目位于 OneDrive 同步目录中，文件变化会被 OneDrive、杀毒软件、VS Code 同时监听。
3. Vue + TypeScript + Volar + Copilot 等后台服务叠加。
4. 如果工作区打开的是 repo-sync 上一级目录，会把额外目录也纳入监听范围。

## 这是不是文件结构问题
不是主要问题。

原因：
- src 体量很小，源码本身并不大。
- tsconfig 只编译 src，不会把 archive、dist 当主源码处理。
- archive 和 dist 的体量都不大，不像是能直接把内存打满的核心来源。

所以，不应优先从“拆业务文件”角度处理，而应优先处理“监听范围”和“同步环境”。

## 什么时候建议必须迁出 OneDrive
满足以下任一条，就建议迁出：
1. VS Code 每天都会明显卡顿、闪退或占满内存。
2. 运行 dev server、typecheck、build 时 CPU 和磁盘占用持续异常高。
3. 频繁修改小文件时也会触发明显延迟。
4. Git 操作、搜索、保存、自动补全经常变慢。

如果以上只是偶发，且加了 watcher/search 排除后明显改善，可以暂时不迁。

## 什么时候可以先不迁
满足以下条件可以先观察：
1. 你现在只打开 repo-sync 作为工作区根，而不是更上级目录。
2. 已加 VS Code watcher/search 排除配置。
3. 日常开发卡顿明显下降。
4. 闪退频率明显下降。

## 我建议的优先级
### 第一优先级
- 只打开 repo-sync 作为工作区根。
- 使用仓库内的 .vscode/settings.json 排除 node_modules、dist、测试产物等目录。

### 第二优先级
- 观察 1-3 天。
- 如果仍有频繁高内存或闪退，直接迁出 OneDrive。

### 第三优先级
- 若迁出后仍卡，再看扩展、TypeScript Server、Volar、系统杀毒软件。

## 推荐迁移方式
### 方案 A：最稳妥
- 将 repo-sync 复制到非 OneDrive 目录，例如：
  - D:/dev/duo-wish-board-app
  - C:/dev/duo-wish-board-app
- 以后在该本地开发目录中打开 VS Code、运行 npm、调试和构建。
- OneDrive 中只保留备份或非活跃副本。

优点：
- 最能减少文件同步干扰。
- 对 VS Code watcher、TypeScript Server、Git 性能最友好。

缺点：
- 需要自己管理备份节奏。

### 方案 B：折中方案
- 继续保留 OneDrive 目录作为主存档。
- 复制一份到本地非同步目录做开发。
- 定期手动同步 Git 提交，不靠 OneDrive 实时同步。

优点：
- 兼顾云端存档和本地性能。

缺点：
- 需要你注意别在两个副本上同时改。

## 如果暂时不迁出，可以做的补救
1. 确认 VS Code 打开的是 repo-sync，而不是人生愿望清单上级目录。
2. 关闭不必要的 VS Code 窗口和大型扩展。
3. 避免同时跑多个 watcher、测试进程、开发服务器。
4. 定期清理 test-results、playwright-report、dist。
5. 尽量不要在 OneDrive 同步高峰时长时间跑 dev server。

## 额外提醒
仓库内新增的 .vscode/settings.json 只会在“工作区根就是 repo-sync”时生效。

如果你打开的是更上一级目录，这份配置不一定覆盖整个工作区。那种情况下，最有效的做法仍然是：
- 改为只打开 repo-sync
或
- 直接迁到非 OneDrive 开发目录

## 最终建议
先执行：
1. 只打开 repo-sync
2. 使用刚新增的 VS Code 排除配置
3. 观察 1-3 天

如果仍频繁闪退，不要继续怀疑业务代码结构，直接迁出 OneDrive。那通常比继续局部调配置更有效。