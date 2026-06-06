import type { EmailOtpType, Session } from '@supabase/supabase-js'
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { normalizeEmailOtpType as normalizeEmailOtpTypeModule } from '../modules/auth/auth.callback'
import {
  getBrowserStorage as getBrowserStorageModule,
  readPersistedState as readPersistedStateModule,
  STORAGE_KEY as AUTH_STORAGE_KEY,
  type PersistedAuthState,
} from '../modules/auth/auth.storage'
import {
  createInviteCode as createInviteCodeModule,
  deriveDisplayName as deriveDisplayNameModule,
  normalizeDisplayName as normalizeDisplayNameModule,
} from '../modules/auth/member-identity'
import {
  createSupabaseBootstrapError as createSupabaseBootstrapErrorModule,
  ensureSupabaseClientSession as ensureSupabaseClientSessionModule,
  formatAuthError as formatAuthErrorModule,
  formatEmailOtpError as formatEmailOtpErrorModule,
  formatUnknownError as formatUnknownErrorModule,
  normalizeOtpToken as normalizeOtpTokenModule,
} from '../modules/auth/auth.session'
import {
  createDefaultAppCapabilities,
  fetchAppCapabilities,
  getCapabilityMissingMessage,
  isBoundSpaceMembershipFeatureMissing,
  type AppCapabilities,
  type AppCapabilityKey,
} from '../modules/sync/capabilities'

export type MemberRole = 'owner' | 'member'
export type SessionState = 'anonymous' | 'magic-link-sent' | 'authenticated'
export type SpaceDataMode = 'mock' | 'supabase'

const STORAGE_KEY = AUTH_STORAGE_KEY

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

export type AppCapabilitiesStatus = 'idle' | 'loading' | 'ready' | 'fallback' | 'error'

function formatAuthError(prefix: string, error: { code?: string; message: string }) {
  return formatAuthErrorModule(prefix, error)
}

function createSupabaseBootstrapError(stage: 'space_members' | 'create_personal_space' | 'ensure_bound_space_memberships', error: unknown) {
  return createSupabaseBootstrapErrorModule(stage, error)
}

function formatUnknownError(prefix: string, error: unknown) {
  return formatUnknownErrorModule(prefix, error)
}

async function ensureSupabaseClientSession(session: Session | null) {
  return ensureSupabaseClientSessionModule(session)
}

function normalizeOtpToken(token: string) {
  return normalizeOtpTokenModule(token)
}

function formatEmailOtpError(error: { code?: string; message: string }, email: string, typedEmail?: string) {
  return formatEmailOtpErrorModule(error, email, typedEmail)
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
  return getBrowserStorageModule()
}

function readPersistedState(): PersistedAuthState | null {
  return readPersistedStateModule()
}

function cloneDefaultMembers() {
  return DEFAULT_MEMBERS.map((member) => ({ ...member }))
}

function normalizeDisplayName(displayName: string) {
  return normalizeDisplayNameModule(displayName)
}

function deriveDisplayName(email: string) {
  return deriveDisplayNameModule(email)
}

function createInviteCode() {
  return createInviteCodeModule()
}

