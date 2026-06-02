import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(__dirname, '..')
const envFilePath = resolve(appRoot, '.env.production')

function readEnvFile(filePath) {
  return Object.fromEntries(
    readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separatorIndex = line.indexOf('=')
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)]
      }),
  )
}

function getSupabaseConfig() {
  const env = readEnvFile(envFilePath)
  const url = env.VITE_SUPABASE_URL?.trim()
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!url || !publishableKey) {
    throw new Error('缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_PUBLISHABLE_KEY，无法执行云端回归。')
  }

  return {
    url,
    publishableKey,
  }
}

function createAppClient() {
  const { url, publishableKey } = getSupabaseConfig()

  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function createAuthenticatedClient(accessToken) {
  const { url, publishableKey } = getSupabaseConfig()

  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

function formatSupabaseError(error) {
  if (!error) {
    return '未知错误'
  }

  const ownEntries = Object.getOwnPropertyNames(error)
    .map((key) => {
      try {
        return `${key}=${String(error[key])}`
      } catch {
        return `${key}=<unreadable>`
      }
    })

  return [error.name, error.message, error.details, error.hint, error.code, `status=${error.status ?? ''}`, ownEntries.join(','), JSON.stringify(error)].filter(Boolean).join(' | ')
}

function deriveDisplayName(email) {
  return email.split('@')[0]?.trim().slice(0, 50) || '成员'
}

function generateInviteCode() {
  return `AI${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function decodeJwtPayload(accessToken) {
  try {
    const [, payload = ''] = accessToken.split('.')

    if (!payload) {
      return { error: 'missing-payload' }
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=')
    const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf8')
    const parsedPayload = JSON.parse(decodedPayload)

    return {
      aal: parsedPayload.aal ?? null,
      email: parsedPayload.email ?? null,
      exp: parsedPayload.exp ?? null,
      role: parsedPayload.role ?? null,
      session_id: parsedPayload.session_id ?? null,
      sub: parsedPayload.sub ?? null,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function sendOtp(emails) {
  const client = createAppClient()

  for (const email of emails) {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      continue
    }

    const { error } = await client.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      console.log(`${normalizedEmail}: ERROR ${error.message}`)
      continue
    }

    console.log(`${normalizedEmail}: OTP_SENT`)
  }
}

async function authenticateClient(email, otp) {
  const client = createAppClient()
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedOtp = otp.trim()
  const triedErrors = []
  let verifiedData = null

  for (const otpType of ['email', 'signup']) {
    const { data, error } = await client.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedOtp,
      type: otpType,
    })

    if (error) {
      triedErrors.push(`${otpType}: ${formatSupabaseError(error)}`)
      continue
    }

    verifiedData = data
    break
  }

  if (!verifiedData) {
    throw new Error(`${normalizedEmail} 验证失败：${triedErrors.join(' || ')}`)
  }

  if (!verifiedData.session?.access_token || !verifiedData.session.refresh_token || !verifiedData.user?.id) {
    throw new Error(`${normalizedEmail} 未拿到完整会话。`)
  }

  const { error: sessionError } = await client.auth.setSession({
    access_token: verifiedData.session.access_token,
    refresh_token: verifiedData.session.refresh_token,
  })

  if (sessionError) {
    throw new Error(`${normalizedEmail} 会话注入失败：${formatSupabaseError(sessionError)}`)
  }

  return {
    accessToken: verifiedData.session.access_token,
    client: createAuthenticatedClient(verifiedData.session.access_token),
    email: normalizedEmail,
    userId: verifiedData.user.id,
  }
}

async function ensureBoundSpaces(client, email) {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    return null
  }

  const { error } = await client.rpc('ensure_bound_space_memberships', {
    email_input: normalizedEmail,
  })

  if (!error) {
    return null
  }

  if (error.code === '42883' || /ensure_bound_space_memberships/i.test(error.message)) {
    return null
  }

  return `同步绑定空间成员失败：${formatSupabaseError(error)}`
}

async function fetchMembershipsRaw(accessToken, userId) {
  const { url, publishableKey } = getSupabaseConfig()
  const requestUrl = new URL(`${url}/rest/v1/space_members`)
  requestUrl.searchParams.set('select', 'space_id,user_id,display_name,role,joined_at')
  requestUrl.searchParams.set('user_id', `eq.${userId}`)
  requestUrl.searchParams.set('order', 'joined_at.asc')

  const response = await fetch(requestUrl, {
    headers: {
      Accept: 'application/json',
      apikey: publishableKey,
      authorization: `Bearer ${accessToken}`,
    },
  })

  return {
    bodyText: await response.text(),
    contentRange: response.headers.get('content-range'),
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
  }
}

async function fetchOwnedSpacesRaw(accessToken, userId) {
  const { url, publishableKey } = getSupabaseConfig()
  const requestUrl = new URL(`${url}/rest/v1/spaces`)
  requestUrl.searchParams.set('select', 'id,name,invite_code,created_by,created_at')
  requestUrl.searchParams.set('created_by', `eq.${userId}`)
  requestUrl.searchParams.set('order', 'created_at.asc')

  const response = await fetch(requestUrl, {
    headers: {
      Accept: 'application/json',
      apikey: publishableKey,
      authorization: `Bearer ${accessToken}`,
    },
  })

  return {
    bodyText: await response.text(),
    contentRange: response.headers.get('content-range'),
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
  }
}

async function fetchRpcRaw(accessToken, functionName, payload) {
  const { url, publishableKey } = getSupabaseConfig()
  const requestUrl = `${url}/rest/v1/rpc/${functionName}`
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      apikey: publishableKey,
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  return {
    bodyText: await response.text(),
    contentRange: response.headers.get('content-range'),
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
  }
}

async function listMemberships(client, userId, accessToken) {
  const { data, error } = await client
    .from('space_members')
    .select('space_id, user_id, display_name, role, joined_at')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })

  if (!error) {
    return {
      memberships: data ?? [],
      warning: null,
    }
  }

  const rawResponse = await fetchMembershipsRaw(accessToken, userId)

  if (rawResponse.status === 416 && !rawResponse.bodyText.trim()) {
    return {
      memberships: [],
      warning: 'space_members 查询返回 416 且无响应体，按当前账号没有可见成员记录处理。',
    }
  }

  throw new Error(`读取可访问空间失败：${formatSupabaseError(error)} | rawStatus=${rawResponse.status} | rawBody=${rawResponse.bodyText}`)
}

async function createOrGetPersonalSpace(owner) {
  let createdSpace = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const payload = {
      display_name_input: deriveDisplayName(owner.email),
      invite_code_input: generateInviteCode(),
      space_name_input: `AI 回归共享空间 ${new Date().toISOString().slice(0, 10)}`,
    }
    const { data, error } = await owner.client.rpc('create_personal_space', {
      ...payload,
    })

    if (!error && data) {
      createdSpace = data
      break
    }

    if (error?.code !== '23505') {
      const rawResponse = await fetchRpcRaw(owner.accessToken, 'create_personal_space', payload)
      throw new Error(`创建临时共享空间失败：${formatSupabaseError(error)} | rawStatus=${rawResponse.status} | rawBody=${rawResponse.bodyText}`)
    }
  }

  if (!createdSpace?.id || !createdSpace?.invite_code) {
    throw new Error('创建临时共享空间失败：create_personal_space 没有返回可用的空间或邀请码。')
  }

  return createdSpace
}

async function provisionSharedSpace(owner, viewer) {
  const createdSpace = await createOrGetPersonalSpace(owner)

  const { data: joinedMember, error: joinError } = await viewer.client.rpc('join_space_by_invite', {
    display_name_input: deriveDisplayName(viewer.email),
    invite_code_input: createdSpace.invite_code,
  })

  if (joinError) {
    throw new Error(`第二位成员加入临时共享空间失败：${formatSupabaseError(joinError)}`)
  }

  return {
    inviteCode: createdSpace.invite_code,
    joinedSpaceId: joinedMember?.space_id ?? createdSpace.id,
  }
}

async function probeOwner(ownerEmail, ownerOtp) {
  const owner = await authenticateClient(ownerEmail, ownerOtp)
  const ownerBindingWarning = await ensureBoundSpaces(owner.client, owner.email)

  let ownerMembershipResult = await listMemberships(owner.client, owner.userId, owner.accessToken)
  const ensureBoundSpacesRaw = await fetchRpcRaw(owner.accessToken, 'ensure_bound_space_memberships', {
    email_input: owner.email,
  })
  const ownerMembershipsRaw = await fetchMembershipsRaw(owner.accessToken, owner.userId)
  const ownerSpacesRaw = await fetchOwnedSpacesRaw(owner.accessToken, owner.userId)
  let personalSpace = null
  let personalSpaceError = null

  try {
    personalSpace = await createOrGetPersonalSpace(owner)
    ownerMembershipResult = await listMemberships(owner.client, owner.userId, owner.accessToken)
  } catch (error) {
    personalSpaceError = error instanceof Error ? error.message : String(error)
  }

  const result = {
    ensureBoundSpacesRawBody: ensureBoundSpacesRaw.bodyText,
    ensureBoundSpacesRawContentRange: ensureBoundSpacesRaw.contentRange,
    ensureBoundSpacesRawStatus: ensureBoundSpacesRaw.status,
    ensureBoundSpacesRawStatusText: ensureBoundSpacesRaw.statusText,
    ownerAccessTokenClaims: decodeJwtPayload(owner.accessToken),
    ownerBindingWarning,
    ownerEmail: owner.email,
    ownerMembershipCount: ownerMembershipResult.memberships.length,
    ownerMembershipsRawBody: ownerMembershipsRaw.bodyText,
    ownerMembershipsRawContentRange: ownerMembershipsRaw.contentRange,
    ownerMembershipsRawStatus: ownerMembershipsRaw.status,
    ownerMembershipsRawStatusText: ownerMembershipsRaw.statusText,
    ownerMembershipWarning: ownerMembershipResult.warning,
    ownerSpacesRawBody: ownerSpacesRaw.bodyText,
    ownerSpacesRawContentRange: ownerSpacesRaw.contentRange,
    ownerSpacesRawStatus: ownerSpacesRaw.status,
    ownerSpacesRawStatusText: ownerSpacesRaw.statusText,
    ownerUserId: owner.userId,
    personalSpaceError,
    personalSpaceId: personalSpace?.id ?? null,
    personalSpaceInviteCode: personalSpace?.invite_code ?? null,
    personalSpaceOk: Boolean(personalSpace),
  }

  console.log(JSON.stringify(result, null, 2))
}

async function runRegression(ownerEmail, ownerOtp, viewerEmail, viewerOtp) {
  const owner = await authenticateClient(ownerEmail, ownerOtp)
  const viewer = await authenticateClient(viewerEmail, viewerOtp)

  const ownerBindingWarning = await ensureBoundSpaces(owner.client, owner.email)
  const viewerBindingWarning = await ensureBoundSpaces(viewer.client, viewer.email)

  let ownerMembershipResult = await listMemberships(owner.client, owner.userId, owner.accessToken)
  let viewerMembershipResult = await listMemberships(viewer.client, viewer.userId, viewer.accessToken)
  let ownerMemberships = ownerMembershipResult.memberships
  let viewerMemberships = viewerMembershipResult.memberships
  let ownerSpaceIds = ownerMemberships.map((membership) => membership.space_id)
  let viewerSpaceIds = viewerMemberships.map((membership) => membership.space_id)
  let sharedSpaceId = ownerSpaceIds.find((spaceId) => viewerSpaceIds.includes(spaceId))
  let provisionedSpace = null

  if (!sharedSpaceId) {
    provisionedSpace = await provisionSharedSpace(owner, viewer)
    ownerMembershipResult = await listMemberships(owner.client, owner.userId, owner.accessToken)
    viewerMembershipResult = await listMemberships(viewer.client, viewer.userId, viewer.accessToken)
    ownerMemberships = ownerMembershipResult.memberships
    viewerMemberships = viewerMembershipResult.memberships
    ownerSpaceIds = ownerMemberships.map((membership) => membership.space_id)
    viewerSpaceIds = viewerMemberships.map((membership) => membership.space_id)
    sharedSpaceId = ownerSpaceIds.find((spaceId) => viewerSpaceIds.includes(spaceId)) || provisionedSpace.joinedSpaceId
  }

  if (!sharedSpaceId) {
    throw new Error(`两位成员当前没有共享空间，且临时共享空间自举后仍不可见。ownerMembershipCount=${ownerMemberships.length} viewerMembershipCount=${viewerMemberships.length} ownerMembershipWarning=${ownerMembershipResult.warning ?? 'none'} viewerMembershipWarning=${viewerMembershipResult.warning ?? 'none'}`)
  }

  const title = `AI private regression ${Date.now()}`
  const note = '用于验证 private 愿望是否只对 owner 可见，完成后会自动清理。'

  const { data: insertedWish, error: insertError } = await owner.client
    .from('wishes')
    .insert({
      space_id: sharedSpaceId,
      owner_id: owner.userId,
      title,
      category: 'AI 回归',
      note,
      priority: 'medium',
      scope: 'private',
      status: 'active',
    })
    .select('id, title, scope, owner_id, space_id')
    .single()

  if (insertError || !insertedWish) {
    throw new Error(`owner 创建 private 愿望失败：${formatSupabaseError(insertError)}`)
  }

  const { data: ownerVisibleRows, error: ownerVisibleError } = await owner.client
    .from('wishes')
    .select('id')
    .eq('id', insertedWish.id)

  const { data: viewerVisibleRows, error: viewerVisibleError } = await viewer.client
    .from('wishes')
    .select('id')
    .eq('id', insertedWish.id)

  const cleanup = await owner.client.from('wishes').delete().eq('id', insertedWish.id)
  const membershipCleanup = provisionedSpace
    ? await owner.client
        .from('space_members')
        .delete()
        .eq('space_id', provisionedSpace.joinedSpaceId)
        .eq('user_id', viewer.userId)
    : { error: null }

  const result = {
    cleanupError: cleanup.error?.message ?? null,
    cleanupOk: !cleanup.error,
    insertedWishId: insertedWish.id,
    membershipCleanupError: membershipCleanup.error?.message ?? null,
    membershipCleanupOk: !membershipCleanup.error,
    ownerBindingWarning,
    ownerCanSee: Boolean(ownerVisibleRows?.length),
    ownerEmail: owner.email,
    ownerMembershipCount: ownerMemberships.length,
    ownerMembershipWarning: ownerMembershipResult.warning,
    provisionedInviteCode: provisionedSpace?.inviteCode ?? null,
    provisionedSpaceId: provisionedSpace?.joinedSpaceId ?? null,
    ownerVisibleError: ownerVisibleError?.message ?? null,
    sharedSpaceId,
    viewerBindingWarning,
    viewerCanSee: Boolean(viewerVisibleRows?.length),
    viewerEmail: viewer.email,
    viewerMembershipCount: viewerMemberships.length,
    viewerMembershipWarning: viewerMembershipResult.warning,
    viewerVisibleError: viewerVisibleError?.message ?? null,
  }

  console.log(JSON.stringify(result, null, 2))
}

const [command, ...args] = process.argv.slice(2)

if (command === 'send-otp') {
  if (!args.length) {
    throw new Error('请提供至少一个邮箱，例如：node scripts/private-visibility-regression.mjs send-otp a@example.com b@example.com')
  }

  await sendOtp(args)
} else if (command === 'probe-owner') {
  if (args.length !== 2) {
    throw new Error('请提供 ownerEmail ownerOtp 两个参数。')
  }

  await probeOwner(args[0], args[1])
} else if (command === 'run') {
  if (args.length !== 4) {
    throw new Error('请提供 ownerEmail ownerOtp viewerEmail viewerOtp 四个参数。')
  }

  await runRegression(args[0], args[1], args[2], args[3])
} else {
  throw new Error('支持的命令只有：send-otp / probe-owner / run')
}