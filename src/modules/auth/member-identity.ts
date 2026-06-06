const PREFERRED_DISPLAY_NAME_ALIASES: Record<string, string> = {
  '1103475965': '泰杰',
}

export function normalizeDisplayName(displayName: string) {
  const normalizedName = displayName.trim()

  if (!normalizedName) {
    return ''
  }

  return PREFERRED_DISPLAY_NAME_ALIASES[normalizedName] ?? normalizedName
}

export function deriveDisplayName(email: string) {
  const candidate = normalizeDisplayName(email.trim().split('@')[0]?.replace(/[._-]+/g, ' ').trim() ?? '')

  if (!candidate) {
    return '成员'
  }

  return candidate.slice(0, 50)
}

export function createInviteCode() {
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase()
  const timePart = Date.now().toString(36).slice(-4).toUpperCase()

  return `WISH-${randomPart}${timePart}`
}
