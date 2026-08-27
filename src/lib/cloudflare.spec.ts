import { describe, expect, it } from 'vitest'
import { buildCloudflareProgressPayload, normalizeCloudflareWishRows, shouldUseCloudflareBackend } from './cloudflare'

describe('cloudflare adapter', () => {
  it('should enable backend mode when Cloudflare API base is configured', () => {
    expect(shouldUseCloudflareBackend({ VITE_CLOUDFLARE_API_BASE: 'https://demo.example.workers.dev' })).toBe(true)
    expect(shouldUseCloudflareBackend({ VITE_CLOUDFLARE_API_BASE: '' })).toBe(false)
  })

  it('normalizes list payload to wish records expected by the app', () => {
    const rows = [
      {
        id: 'wish-1',
        title: '学会游泳',
        category: '健康',
        note: '每周练两次',
        ownerId: 'member-a',
        scope: 'shared',
        status: 'active',
        starred: false,
        progressMode: 'count',
        progressCurrent: 2,
        progressTarget: 8,
        progressUnit: '次',
        progressStarCoinValue: 1,
        completionStarCoinBonus: 2,
        completedAt: null,
        steps: [
          { id: 'step-1', title: '报名', starCoinValue: 1, isDone: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
        ],
        comments: [],
        images: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-10T00:00:00.000Z',
      },
    ]

    expect(normalizeCloudflareWishRows(rows)).toEqual(rows)
  })

  it('builds a progress payload with the next current value', () => {
    expect(buildCloudflareProgressPayload({ wishId: 'wish-1', nextCurrent: 6, memberId: 'member-a' })).toEqual({
      wishId: 'wish-1',
      nextCurrent: 6,
      memberId: 'member-a',
    })
  })
})
