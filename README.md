# 双人人生愿望清单 App

这个目录是正式版前端工程，使用 Vue 3 + Vite + TypeScript + Pinia + Vue Router，并已经接上 Supabase 登录、云端愿望、留言、图片和统计能力。

## 当前状态

- 已接入邮箱验证码登录、空间邀请码加入、个人空间自动创建
- 已接入云端愿望 CRUD、愿望详情留言、Realtime 自动同步
- 已接入愿望图片上传、首图、拖拽排序、批量删除、图片备注和放大预览
- 已完成首页、清单页、写下页、回顾页、空间页和详情页的正式视觉版式

## 本地开发

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm run dev`
3. 类型检查：`npm run typecheck`
4. 构建：`npm run build`
5. 安装截图浏览器：`npm run playwright:install`
6. 生成正式页面截图：`npm run test:screenshots`

截图会输出到 `playwright-screenshots/`，默认覆盖桌面 `1440×900` 和 iPhone `390×844` 两个视口下的首页、清单页、写下页、回顾页和空间页。

## 环境变量

参考 [app/.env.example](.env.example)。当前本地已经使用 `.env.local` 配好 Supabase 项目。

前端优先使用：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

如果你仍然使用旧式 anon key，也兼容：

- `VITE_SUPABASE_ANON_KEY`

## 推荐部署方式

如果你现在主要是担心 GitHub Pages 或 Vercel 在当前网络环境里不稳定，优先选 Cloudflare 的 Workers 静态站部署。

原因很简单：

- 你不需要自己先有公网 IP
- 你不需要先买域名
- Cloudflare 的边缘网络通常比 GitHub Pages 和 `*.vercel.app` 在国内网络里更稳一点
- 当前这套 Vite 项目在 Cloudflare 上会走 Wrangler 的 SPA 回退配置

当前这条 Cloudflare 部署链会自动走 Wrangler 的 SPA 配置，在部署时生成 `assets.not_found_handling = single-page-application`。因此这里不需要再额外放 `_redirects`，否则会被 Cloudflare 判定成回退死循环。

## Cloudflare 部署步骤

1. 登录 Cloudflare，进入 `Workers & Pages`。
2. 选择 `Create application`。
3. 连接你的 GitHub 仓库并创建这个项目。
4. Cloudflare 会自动识别这套 Vite 项目并使用 Wrangler 做静态站部署。
5. 如果你能看到构建设置，确认这些值：
	- Framework preset：`Vite`
	- Build command：`npm run build`
	- Build output directory：`dist`
	- Root directory：如果你的 GitHub 仓库根目录就是当前这套前端文件，就留空；如果 GitHub 仓库里还有一层 `app` 目录，才填 `app`
6. 这个项目已经把生产环境需要的公开 Supabase 前端配置写进 [app/.env.production](.env.production)，所以如果你在 Cloudflare 里看到的是“Variables and Secrets for your Worker used at runtime”，可以直接跳过，不用填。
7. 部署成功后，你拿到的正式地址通常会是 `*.workers.dev`，而不是 `*.pages.dev`。

部署成功后，你会得到一个类似下面的公网地址：

- `https://your-project.your-account-id.workers.dev`

这个地址就是你后面手机、电脑和另一台设备共同访问的正式入口。

## Vercel 部署步骤

1. 把当前项目放进一个 GitHub 仓库。
2. 登录 Vercel，选择 `Add New Project`。
3. 导入这个 GitHub 仓库。
4. 在 Vercel 项目设置里，把 `Root Directory` 设为 `app`。
5. 确认下面几项：
	- Framework Preset：Vite
	- Build Command：`npm run build`
	- Output Directory：`dist`
6. 在 Vercel 的 Environment Variables 里填入：
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_PUBLISHABLE_KEY`
	- 如果你仍然沿用旧 key，也可以额外填 `VITE_SUPABASE_ANON_KEY`
7. 点击 Deploy。

部署成功后，你会得到一个类似下面的公网地址：

- `https://your-project.vercel.app`

这个地址就是你后面手机、电脑和另一台设备共同访问的正式入口。在没有自定义域名之前，先直接用它就够了。

