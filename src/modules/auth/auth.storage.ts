export const STORAGE_KEY = 'duo-wish-board-auth:v2'

export interface PersistedAuthState {
  currentMemberId: string
  currentSpaceId: string
  dataMode: 'mock' | 'supabase'
  inviteCode: string
  joinedSpaceAt: string | null
  lastSupabaseSpaceId: string
  lastMagicLinkSentAt: string | null
  sessionEmail: string
  sessionState: 'anonymous' | 'magic-link-sent' | 'authenticated'
  spaceName: string
}

export function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export function readPersistedState(): PersistedAuthState | null {
  const storage = getBrowserStorage()

  if (!storage) {
    return null
  }

  const raw = storage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as PersistedAuthState
  } catch {
    return null
  }
}
