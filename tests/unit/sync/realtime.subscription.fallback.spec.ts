import { describe, expect, it } from 'vitest'
import { buildRealtimeSubscription, createRealtimeSyncControllerState } from '../../../src/modules/sync/wish.sync.controller'

type SubscribeStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'

function createSupabaseStub(statusesPerChannel: SubscribeStatus[][]) {
  const channels: Array<{ suffix: string; usedFilter: boolean }> = []
  let channelIndex = -1

  return {
    channels,
    removeChannel: async () => {},
    channel: (name: string) => {
      channelIndex += 1
      const handlers: Array<{ config: Record<string, unknown> }> = []
      const suffix = name.includes('-nofilter') ? 'nofilter' : 'filter'

      const api = {
        on: (_event: string, config: Record<string, unknown>, _cb: unknown) => {
          handlers.push({ config })
          return api
        },
        subscribe: (cb: (status: SubscribeStatus) => void) => {
          const usedFilter = handlers.some((handler) => Object.prototype.hasOwnProperty.call(handler.config, 'filter'))
          channels.push({ suffix, usedFilter })
          for (const status of statusesPerChannel[channelIndex] ?? []) {
            cb(status)
          }
          return api
        },
      }

      return api
    },
  }
}

describe('realtime subscription fallback', () => {
  it('retries once without filter when filtered channel errors', () => {
    const statuses: Array<'idle' | 'connecting' | 'subscribed' | 'error'> = []
    const supabase = createSupabaseStub([
      ['CHANNEL_ERROR'],
      ['SUBSCRIBED'],
    ])
    const state = createRealtimeSyncControllerState()

    buildRealtimeSubscription(state, {
      supabase: supabase as never,
      spaceId: 'space-1',
      capabilityAccess: { hasKnownCapabilities: false, capabilities: null },
      bindings: [
        {
          table: 'wishes',
          filter: 'space_id=eq.space-1',
          onEvent: () => {},
        },
      ],
      onStatusChange: (status) => statuses.push(status),
    })

    expect(statuses).toEqual(['connecting', 'connecting', 'subscribed'])
    expect(supabase.channels).toEqual([
      { suffix: 'filter', usedFilter: true },
      { suffix: 'nofilter', usedFilter: false },
    ])
  })
})
