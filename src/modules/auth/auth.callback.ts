import type { EmailOtpType } from '@supabase/supabase-js'

export function normalizeEmailOtpType(type: string): EmailOtpType | null {
  const normalizedType = type.trim().toLowerCase()

  switch (normalizedType) {
    case 'email':
    case 'recovery':
    case 'invite':
    case 'email_change':
    case 'magiclink':
    case 'signup':
      return normalizedType as EmailOtpType
    default:
      return null
  }
}
