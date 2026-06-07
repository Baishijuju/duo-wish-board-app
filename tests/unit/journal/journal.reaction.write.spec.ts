import { describe, expect, it, vi } from 'vitest'
import { toggleThreadReactionWrite } from '../../../src/modules/journal/journal.reaction.write'

function createThread() {
  return {
    id: 'thread-wish-coin-1c3e1b1d-1d03-4d5a-a074-8795dab5ba84',
    wishId: 'wish-1',
    spaceId: 'space-1',
    actorId: 'member-1',
    eventKind: 'wish_coin_cast',
    messageText: '投下了 1 枚愿望币。',
    meta: {},
    sourceTable: 'wish_coins',
    sourceId: 'coin-1',
    dedupeKey: 'wish_coin_cast:coin-1',
    images: [],
    reactions: [],
    createdAt: '2026-06-07T00:00:00.000Z',
    updatedAt: '2026-06-07T00:00:00.000Z',
  }
}

describe('toggleThreadReactionWrite', () => {
  it('points system-thread uuid errors to the reaction migration', async () => {
    const onSyncMessage = vi.fn()
    const supabase = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({
              data: null,
              error: {
                message: 'invalid input syntax for type uuid: "thread-wish-coin-1c3e1b1d-1d03-4d5a-a074-8795dab5ba84"',
              },
            }),
          }),
        }),
      }),
    }

    const result = await toggleThreadReactionWrite({
      supabase: supabase as never,
      isUsingCloudWishes: true,
      currentSpaceId: 'space-1',
      thread: createThread() as never,
      threadId: 'thread-wish-coin-1c3e1b1d-1d03-4d5a-a074-8795dab5ba84',
      memberId: 'member-1',
      normalizedEmoji: '赞',
      existingReaction: undefined,
      existingMemberReactionCount: 0,
      maxPerMember: 3,
      allowsLegacyCapabilityFallback: true,
      isWishThreadFeatureMissing: () => false,
      onLoadingChange: vi.fn(),
      onSyncMessage,
      syncAfterWrite: false,
      syncFromSupabase: vi.fn(),
    })

    expect(result.ok).toBe(false)
    expect(result.message).toBe('表情回应失败：系统记录表情需要先执行新的 Supabase reaction migration。')
    expect(onSyncMessage).toHaveBeenCalledWith(result.message)
  })
})