function normalizeEmailOtpType(type: string): EmailOtpType | null {
  return normalizeEmailOtpTypeModule(type)
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
  const lastSupabaseSpaceId = ref(persisted?.lastSupabaseSpaceId || '')
  const activeSession = ref<Session | null>(null)
  const authCallbackMessage = ref('')
  const isRefreshingSpace = ref(false)
  const appCapabilities = ref<AppCapabilities>(createDefaultAppCapabilities())
  const appCapabilitiesStatus = ref<AppCapabilitiesStatus>('idle')
  const appCapabilitiesMessage = ref('')

  const currentMember = computed(() => {
    return members.value.find((member) => member.id === currentMemberId.value) ?? members.value[0]
  })

  const currentSpaceId = computed(() => currentSpace.value.id)
  const spaceName = computed(() => currentSpace.value.name)
  const inviteCode = computed(() => currentSpace.value.inviteCode)
  const isAuthenticated = computed(() => sessionState.value === 'authenticated')
  const usesSupabaseSpace = computed(() => dataMode.value === 'supabase' && isAuthenticated.value)
  const canSwitchMembers = computed(() => !usesSupabaseSpace.value)
  const hasKnownCapabilities = computed(() => appCapabilitiesStatus.value === 'ready')
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

  function resetAppCapabilities(status: AppCapabilitiesStatus = 'idle', message = '') {
    appCapabilities.value = createDefaultAppCapabilities()
    appCapabilitiesStatus.value = status
    appCapabilitiesMessage.value = message
  }

  function hasCapability(key: AppCapabilityKey) {
    return appCapabilities.value[key]
  }

  function isCapabilityKnownMissing(key: AppCapabilityKey) {
    return hasKnownCapabilities.value && !hasCapability(key)
  }

  function getCapabilityHint(key: AppCapabilityKey) {
    return getCapabilityMissingMessage(key)
  }

  async function refreshAppCapabilities() {
    if (!supabase || !activeSession.value || !isAuthenticated.value) {
      resetAppCapabilities('idle')
      return false
    }

    appCapabilitiesStatus.value = 'loading'
    appCapabilitiesMessage.value = ''

    const result = await fetchAppCapabilities(supabase)

    if (result.ok) {
      appCapabilities.value = result.capabilities
      appCapabilitiesStatus.value = 'ready'
      appCapabilitiesMessage.value = ''
      return true
    }

    appCapabilities.value = createDefaultAppCapabilities()
    appCapabilitiesStatus.value = result.reason === 'unsupported' ? 'fallback' : 'error'
    appCapabilitiesMessage.value = result.message
    return false
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
      throw createSupabaseBootstrapError('space_members', error)
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
      displayName:
        normalizeDisplayName(member.display_name)
        || (member.user_id === session.user.id ? deriveDisplayName(session.user.email ?? '') : '成员'),
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

        throw createSupabaseBootstrapError('create_personal_space', error)
      }

      return data as SpaceRow
    }

    return null
  }

  async function ensureBoundSpacesForSession(session: Session) {
    if (!supabase) {
      return
    }

    const normalizedEmail = session.user.email?.trim().toLowerCase()

    if (!normalizedEmail) {
      return
    }

    if (isCapabilityKnownMissing('hasBoundSpaceMemberships')) {
      return
    }

    const { error } = await supabase.rpc('ensure_bound_space_memberships', {
      email_input: normalizedEmail,
    })

    if (!error) {
      return
    }

    if (!hasKnownCapabilities.value && isBoundSpaceMembershipFeatureMissing(error.message)) {
      return
    }

    throw createSupabaseBootstrapError('ensure_bound_space_memberships', error)
  }

  async function refreshSpaceContext(preferredSpaceId?: string, session: Session | null = activeSession.value) {
    if (!supabase || !session) {
      return false
    }

    isRefreshingSpace.value = true

    try {
      await refreshAppCapabilities()
      await ensureBoundSpacesForSession(session)

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

      const rememberedSpaceId = preferredSpaceId || lastSupabaseSpaceId.value || (dataMode.value === 'supabase' ? currentSpace.value.id : '')

      const targetMembership = memberships.find((membership) => membership.space_id === rememberedSpaceId)
        ?? memberships[memberships.length - 1]

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
      lastSupabaseSpaceId.value = targetSpace.id
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

    resetAppCapabilities('idle')

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

  async function bindEmailToCurrentSpace(email: string, displayName = ''): Promise<AuthActionResult> {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedDisplayName = normalizeDisplayName(displayName)

    if (!normalizedEmail) {
      return {
        ok: false,
        message: '请输入要固定到当前空间的邮箱。',
        mode: supabase ? 'supabase' : 'mock',
      }
    }

    if (!supabase || !activeSession.value || !isAuthenticated.value || !currentSpace.value.id) {
      return {
        ok: false,
        message: '请先登录到 Supabase 空间，再绑定固定邮箱。',
        mode: supabase ? 'supabase' : 'mock',
      }
    }

    if (isCapabilityKnownMissing('hasBoundSpaceMemberships')) {
      return {
        ok: false,
        message: getCapabilityHint('hasBoundSpaceMemberships'),
        mode: 'supabase',
      }
    }

    if (currentMember.value?.role !== 'owner') {
      return {
        ok: false,
        message: '只有当前空间的 owner 可以绑定固定邮箱。',
        mode: 'supabase',
      }
    }

    const { error } = await supabase.rpc('bind_email_to_space', {
      display_name_input: normalizedDisplayName || null,
      email_input: normalizedEmail,
      role_input: sessionEmail.value === normalizedEmail ? 'owner' : 'member',
      target_space_id: currentSpace.value.id,
    })

    if (error) {
      if (!hasKnownCapabilities.value && isBoundSpaceMembershipFeatureMissing(error.message)) {
        return {
          ok: false,
          message: getCapabilityHint('hasBoundSpaceMemberships'),
          mode: 'supabase',
        }
      }

      return {
        ok: false,
        message: `固定邮箱失败：${error.message}`,
        mode: 'supabase',
      }
    }

    return {
      ok: true,
      message: normalizedDisplayName
        ? `已把 ${normalizedEmail} 绑定到当前空间，默认身份会显示为 ${normalizedDisplayName}。`
        : `已把 ${normalizedEmail} 绑定到当前空间。后续这个邮箱登录时会优先进入这里。`,
      mode: 'supabase',
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
      [currentMemberId, currentSpaceId, dataMode, inviteCode, joinedSpaceAt, lastSupabaseSpaceId, lastMagicLinkSentAt, sessionEmail, sessionState, spaceName],
      () => {
        storage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            currentMemberId: currentMemberId.value,
            currentSpaceId: currentSpaceId.value,
            dataMode: dataMode.value,
            inviteCode: inviteCode.value,
            joinedSpaceAt: joinedSpaceAt.value,
            lastSupabaseSpaceId: lastSupabaseSpaceId.value,
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
    appCapabilities,
    appCapabilitiesMessage,
    appCapabilitiesStatus,
    dataMode,
    bindEmailToCurrentSpace,
    getCapabilityHint,
    hasCapability,
    hasKnownCapabilities,
    initializeAuthSession,
    inviteCode,
    isAuthenticated,
    isCapabilityKnownMissing,
    isRefreshingSpace,
    joinSpaceByInvite,
    joinedSpaceAt,
    lastMagicLinkSentAt,
    members,
    refreshAppCapabilities,
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
