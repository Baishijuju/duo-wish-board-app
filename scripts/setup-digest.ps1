#Requires -Version 5.1
<#
    每日打卡提醒 Worker —— 一键部署脚本

    用法（在本仓库根目录打开 PowerShell）：
        pwsh -File .\scripts\setup-digest.ps1

    它会依次做：
      1. 登录 Cloudflare（浏览器会弹出授权页，点「允许」）
      2. 写入 SUPABASE_URL（已知，自动填）
      3. 自动从 Supabase 管理接口读取 service_role key 并写入
      4. 生成随机 DIGEST_KEY 并写入（最后会打印出来，用于预览）
      5. 让你粘贴 Server酱 的 SendKey 并写入
      6. 部署，并打印预览地址

    全程不会把 service_role key 或 SendKey 回显到屏幕。
#>

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

$config = 'wrangler.digest.toml'
$projectRef = 'cimwhpatnazndnnvvfoz'

function Write-Step {
    param([string]$Number, [string]$Text)
    Write-Host ''
    Write-Host "=== $Number  $Text ===" -ForegroundColor Cyan
}

# ── 1. 登录 ────────────────────────────────────────────────
Write-Step '1/6' '登录 Cloudflare'
Write-Host '浏览器会弹出 Cloudflare 授权页，请点「允许 / Allow」。' -ForegroundColor Yellow
Write-Host '如果没弹出，复制下面提示里的链接手动打开。' -ForegroundColor Yellow

& npx.cmd --yes wrangler@4 login
if ($LASTEXITCODE -ne 0) {
    throw '登录失败或超时。重新运行本脚本，并在浏览器弹出后立刻点「允许」。'
}

# ── 2. SUPABASE_URL ───────────────────────────────────────
Write-Step '2/6' '写入 SUPABASE_URL'
'https://cimwhpatnazndnnvvfoz.supabase.co' | & npx.cmd --yes wrangler@4 secret put SUPABASE_URL -c $config
if ($LASTEXITCODE -ne 0) { throw '写入 SUPABASE_URL 失败' }

# ── 3. service_role key（自动读取）─────────────────────────
Write-Step '3/6' '写入 SUPABASE_SERVICE_ROLE_KEY'
$supabaseToken = [Environment]::GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'User')

if (-not $supabaseToken) {
    throw '找不到用户环境变量 SUPABASE_ACCESS_TOKEN，无法自动读取 service_role key。请手动到 Supabase 后台复制后运行：npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY -c ' + $config
}

$keys = Invoke-RestMethod `
    -Uri "https://api.supabase.com/v1/projects/$projectRef/api-keys?reveal=true" `
    -Headers @{ Authorization = "Bearer $supabaseToken" }

$serviceRole = ($keys | Where-Object { $_.name -eq 'service_role' } | Select-Object -First 1).api_key

if (-not $serviceRole) { throw '没有取到 service_role key，请到 Supabase 后台手动复制' }

$serviceRole | & npx.cmd --yes wrangler@4 secret put SUPABASE_SERVICE_ROLE_KEY -c $config
if ($LASTEXITCODE -ne 0) { throw '写入 service_role key 失败' }
Write-Host '已写入（不回显）' -ForegroundColor Green

# ── 4. DIGEST_KEY（自动生成）──────────────────────────────
Write-Step '4/6' '写入 DIGEST_KEY'
$digestKey = [guid]::NewGuid().ToString('N')
$digestKey | & npx.cmd --yes wrangler@4 secret put DIGEST_KEY -c $config
if ($LASTEXITCODE -ne 0) { throw '写入 DIGEST_KEY 失败' }

# ── 5. SERVERCHAN_KEY（需要你提供）────────────────────────
Write-Step '5/6' '写入 SERVERCHAN_KEY'
Write-Host '请打开 https://sct.ftqq.com/ ，微信扫码登录，复制首页的 SendKey。' -ForegroundColor Yellow
$sendKey = Read-Host '粘贴 SendKey 后回车'

if ([string]::IsNullOrWhiteSpace($sendKey)) {
    throw '没有输入 SendKey'
}

$sendKey.Trim() | & npx.cmd --yes wrangler@4 secret put SERVERCHAN_KEY -c $config
if ($LASTEXITCODE -ne 0) { throw '写入 Server酱 SendKey 失败' }

# ── 6. 部署 ───────────────────────────────────────────────
Write-Step '6/6' '部署'
& npx.cmd --yes wrangler@4 deploy -c $config
if ($LASTEXITCODE -ne 0) { throw '部署失败' }

Write-Host ''
Write-Host '=== 部署完成 ===' -ForegroundColor Green
Write-Host ''
Write-Host '预览接口（只算不发，不会给微信发消息）：' -ForegroundColor Cyan
Write-Host '  把上面部署输出里的 workers.dev 地址后面加上：' -ForegroundColor Cyan
Write-Host "  /today?key=$digestKey" -ForegroundColor White
Write-Host ''
Write-Host '打开它，把返回的 JSON 发给我核对数字和文案。' -ForegroundColor Cyan
Write-Host '确认无误后，定时任务（每天北京时间 21:30）就已经生效了。' -ForegroundColor Cyan