## Supabase 里要同步修改的地方

部署出 Cloudflare 或 Vercel 地址后，到 Supabase 后台补这两个配置：

1. Authentication -> URL Configuration -> Site URL
	- 填你的 Cloudflare 正式地址，例如 `https://duo-wish-board-app.1103475965.workers.dev`
2. Authentication -> URL Configuration -> Redirect URLs
	- 至少加入 `https://duo-wish-board-app.1103475965.workers.dev`
	- 如果后面换成自定义域名，再把新域名也补进去

当前前端虽然主要推荐“邮件里的验证码”登录，不强依赖 magic link，但 Supabase 的 Site URL 仍然应该配置成线上地址，这样登录回跳和后续多端体验才稳定。

补充说明：Cloudflare 那个提示“Variables cannot be added to a Worker that only has static assets”说的是运行时 Worker 变量，而这套 Vite 前端真正需要的是构建时变量。现在仓库已经内置了生产环境前端配置，因此静态部署时不再依赖这个页面。

## 为什么这和最终需求直接相关

你最终想要的是：

- 手机和电脑都能访问
- 两边都能登录
- 两边都能看到同一套愿望、图片和留言
- 不依赖同一 Wi-Fi，也不依赖你的电脑一直开着

这几个需求真正依赖的是“前端有一个稳定的公网 HTTPS 地址”。

Supabase 负责数据、账号和同步。
Cloudflare Workers 静态站或 Vercel 负责把这套前端公开出去。

所以你现在没有自己的公网网址也没关系，Cloudflare 会先给你一个免费的公网网址，已经能满足多端使用。

## 如果 GitHub Pages 或 Vercel 在你的网络环境里不好用

如果 GitHub Pages 能打开但速度不稳定，或者 Vercel 后台显示已经 `Ready`，但电脑和手机在不同网络下都打不开 `*.vercel.app` 地址，这通常更像是你所在网络环境对托管域名的可访问性问题，而不是项目没部署成功。

这时可以直接切到 Cloudflare Pages：

- 当前路由在非 `github.io` 域名下会自动使用 history 模式
- Cloudflare 当前这条 Vite/Wrangler 部署链会自动生成 SPA 回退配置
- 构建产物仍然是标准的 `dist` 目录，Cloudflare 可以直接接

如果你后面还想保留 GitHub Pages 作为备用入口，也可以继续保留：

- 当前项目已经补好 [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)
- 构建时会自动把静态资源 base 调整到仓库路径
- 在 `github.io` 域名下会自动切成 hash 路由，避免 Vue history 路由 404

如果你的 GitHub 仓库名是 `duo-wish-board-app`，用户名是 `Baishijuju`，那么 GitHub Pages 的最终地址会是：

- `https://baishijuju.github.io/duo-wish-board-app/`

页面内路由会长成这样：

- `https://baishijuju.github.io/duo-wish-board-app/#/list`
- `https://baishijuju.github.io/duo-wish-board-app/#/review`

启用方法：

1. 把这几个更新后的文件同步到 GitHub 仓库
2. 到 GitHub 仓库 `Settings -> Pages`
3. 把 Source 设为 `GitHub Actions`
4. 等待 `Deploy App To GitHub Pages` 工作流跑完

## 当前仓库里的说明

当前工作区根目录主要承担说明和归档入口；如果后面继续走正式版，请以 `repo-sync/` 目录这套工程为准。

## Supabase 结构文件

数据库骨架在 [supabase/migrations/202604260001_initial_schema.sql](supabase/migrations/202604260001_initial_schema.sql)。

建议操作顺序：

1. 在 Supabase SQL Editor 执行 migration。
2. 确认 Auth 已启用邮箱 OTP。
3. 在 Authentication 的 URL 配置里补好 Site URL 和 Redirect URLs。
4. 再部署前端到 Cloudflare Pages 或 Vercel。

## 下一步

最优先的后续工作：

1. 把这套前端部署到 Cloudflare Pages，拿到第一个公网地址
2. 用这个公网地址补齐 Supabase Auth 的 Site URL / Redirect URLs
3. 再做手机真机测试和双设备登录验证
