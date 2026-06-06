import { describe, expect, it, vi } from 'vitest'
import { addWishCloud, addWishLocal, deleteWishLocal, runCloudMutation, updateWishLocal } from '../../../src/modules/wishes/wish.write'

describe('wish.write', () => {
  it('adds a local wish with normalized initial steps', () => {
    const result = addWishLocal(
      {
        title: '旅行',
        category: '生活',
        priority: 'high',
        dueDate: '',
        note: '记一下',
        ownerId: 'member-a',
        scope: 'shared',
        progressMode: 'steps',
        progressCurrent: 0,
        progressTarget: 0,
        progressUnit: '',
      },
      ['先订票', '先排时间'],
    )

    expect(result.wish.steps).toHaveLength(2)
    expect(result.message).toContain('2 个初始步骤')
  })

  it('updates a local wish through touch callback', () => {
    const updated = updateWishLocal(
      {
        id: 'wish-1',
        title: '旧标题',
        category: '',
        priority: 'medium',
        dueDate: '',
        note: '',
        ownerId: 'member-a',
        scope: 'shared',
        status: 'active',
        starred: false,
        progressMode: 'none',
        progressCurrent: 0,
        progressTarget: 0,
        progressUnit: '',
        completedAt: null,
        steps: [],
        comments: [],
        images: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        title: '新标题',
        category: '',
        priority: 'medium',
        dueDate: '',
        note: '',
        ownerId: 'member-a',
        scope: 'shared',
        progressMode: 'none',
        progressCurrent: 0,
        progressTarget: 0,
        progressUnit: '',
      },
      (wish) => ({ ...wish, updatedAt: '2026-01-02T00:00:00.000Z' }),
    )

    expect(updated.title).toBe('新标题')
    expect(updated.updatedAt).toBe('2026-01-02T00:00:00.000Z')
  })

  it('deletes a local wish by id', () => {
    const remaining = deleteWishLocal('wish-1', [
      { id: 'wish-1' },
      { id: 'wish-2' },
    ] as never)

    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.id).toBe('wish-2')
  })

  it('runs cloud mutation and refreshes on success', async () => {
    const onLoadingChange = vi.fn()
    const onSyncMessage = vi.fn()
    const syncFromSupabase = vi.fn().mockResolvedValue(true)

    const result = await runCloudMutation({
      supabase: {} as never,
      isUsingCloudWishes: true,
      currentSpaceId: 'space-1',
      onLoadingChange,
      onSyncMessage,
      mutate: async () => ({ error: null }),
      successMessage: '同步成功',
      syncFromSupabase,
    })

    expect(result).toBe(true)
    expect(syncFromSupabase).toHaveBeenCalledWith('space-1')
    expect(onSyncMessage).toHaveBeenLastCalledWith('同步成功')
  })

  it('omits progress fields when progress capability is unavailable', async () => {
    const insert = vi.fn().mockReturnValue({
      select: () => ({
        single: vi.fn().mockResolvedValue({ data: { id: 'wish-1' }, error: null }),
      }),
    })

    const supabase = {
      from: vi.fn(() => ({ insert })),
    }

    await addWishCloud({
      supabase: supabase as never,
      currentSpaceId: 'space-1',
      ownerId: 'member-a',
      includeProgressFields: false,
      draft: {
        title: '旅行',
        category: '生活',
        priority: 'high',
        dueDate: '',
        note: '记一下',
        ownerId: 'member-a',
        scope: 'shared',
        progressMode: 'steps',
        progressCurrent: 2,
        progressTarget: 3,
        progressUnit: '次',
      },
      initialStepTitles: [],
      onLoadingChange: vi.fn(),
      onSyncMessage: vi.fn(),
      syncFromSupabase: vi.fn().mockResolvedValue(true),
    })

    expect(insert).toHaveBeenCalledWith(expect.not.objectContaining({
      progress_current: expect.anything(),
      progress_mode: expect.anything(),
      progress_target: expect.anything(),
      progress_unit: expect.anything(),
    }))
  })
})
