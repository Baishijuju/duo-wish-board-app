import { describe, expect, it } from 'vitest'
import { formatAuthError, formatEmailOtpError, formatUnknownError, normalizeOtpToken } from '../../../src/modules/auth/auth.session'

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
})
