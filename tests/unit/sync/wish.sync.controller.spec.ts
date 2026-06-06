import { describe, expect, it, vi } from 'vitest'
import {
  clearRealtimeSyncTimer,
  createRealtimeSyncControllerState,
  scheduleRealtimeSync,
  teardownRealtimeSubscription,
} from '../../../src/modules/sync/wish.sync.controller'

describe('wish.sync.controller', () => {
  it('does not schedule sync when cloud mode is inactive', () => {
    const state = createRealtimeSyncControllerState()
    const runSync = vi.fn()
    const onSyncMessage = vi.fn()

    scheduleRealtimeSync(state, {
      isUsingCloudSpace: false,
      currentSpaceId: 'space-1',
      reason: '愿望',
      onSyncMessage,
      runSync,
    })

    expect(onSyncMessage).not.toHaveBeenCalled()
    expect(runSync).not.toHaveBeenCalled()
  })

  it('schedules sync and sets status message', async () => {
    vi.useFakeTimers()

    const state = createRealtimeSyncControllerState()
    const runSync = vi.fn()
    const onSyncMessage = vi.fn()

    scheduleRealtimeSync(state, {
      isUsingCloudSpace: true,
      currentSpaceId: 'space-1',
      reason: '愿望',
      onSyncMessage,
      runSync,
    })

    expect(onSyncMessage).toHaveBeenCalledWith('愿望有更新，正在刷新云端数据...')

    await vi.advanceTimersByTimeAsync(180)

    expect(runSync).toHaveBeenCalledWith('space-1')
    vi.useRealTimers()
  })

  it('clears previous timer before scheduling next sync', async () => {
    vi.useFakeTimers()

    const state = createRealtimeSyncControllerState()
    const runSync = vi.fn()
    const onSyncMessage = vi.fn()

    scheduleRealtimeSync(state, {
      isUsingCloudSpace: true,
      currentSpaceId: 'space-1',
      reason: '愿望',
      onSyncMessage,
      runSync,
    })

    scheduleRealtimeSync(state, {
      isUsingCloudSpace: true,
      currentSpaceId: 'space-1',
      reason: '图片',
      onSyncMessage,
      runSync,
    })

    await vi.advanceTimersByTimeAsync(180)
    expect(runSync).toHaveBeenCalledTimes(1)
    expect(onSyncMessage).toHaveBeenLastCalledWith('图片有更新，正在刷新云端数据...')
    vi.useRealTimers()
  })

  it('tears down channel and resets state', async () => {
    const state = createRealtimeSyncControllerState()
    const removeChannel = vi.fn().mockResolvedValue(undefined)
    const onStatusChange = vi.fn()

    state.channel = { id: 'channel-1' } as never
    state.subscribedSpaceId = 'space-1'

    await teardownRealtimeSubscription(state, {
      supabase: { removeChannel } as never,
      onStatusChange,
    })

    expect(removeChannel).toHaveBeenCalled()
    expect(state.channel).toBeNull()
    expect(state.subscribedSpaceId).toBeNull()
    expect(onStatusChange).toHaveBeenCalledWith('idle')
  })

  it('clearRealtimeSyncTimer clears stored timer handle', () => {
    const state = createRealtimeSyncControllerState()
    state.timer = setTimeout(() => {}, 1000)

    clearRealtimeSyncTimer(state)

    expect(state.timer).toBeNull()
  })
})
