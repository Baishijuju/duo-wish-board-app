import { describe, expect, it } from 'vitest'
import {
  formatAuthError,
  formatEmailOtpError,
  formatUnknownError,
  normalizeOtpToken,
  shouldPreserveCloudContextOnMissingSession,
  shouldFallBackToMockMode,
  shouldIgnoreBoundMembershipsError,
} from '../../../src/modules/auth/auth.session'

describe('auth.session', () => {
  it('formats auth errors with or without code', () => {
    expect(formatAuthError('失败', { code: 'X', message: 'bad' })).toBe('失败（X）：bad')
    expect(formatAuthError('失败', { message: 'bad' })).toBe('失败：bad')
  })

  it('normalizes otp token', () => {
    expect(normalizeOtpToken(' 12-AB  ')).toBe('12AB')
  })

  it('formats expired otp error with guidance', () => {
    const message = formatEmailOtpError({ code: 'otp_expired', message: 'expired' }, 'a@example.com')
    expect(message).toContain('邮箱验证码已失效')
  })

  it('formats permission denied database error clearly', () => {
    const message = formatUnknownError('失败', {
      code: '42501',
      message: 'permission denied for table wishes',
      details: '',
      hint: '',
    })

    expect(message).toContain('无法访问业务表')
  })

  it('formats browser/network blocked fetch error with action guidance', () => {
    const message = formatUnknownError('失败', {
      message: 'TypeError: Failed to fetch',
      details: '',
      hint: '',
    })

    expect(message).toContain('拦截了 Supabase 云端请求')
  })

  it('keeps a valid Supabase session instead of falling back to mock when a refresh attempt fails', () => {
    expect(shouldFallBackToMockMode(true, false)).toBe(false)
    expect(shouldFallBackToMockMode(false, false)).toBe(true)
    expect(shouldFallBackToMockMode(true, true)).toBe(false)
  })

  it('ignores known network/CORS failures for optional bound-membership hydration', () => {
    expect(shouldIgnoreBoundMembershipsError('Failed to fetch')).toBe(true)
    expect(shouldIgnoreBoundMembershipsError('cors policy blocked')).toBe(true)
    expect(shouldIgnoreBoundMembershipsError('network timeout')).toBe(true)
    expect(shouldIgnoreBoundMembershipsError('permission denied')).toBe(false)
  })

  it('preserves cloud context when session is temporarily missing', () => {
    expect(shouldPreserveCloudContextOnMissingSession(true, false, false)).toBe(true)
    expect(shouldPreserveCloudContextOnMissingSession(false, true, true)).toBe(true)
    expect(shouldPreserveCloudContextOnMissingSession(false, false, true)).toBe(false)
  })
})
