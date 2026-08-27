export type CloudflareEnvShape = Partial<Record<string, string | undefined>>

export interface CloudflareWishListResponse {
  ok: boolean
  data?: unknown[]
  message?: string
}

export interface CloudflareProgressWriteRequest {
  wishId: string
  nextCurrent: number
  memberId: string
  spaceId?: string
}

export function shouldUseCloudflareBackend(env: CloudflareEnvShape = import.meta.env) {
  const base = (env.VITE_CLOUDFLARE_API_BASE ?? '').trim()
  return base.length > 0
}

export function normalizeCloudflareWishRows(rows: unknown[]) {
  return rows as any[]
}

export function buildCloudflareProgressPayload(input: CloudflareProgressWriteRequest) {
  return {
    wishId: input.wishId,
    nextCurrent: input.nextCurrent,
    memberId: input.memberId,
    spaceId: input.spaceId,
  }
}

export async function fetchCloudflareWishList(spaceId: string, env: CloudflareEnvShape = import.meta.env) {
  const base = (env.VITE_CLOUDFLARE_API_BASE ?? '').trim()

  if (!base) {
    return { ok: false, message: 'Cloudflare API 未配置。' }
  }

  const response = await fetch(`${base.replace(/\/$/, '')}/api/wishes?spaceId=${encodeURIComponent(spaceId)}`)

  if (!response.ok) {
    return { ok: false, message: '云端清单读取失败。' }
  }

  const payload = (await response.json()) as CloudflareWishListResponse
  if (!payload.ok) {
    return { ok: false, message: payload.message ?? '云端清单读取失败。' }
  }

  return {
    ok: true,
    data: normalizeCloudflareWishRows(Array.isArray(payload.data) ? payload.data : []),
  }
}

export async function writeCloudflareWishProgress(input: CloudflareProgressWriteRequest, env: CloudflareEnvShape = import.meta.env) {
  const base = (env.VITE_CLOUDFLARE_API_BASE ?? '').trim()

  if (!base) {
    return { ok: false, message: 'Cloudflare API 未配置。' }
  }

  const response = await fetch(`${base.replace(/\/$/, '')}/api/wishes/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildCloudflareProgressPayload(input)),
  })

  if (!response.ok) {
    return { ok: false, message: '推进写入失败。' }
  }

  const payload = await response.json().catch(() => ({ ok: true })) as { ok?: boolean; message?: string }
  if (payload.ok === false) {
    return { ok: false, message: payload.message ?? '推进写入失败。' }
  }

  return { ok: true, message: payload.message ?? '推进已写入 Cloudflare。' }
}
