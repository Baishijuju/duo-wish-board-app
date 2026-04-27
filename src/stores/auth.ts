import type { EmailOtpType, Session } from '@supabase/supabase-js'
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export type MemberRole = 'owner' | 'member'
export type SessionState = 'anonymous' | 'magic-link-sent' | 'authenticated'
export type SpaceDataMode = 'mock' | 'supabase'

const STORAGE_KEY = 'duo-wish-board-auth:v2'

const DEFAULT_SPACE: SpaceRecord = {
  id: 'space-duo-board',
  name: '晨光 x 星野',
  inviteCode: 'WISH-2026',
  createdAt: '2026-04-20T08:00:00.000Z',
}

const DEFAULT_MEMBERS: SpaceMember[] = [
  {
    id: 'member-a',
    displayName: '晨光',
    email: 'chenguang@example.com',
    role: 'owner',
    joinedAt: '2026-04-20T08:05:00.000Z',
  },
  {
    id: 'member-b',
    displayName: '星野',
    email: 'xingye@example.com',
    role: 'member',
    joinedAt: '2026-04-20T08:16:00.000Z',
  },
]

export interface SpaceRecord {
  id: string
  name: string
  inviteCode: string
  createdAt: string
}

export interface SpaceMember {
  id: string
  displayName: string
  email: string
  role: MemberRole
  joinedAt: string
}

export interface AuthActionResult {
  ok: boolean
  message: string
  mode: 'mock' | 'supabase'
}

function formatAuthError(prefix: string, error: { code?: string; message: string }) {
  if (error.code) {
    return `${prefix}（${error.code}）：${error.message}`
  }

  return `${prefix}：${error.message}`
}

function formatUnknownError(prefix: string, error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = typeof error.message === 'string' ? error.message : String(error.message)
    const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined
    const details = 'details' in error && typeof error.details === 'string' && error.details ? error.details : ''
    const hint = 'hint' in error && typeof error.hint === 'string' && error.hint ? error.hint : ''

    if (code === '42501' && /permission denied for table (spaces|space_members|wishes|wish_comments)/i.test(message)) {
      return '已登录，但当前请求仍然无法访问业务表。若你已经执行过 202604260004_grant_authenticated_access.sql，这通常表示本次请求还没有真正带上 authenticated 会话，或还有别的数据库对象权限未放开。'
    }

    return [formatAuthError(prefix, { code, message }), details, hint].filter(Boolean).join(' | ')
  }

  return prefix
}

