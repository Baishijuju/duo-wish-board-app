import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export function formatAuthError(prefix: string, error: { code?: string; message: string }) {
  if (error.code) {
    return `${prefix}（${error.code}）：${error.message}`
  }

  return `${prefix}：${error.message}`
}

function hasBlankSupabaseErrorDetails(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const message = 'message' in error && typeof error.message === 'string' ? error.message.trim() : ''
  const details = 'details' in error && typeof error.details === 'string' ? error.details.trim() : ''
  const hint = 'hint' in error && typeof error.hint === 'string' ? error.hint.trim() : ''
  const code = 'code' in error && typeof error.code === 'string' ? error.code.trim() : ''

  return !message && !details && !hint && !code
}

export function createSupabaseBootstrapError(
  stage: 'space_members' | 'create_personal_space' | 'ensure_bound_space_memberships',
  error: unknown,
) {
  const migrationHint = '请优先确认云端已执行 202604260004_grant_authenticated_access.sql、202604270005_create_personal_space_rpc.sql、202604290010_make_personal_space_idempotent.sql、202604290011_bind_space_emails.sql，并在 Supabase Dashboard 里刷新 API schema cache。'

  if (hasBlankSupabaseErrorDetails(error)) {
    return new Error(`Supabase 空间自举失败：${stage} 返回了空白错误。${migrationHint}`)
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = typeof error.message === 'string' ? error.message : String(error.message)

    if (/failed to fetch/i.test(message)) {
      return new Error(`Supabase 空间自举失败：${stage} 在浏览器侧表现为 Failed to fetch。${migrationHint}`)
    }
  }

  return error
}

export function formatUnknownError(prefix: string, error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = typeof error.message === 'string' ? error.message : String(error.message)
    const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined
    const details = 'details' in error && typeof error.details === 'string' && error.details ? error.details : ''
    const hint = 'hint' in error && typeof error.hint === 'string' && error.hint ? error.hint : ''

    if (code === '42501' && /permission denied for table (spaces|space_members|wishes|wish_comments)/i.test(message)) {
      return '已登录，但当前请求仍然无法访问业务表。若你已经执行过 202604260004_grant_authenticated_access.sql，这通常表示本次请求还没有真正带上 authenticated 会话，或还有别的数据库对象权限未放开。'
    }

    if (/failed to fetch|net::err_failed|cors|access-control-allow-origin/i.test(message)) {
      return '已登录，但当前浏览器/网络环境拦截了 Supabase 云端请求（常见为 CORS 或网络策略导致）。建议先换 Chrome/Edge 无痕窗口测试，或关闭当前浏览器的隐私防跟踪与拦截扩展后重试。'
    }

    return [formatAuthError(prefix, { code, message }), details, hint].filter(Boolean).join(' | ')
  }

  return prefix
}

export async function ensureSupabaseClientSession(session: Session | null) {
  if (!supabase || !session) {
    return session
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })

  if (error) {
    throw error
  }

  return data.session ?? session
}

export function shouldFallBackToMockMode(hasValidSession: boolean, synced: boolean) {
  return !hasValidSession && !synced
}

export function shouldPreserveCloudContextOnMissingSession(
  wasUsingSupabaseSpace: boolean,
  hadAuthenticatedState: boolean,
  hasKnownSessionEmail: boolean,
) {
  return wasUsingSupabaseSpace || (hadAuthenticatedState && hasKnownSessionEmail)
}

export function shouldIgnoreBoundMembershipsError(message: string) {
  return /failed to fetch|network|cors/i.test(message)
}

export function normalizeOtpToken(token: string) {
  return token.normalize('NFKC').replace(/[^0-9a-z]/gi, '')
}

export function formatEmailOtpError(error: { code?: string; message: string }, email: string, typedEmail?: string) {
  const emailHint = typedEmail && typedEmail !== email ? ` 当前会按 ${email} 校验。` : ''

  if (error.code === 'otp_expired') {
    return `邮箱验证码已失效。常见原因：重新发送过验证码后旧码会立即作废；邮件里如果还带有登录链接，企业邮箱安全扫描可能会提前消费这次验证码。请重新发送一次，只使用最后一封邮件里的验证码，不要点邮件里的任何登录链接。${emailHint}`
  }

  return `${formatAuthError('邮箱验证码校验失败', error)}${emailHint}`
}
