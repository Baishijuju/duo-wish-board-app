# Supabase 骨架说明

这个目录保存数据库 migration 草案，目标是把当前前端里的 mock 状态逐步切换到真实的 Supabase 表和 RLS。

## 当前内容

- [202604260001_initial_schema.sql](migrations/202604260001_initial_schema.sql)
- [202604260002_harden_search_path.sql](migrations/202604260002_harden_search_path.sql)
- [202604260003_enable_realtime.sql](migrations/202604260003_enable_realtime.sql)
- [202604260004_grant_authenticated_access.sql](migrations/202604260004_grant_authenticated_access.sql)
- [202604270005_create_personal_space_rpc.sql](migrations/202604270005_create_personal_space_rpc.sql)
- [202604270006_wish_images_storage.sql](migrations/202604270006_wish_images_storage.sql)
- [202604270007_set_wish_cover_image.sql](migrations/202604270007_set_wish_cover_image.sql)
- [202604270008_reorder_wish_images.sql](migrations/202604270008_reorder_wish_images.sql)
- [202604270009_wish_image_notes.sql](migrations/202604270009_wish_image_notes.sql)
- [202604290010_make_personal_space_idempotent.sql](migrations/202604290010_make_personal_space_idempotent.sql)

## 建议应用方式

1. 打开 Supabase 项目的 SQL Editor。
2. 按文件名顺序执行 migration 文件中的 SQL。
3. 回到前端，把 `joinSpaceByInvite` 和愿望 store 逐步替换成真实查询和 RPC。

如果前端已经出现 `permission denied for table space_members` 或 `42501`，说明前 3 条 migration 已经不够，还要补执行 [202604260004_grant_authenticated_access.sql](migrations/202604260004_grant_authenticated_access.sql)。这不是邮箱登录问题，而是数据库没有把 `authenticated` 角色授权给业务表。

如果前端已经完成登录，但首次登录自动建空间时报 `new row violates row-level security policy for table "spaces"`，再补执行 [202604270005_create_personal_space_rpc.sql](migrations/202604270005_create_personal_space_rpc.sql)。这条 migration 会把“自动创建个人空间”改为通过 security definer RPC 完成，避免前端直接走 `spaces` 表 insert 时被 RLS 拦截。

如果要测试愿望详情下的图片上传，再补执行 [202604270006_wish_images_storage.sql](migrations/202604270006_wish_images_storage.sql)。这条 migration 会创建 `wish_images` 表、私有存储桶 `wish-images`、对象访问策略，并把图片元数据纳入 Realtime。

如果要在愿望详情里手动把某张图设为首页首图，再补执行 [202604270007_set_wish_cover_image.sql](migrations/202604270007_set_wish_cover_image.sql)。这条 migration 会新增 `set_wish_image_cover` RPC，按当前愿望可见性安全地重排图片顺序。

如果要启用多图拖拽排序，再补执行 [202604270008_reorder_wish_images.sql](migrations/202604270008_reorder_wish_images.sql)。这条 migration 会新增 `set_wish_image_order` RPC，用于把详情页拖拽后的整组图片顺序一次性写回数据库。

如果要启用图片备注，再补执行 [202604270009_wish_image_notes.sql](migrations/202604270009_wish_image_notes.sql)。这条 migration 会给 `wish_images` 增加 `note` 字段，并新增 `update_wish_image_note` RPC，让详情页可以安全保存图片备注。

如果同一个邮箱账号后续重复登录时总是被自动带到新的个人空间，或者原本应该复用的个人空间没有被正确找回，再补执行 [202604290010_make_personal_space_idempotent.sql](migrations/202604290010_make_personal_space_idempotent.sql)。这条 migration 会把 `create_personal_space` 改成幂等 RPC：同一个 Supabase 账号优先复用自己已经创建过的个人空间，并在成员记录缺失时自动补回 owner membership，避免重复生成个人空间。

## 邮箱 OTP 模板

如果当前前端采用“邮件里收验证码，回到首页手动输入”的登录流程，那么 Supabase 的邮件模板不要混用链接和验证码。

- `Magic Link` 模板里不要保留 `{{ .ConfirmationURL }}`。
- `Confirm sign up` 模板里也不要保留 `{{ .ConfirmationURL }}`。
- 两个模板都只保留 `{{ .Token }}`，不要放登录按钮、跳转链接、原始确认地址。

原因是企业邮箱和安全网关经常会提前访问邮件里的链接，一旦链接被访问，这次一次性验证码就可能直接失效，前端就会收到 `otp_expired`。

### 推荐模板：Magic Link

```html
<h2>邮箱验证码登录</h2>

<p>请在应用中输入当前 Supabase Email OTP 配置生成的验证码完成登录。</p>

<p style="font-size: 28px; font-weight: 700; letter-spacing: 0.3em; margin: 16px 0;">
	{{ .Token }}
</p>

<p>请回到应用首页，在“邮箱验证码登录”区域输入这组验证码。</p>
<p>如果这不是你的操作，请忽略此邮件。</p>
```

### 推荐模板：Confirm sign up

```html
<h2>邮箱验证码确认</h2>

<p>这是你本次登录/注册使用的验证码：</p>

<p style="font-size: 28px; font-weight: 700; letter-spacing: 0.3em; margin: 16px 0;">
	{{ .Token }}
</p>

<p>请回到应用首页，在“邮箱验证码登录”区域输入这组验证码完成验证。</p>
<p>如果你没有发起这次请求，请忽略此邮件。</p>
```

### 应用顺序

1. 先保存上面两个模板。
2. 回到 `Auth > Providers > Email`，确认 `Email OTP` 已启用。
3. 保存后重新发送一次验证码，只使用最后一封邮件里的验证码。
4. 如果你把 Supabase 的 Email OTP 长度改成了 8 位或其他位数，前端与回归脚本都会按实际邮件里的完整验证码校验，不需要额外改代码。
5. 不要点击任何邮件里的登录链接；如果邮件正文里还有链接，说明模板还没改干净。

如果前端仍然使用 `shouldCreateUser: true`，第一次用新邮箱登录时，Supabase 往往会走 `Confirm sign up` 模板，所以这两个模板必须一起改。

## 当前设计范围

- `spaces`
- `space_members`
- `wishes`
- `wish_comments`
- `wish_images`
- 基础的 `join_space_by_invite` function
- 基础 RLS 与成员访问控制
- Realtime publication 配置（wishes / wish_comments / wish_images）

图片上传现在走 Supabase Storage 私有桶；如果你已经把测试图放进 `app/Pic/`，可以直接在愿望详情页用文件选择器选这些图来验证上传、展示、单张删除、批量删除、“设为首图”、放大预览、拖拽排序和图片备注。