async function ensureSupabaseClientSession(session: Session | null) {
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

function normalizeOtpToken(token: string) {
  return token.normalize('NFKC').replace(/[^0-9a-z]/gi, '')
}

function formatEmailOtpError(error: { code?: string; message: string }, email: string, typedEmail?: string) {
  const emailHint = typedEmail && typedEmail !== email ? ` 当前会按 ${email} 校验。` : ''

  if (error.code === 'otp_expired') {
    return `邮箱验证码已失效。常见原因：重新发送过验证码后旧码会立即作废；邮件里如果还带有登录链接，企业邮箱安全扫描可能会提前消费这次验证码。请重新发送一次，只使用最后一封邮件里的验证码，不要点邮件里的任何登录链接。${emailHint}`
  }

  return `${formatAuthError('邮箱验证码校验失败', error)}${emailHint}`
}

interface PersistedAuthState {
  currentMemberId: string
  currentSpaceId: string
  dataMode: SpaceDataMode
  inviteCode: string
  joinedSpaceAt: string | null
  lastMagicLinkSentAt: string | null
  sessionEmail: string
  sessionState: SessionState
  spaceName: string
}

interface SpaceRow {
  id: string
  name: string
  invite_code: string
  created_at: string
}

interface SpaceMemberRow {
  space_id: string
  user_id: string
  display_name: string
  role: MemberRole
  joined_at: string
}

function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

function readPersistedState(): PersistedAuthState | null {
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

function cloneDefaultMembers() {
  return DEFAULT_MEMBERS.map((member) => ({ ...member }))
}

function deriveDisplayName(email: string) {
  const candidate = email.trim().split('@')[0]?.replace(/[._-]+/g, ' ').trim()

  if (!candidate) {
    return '成员'
  }

  return candidate.slice(0, 50)
}

function createInviteCode() {
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase()
  const timePart = Date.now().toString(36).slice(-4).toUpperCase()

  return `WISH-${randomPart}${timePart}`
}

function normalizeEmailOtpType(type: string): EmailOtpType | null {
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

export const useAuthStore = defineStore('auth', () => {
  const persisted = readPersistedState()
  const currentSpace = ref<SpaceRecord>({
    id: persisted?.currentSpaceId || DEFAULT_SPACE.id,
    name: persisted?.spaceName || DEFAULT_SPACE.name,
    inviteCode: persisted?.inviteCode || DEFAULT_SPACE.inviteCode,
    createdAt: DEFAULT_SPACE.createdAt,
  })
  const members = ref<SpaceMember[]>(cloneDefaultMembers())
  const currentMemberId = ref(persisted?.currentMemberId || DEFAULT_MEMBERS[0].id)
  const sessionEmail = ref(persisted?.sessionEmail || '')
  const sessionState = ref<SessionState>(persisted?.sessionState || 'anonymous')
  const lastMagicLinkSentAt = ref<string | null>(persisted?.lastMagicLinkSentAt || null)
  const joinedSpaceAt = ref<string | null>(persisted?.joinedSpaceAt || null)
  const dataMode = ref<SpaceDataMode>(persisted?.dataMode || 'mock')
  const activeSession = ref<Session | null>(null)
  const authCallbackMessage = ref('')
  const isRefreshingSpace = ref(false)

  const currentMember = computed(() => {
    return members.value.find((member) => member.id === currentMemberId.value) ?? members.value[0]
  })

  const currentSpaceId = computed(() => currentSpace.value.id)
  const spaceName = computed(() => currentSpace.value.name)
  const inviteCode = computed(() => currentSpace.value.inviteCode)
  const isAuthenticated = computed(() => sessionState.value === 'authenticated')
  const usesSupabaseSpace = computed(() => dataMode.value === 'supabase' && isAuthenticated.value)
  const canSwitchMembers = computed(() => !usesSupabaseSpace.value)
  const sessionSummary = computed(() => {
    if (authCallbackMessage.value) {
      return authCallbackMessage.value
    }

    if (sessionState.value === 'magic-link-sent') {
      return '登录邮件已发出，等待邮箱确认后会建立 Supabase 会话；如果邮件里提供的是验证码，也可以在首页手动输入。'
    }

    if (!isAuthenticated.value) {
      return '尚未登录，当前显示的是本地演示数据。'
    }

    if (usesSupabaseSpace.value) {
      return `${currentMember.value?.displayName} 已登录，当前空间与愿望将优先走 Supabase。`
    }

    return `${currentMember.value?.displayName} 已登录，但当前仍停留在本地演示空间。`
  })

  function resetToMockSpace() {
    currentSpace.value = { ...DEFAULT_SPACE }
    members.value = cloneDefaultMembers()
    dataMode.value = 'mock'

    const matchedMember = members.value.find((member) => member.email.toLowerCase() === sessionEmail.value.toLowerCase())
    currentMemberId.value = matchedMember?.id ?? members.value[0]?.id ?? ''
  }

  function applyMemberFromEmail(email: string) {
    const matchedMember = members.value.find((member) => member.email.toLowerCase() === email.toLowerCase())

    if (matchedMember) {
      currentMemberId.value = matchedMember.id
      return matchedMember
    }

    return members.value[0]
  }

  async function listMemberships(userId: string) {
    if (!supabase) {
      return [] as SpaceMemberRow[]
    }

    const { data, error } = await supabase
      .from('space_members')
      .select('space_id, user_id, display_name, role, joined_at')
      .eq('user_id', userId)
      .order('joined_at', { ascending: true })

    if (error) {
      throw error
    }

    return (data ?? []) as SpaceMemberRow[]
  }

  async function listSpaces(spaceIds: string[]) {
    if (!supabase || !spaceIds.length) {
      return [] as SpaceRow[]
    }

    const { data, error } = await supabase
      .from('spaces')
      .select('id, name, invite_code, created_at')
      .in('id', spaceIds)

    if (error) {
      throw error
    }

    return (data ?? []) as SpaceRow[]
  }

  async function loadMembersForSpace(spaceId: string, session: Session) {
    if (!supabase) {
      return
    }

    const { data, error } = await supabase
      .from('space_members')
      .select('space_id, user_id, display_name, role, joined_at')
      .eq('space_id', spaceId)
      .order('joined_at', { ascending: true })

    if (error) {
      throw error
    }

    const nextMembers = ((data ?? []) as SpaceMemberRow[]).map((member) => ({
      id: member.user_id,
      displayName: member.display_name || (member.user_id === session.user.id ? deriveDisplayName(session.user.email ?? '') : '成员'),
      email: member.user_id === session.user.id ? session.user.email?.trim().toLowerCase() ?? '' : '',
      role: member.role,
      joinedAt: member.joined_at,
    }))

    members.value = nextMembers.length
      ? nextMembers
      : [
          {
            id: session.user.id,
            displayName: deriveDisplayName(session.user.email ?? ''),
            email: session.user.email?.trim().toLowerCase() ?? '',
            role: 'owner',
            joinedAt: new Date().toISOString(),
          },
        ]
  }

  async function createDefaultSpaceForSession(session: Session) {
    if (!supabase) {
      return null
    }

    const displayName = deriveDisplayName(session.user.email ?? '')

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error } = await supabase.rpc('create_personal_space', {
        display_name_input: displayName,
        invite_code_input: createInviteCode(),
        space_name_input: `${displayName} 的愿望空间`,
      })

      if (error) {
        if (error.code === '23505') {
          continue
        }

        throw error
      }

      return data as SpaceRow
    }

    return null
  }

  async function refreshSpaceContext(preferredSpaceId?: string, session: Session | null = activeSession.value) {
    if (!supabase || !session) {
      return false
    }

    isRefreshingSpace.value = true

    try {
      let memberships = await listMemberships(session.user.id)

      if (!memberships.length) {
        const createdSpace = await createDefaultSpaceForSession(session)

        if (!createdSpace) {
          authCallbackMessage.value = '已登录，但未找到可访问的 Supabase 空间，也未能自动创建个人空间。'
          return false
        }

        memberships = await listMemberships(session.user.id)
      }

      if (!memberships.length) {
        authCallbackMessage.value = '已登录，但当前账号还没有任何 Supabase 空间成员记录。请确认初始 schema migration 已完整执行。'
        return false
      }

      const spaces = await listSpaces([...new Set(memberships.map((membership) => membership.space_id))])
      const spacesById = new Map(spaces.map((space) => [space.id, space]))

      const targetMembership = memberships.find((membership) => membership.space_id === preferredSpaceId)
        ?? memberships.find((membership) => membership.space_id === currentSpace.value.id)
        ?? memberships[0]

      const targetSpace = targetMembership ? spacesById.get(targetMembership.space_id) ?? null : null

      if (!targetMembership || !targetSpace) {
        authCallbackMessage.value = '已登录，但读取 Supabase 空间详情失败。请确认 spaces 和 space_members 表都已创建并开放给前端访问。'
        return false
      }

      currentSpace.value = {
        id: targetSpace.id,
        name: targetSpace.name,
        inviteCode: targetSpace.invite_code,
        createdAt: targetSpace.created_at,
      }
      sessionEmail.value = session.user.email?.trim().toLowerCase() ?? ''
      currentMemberId.value = session.user.id
      joinedSpaceAt.value = targetMembership.joined_at
      dataMode.value = 'supabase'
      authCallbackMessage.value = ''

      await loadMembersForSpace(targetSpace.id, session)
      return true
    } catch (error) {
      authCallbackMessage.value = formatUnknownError('已登录，但同步 Supabase 空间失败', error)
      return false
    } finally {
      isRefreshingSpace.value = false
    }
  }

  async function applySupabaseSession(session: Session | null) {
    activeSession.value = session
    const nextEmail = session?.user?.email?.trim().toLowerCase() || ''

    if (nextEmail) {
      authCallbackMessage.value = ''
      sessionEmail.value = nextEmail
      sessionState.value = 'authenticated'

      const synced = await refreshSpaceContext(undefined, session)

      if (!synced) {
        resetToMockSpace()
        applyMemberFromEmail(nextEmail)
      }

      if (!joinedSpaceAt.value) {
        joinedSpaceAt.value = new Date().toISOString()
      }

      return
    }

    if (sessionState.value !== 'magic-link-sent') {
      sessionState.value = 'anonymous'
      sessionEmail.value = ''
      joinedSpaceAt.value = null
      resetToMockSpace()
    }
  }

  function clearAuthCallbackUrl() {
    if (typeof window === 'undefined') {
      return
    }

    const nextUrl = new URL(window.location.href)

    for (const paramName of ['code', 'token_hash', 'type', 'error', 'error_code', 'error_description']) {
      nextUrl.searchParams.delete(paramName)
    }

    const hashParams = new URLSearchParams(nextUrl.hash.startsWith('#') ? nextUrl.hash.slice(1) : nextUrl.hash)

    for (const paramName of ['access_token', 'refresh_token', 'expires_at', 'expires_in', 'provider_token', 'provider_refresh_token', 'token_type', 'type', 'error', 'error_code', 'error_description']) {
      hashParams.delete(paramName)
    }

    nextUrl.hash = hashParams.toString() ? `#${hashParams.toString()}` : ''
    window.history.replaceState({}, window.document.title, `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`)
  }

  async function finalizeAuthRedirect() {
    if (!supabase || typeof window === 'undefined') {
      return null
    }

    const currentUrl = new URL(window.location.href)
    const searchParams = currentUrl.searchParams
    const hashParams = new URLSearchParams(currentUrl.hash.startsWith('#') ? currentUrl.hash.slice(1) : currentUrl.hash)
    const callbackError = searchParams.get('error_description') || hashParams.get('error_description') || searchParams.get('error') || hashParams.get('error')

    if (callbackError) {
      sessionState.value = 'anonymous'
      authCallbackMessage.value = `登录回跳失败：${decodeURIComponent(callbackError)}`
      clearAuthCallbackUrl()
      return null
    }

    const authCode = searchParams.get('code')

    if (authCode) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)
      clearAuthCallbackUrl()

      if (error) {
        sessionState.value = 'anonymous'
        authCallbackMessage.value = `登录回跳失败：${error.message}`
        return null
      }

      authCallbackMessage.value = '邮箱验证成功，正在恢复登录会话。'
      return data.session
    }

    const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash')
    const tokenType = searchParams.get('type') || hashParams.get('type')

    if (tokenHash && tokenType) {
      const normalizedType = normalizeEmailOtpType(tokenType)
      clearAuthCallbackUrl()

      if (!normalizedType) {
        sessionState.value = 'anonymous'
        authCallbackMessage.value = `登录回跳失败：无法识别回调类型 ${tokenType}`
        return null
      }

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: normalizedType,
      })

      if (error) {
        sessionState.value = 'anonymous'
        authCallbackMessage.value = `登录回跳失败：${error.message}`
        return null
      }

      authCallbackMessage.value = '邮箱验证成功，正在恢复登录会话。'
      return data.session
    }

    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      clearAuthCallbackUrl()

      if (error) {
        sessionState.value = 'anonymous'
        authCallbackMessage.value = `登录回跳失败：${error.message}`
        return null
      }

      authCallbackMessage.value = '邮箱验证成功，正在恢复登录会话。'
      return data.session
    }

    return null
  }

  let authListenerBound = false

  async function initializeAuthSession() {
    if (!supabase || authListenerBound) {
      return
    }

    const redirectedSession = await finalizeAuthRedirect()
    const { data } = await supabase.auth.getSession()
    await applySupabaseSession(redirectedSession ?? data.session)

    supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void applySupabaseSession(session)
      }, 0)
    })

    authListenerBound = true
  }

  async function requestMagicLink(email: string): Promise<AuthActionResult> {
    const normalizedEmail = email.trim().toLowerCase()

    authCallbackMessage.value = ''

    if (!normalizedEmail) {
      return {
        ok: false,
        message: '请输入有效邮箱后再继续。',
        mode: isSupabaseConfigured ? 'supabase' : 'mock',
      }
    }

    const matchedMember = members.value.find((member) => member.email.toLowerCase() === normalizedEmail) ?? members.value[0]

    sessionEmail.value = normalizedEmail
    currentMemberId.value = matchedMember.id
    lastMagicLinkSentAt.value = new Date().toISOString()

    if (!joinedSpaceAt.value) {
      joinedSpaceAt.value = new Date().toISOString()
    }

    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        return {
          ok: false,
          message: formatAuthError('Supabase 发送验证码失败', error),
          mode: 'supabase',
        }
      }

      sessionState.value = 'magic-link-sent'

      return {
        ok: true,
        message: `已向 ${normalizedEmail} 发送登录验证码。只有最后一封邮件里的验证码有效；如果邮件里还带有登录链接，不要点那个链接，只用验证码。`,
        mode: 'supabase',
      }
    }

    sessionState.value = 'authenticated'

    return {
      ok: true,
      message: `已为 ${matchedMember.displayName} 建立本地 mock 会话。`,
      mode: 'mock',
    }
  }

  async function verifyEmailOtp(email: string, token: string): Promise<AuthActionResult> {
    const requestedEmail = sessionEmail.value.trim().toLowerCase()
    const typedEmail = email.trim().toLowerCase()
    const normalizedEmail = requestedEmail || typedEmail
    const normalizedToken = normalizeOtpToken(token)

    if (!normalizedEmail || !normalizedToken) {
      return {
        ok: false,
        message: '请输入邮箱和验证码后再继续。',
        mode: supabase ? 'supabase' : 'mock',
      }
    }

    if (!supabase) {
      return {
        ok: false,
        message: '当前环境未接入 Supabase，无法校验邮箱验证码。',
        mode: 'mock',
      }
    }

    authCallbackMessage.value = ''
    sessionEmail.value = normalizedEmail

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedToken,
      type: 'email',
    })

    if (error) {
      return {
        ok: false,
        message: formatEmailOtpError(error, normalizedEmail, typedEmail),
        mode: 'supabase',
      }
    }

    const confirmedSession = await ensureSupabaseClientSession(data.session)
    await applySupabaseSession(confirmedSession)

    return {
      ok: true,
      message: '邮箱验证码校验成功，已完成登录。',
      mode: 'supabase',
    }
  }

  async function joinSpaceByInvite(code: string): Promise<AuthActionResult> {
    const normalizedCode = code.trim().toUpperCase()

    if (!normalizedCode) {
      return {
        ok: false,
        message: '请输入邀请码后再继续。',
        mode: supabase ? 'supabase' : 'mock',
      }
    }

    if (supabase && activeSession.value && isAuthenticated.value) {
      const { data, error } = await supabase.rpc('join_space_by_invite', {
        display_name_input: currentMember.value?.displayName || deriveDisplayName(sessionEmail.value),
        invite_code_input: normalizedCode,
      })

      if (error) {
        return {
          ok: false,
          message: `加入空间失败：${error.message}`,
          mode: 'supabase',
        }
      }

      const joinedMember = data as SpaceMemberRow | null
      await refreshSpaceContext(joinedMember?.space_id, activeSession.value)

      return {
        ok: true,
        message: '已通过 Supabase 加入空间，成员和邀请码已经刷新。',
        mode: 'supabase',
      }
    }

    if (supabase && !isAuthenticated.value) {
      return {
        ok: false,
        message: '请先通过邮箱验证码登录，再加入空间。',
        mode: 'supabase',
      }
    }

    if (!normalizedCode || normalizedCode !== currentSpace.value.inviteCode.toUpperCase()) {
      return {
        ok: false,
        message: '邀请码不正确，当前只接受示例码。',
        mode: 'mock',
      }
    }

    joinedSpaceAt.value = new Date().toISOString()
    return {
      ok: true,
      message: '邀请码校验通过；前端暂时还是本地流程，数据库侧的 join_space_by_invite RPC 已准备好。',
      mode: 'mock',
    }
  }

  function switchMember(memberId: string) {
    if (!canSwitchMembers.value) {
      return
    }

    const nextMember = members.value.find((member) => member.id === memberId)

    if (!nextMember) {
      return
    }

    currentMemberId.value = nextMember.id
    sessionEmail.value = nextMember.email

    if (sessionState.value === 'anonymous') {
      sessionState.value = 'authenticated'
    }
  }

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut()
    }

    activeSession.value = null
    authCallbackMessage.value = ''
    dataMode.value = 'mock'
    sessionState.value = 'anonymous'
    sessionEmail.value = ''
    joinedSpaceAt.value = null
    resetToMockSpace()
  }

  const storage = getBrowserStorage()

  if (storage) {
    watch(
      [currentMemberId, currentSpaceId, dataMode, inviteCode, joinedSpaceAt, lastMagicLinkSentAt, sessionEmail, sessionState, spaceName],
      () => {
        storage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            currentMemberId: currentMemberId.value,
            currentSpaceId: currentSpaceId.value,
            dataMode: dataMode.value,
            inviteCode: inviteCode.value,
            joinedSpaceAt: joinedSpaceAt.value,
            lastMagicLinkSentAt: lastMagicLinkSentAt.value,
            sessionEmail: sessionEmail.value,
            sessionState: sessionState.value,
            spaceName: spaceName.value,
          } satisfies PersistedAuthState),
        )
      },
      { immediate: true },
    )
  }

  return {
    currentSpace,
    currentMember,
    currentMemberId,
    currentSpaceId,
    dataMode,
    initializeAuthSession,
    inviteCode,
    isAuthenticated,
    isRefreshingSpace,
    joinSpaceByInvite,
    joinedSpaceAt,
    lastMagicLinkSentAt,
    members,
    requestMagicLink,
    verifyEmailOtp,
    canSwitchMembers,
    sessionEmail,
    sessionState,
    sessionSummary,
    signOut,
    spaceName,
    switchMember,
    usesSupabaseSpace,
  }
})