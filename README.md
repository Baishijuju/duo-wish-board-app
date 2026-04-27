# 双人人生愿望清单 App

这个目录是正式版前端工程，使用 Vue 3 + Vite + TypeScript + Pinia + Vue Router，并已经接上 Supabase 登录、云端愿望、留言、图片和统计能力。

## 当前状态

- 已接入邮箱验证码登录、空间邀请码加入、个人空间自动创建
- 已接入云端愿望 CRUD、愿望详情留言、Realtime 自动同步
- 已接入愿望图片上传、首图、拖拽排序、批量删除、图片备注和放大预览
- 已完成首页、清单页、统计页和详情页的正式视觉版式

## 本地开发

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm run dev`
3. 类型检查：`npm run typecheck`
4. 构建：`npm run build`

## 环境变量

参考 [app/.env.example](.env.example)。当前本地已经使用 `.env.local` 配好 Supabase 项目。

前端优先使用：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

如果你仍然使用旧式 anon key，也兼容：

- `VITE_SUPABASE_ANON_KEY`

## 推荐部署方式

如果你现在只想选一个最省事、最容易先跑通公网访问和手机真机测试的方案，优先选 Vercel。

原因很简单：

- 你不需要自己先有公网 IP
- 你不需要先买域名
- 部署后会先得到一个免费的 `*.vercel.app` 公网地址
- 这个公网地址已经足够让电脑和手机多端登录、访问同一套 Supabase 数据

仓库里已经补好了 [app/vercel.json](vercel.json)，用于处理 Vue Router 的 history 路由回退。只要在 Vercel 里把 Root Directory 设成 `app`，就可以直接部署这套正式版前端。

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

部署出 Vercel 地址后，到 Supabase 后台补这两个配置：

1. Authentication -> URL Configuration -> Site URL
	- 填你的 Vercel 地址，例如 `https://your-project.vercel.app`
2. Authentication -> URL Configuration -> Redirect URLs
	- 至少加入 `https://your-project.vercel.app`
	- 如果后面换成自定义域名，再把新域名也补进去

当前前端虽然主要推荐“邮件里的验证码”登录，不强依赖 magic link，但 Supabase 的 Site URL 仍然应该配置成线上地址，这样登录回跳和后续多端体验才稳定。

## 为什么这和最终需求直接相关

你最终想要的是：

- 手机和电脑都能访问
- 两边都能登录
- 两边都能看到同一套愿望、图片和留言
- 不依赖同一 Wi-Fi，也不依赖你的电脑一直开着

这几个需求真正依赖的是“前端有一个稳定的公网 HTTPS 地址”。

Supabase 负责数据、账号和同步。
Vercel 负责把这套前端公开出去。

所以你现在没有自己的公网网址也没关系，Vercel 会先给你一个免费的公网网址，已经能满足多端使用。

## 当前仓库里的说明

根目录原本那套 GitHub Pages 工作流只会发布旧静态版 `index.html + styles.css + script.js`，不适合现在这套 Vue 正式版前端。

如果后面继续走正式版，请以 `app/` 目录这套工程为准。

## Supabase 结构文件

数据库骨架在 [app/supabase/migrations/202604260001_initial_schema.sql](supabase/migrations/202604260001_initial_schema.sql)。

建议操作顺序：

1. 在 Supabase SQL Editor 执行 migration。
2. 确认 Auth 已启用邮箱 OTP。
3. 在 Authentication 的 URL 配置里补好 Site URL 和 Redirect URLs。
4. 再部署前端到 Vercel。

## 下一步

最优先的后续工作：

1. 把 `app/` 目录部署到 Vercel，拿到第一个公网地址
2. 用这个公网地址补齐 Supabase Auth 的 Site URL / Redirect URLs
3. 再做手机真机测试和双设备登录验证
