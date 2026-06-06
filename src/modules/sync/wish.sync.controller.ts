import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

export interface RealtimeSyncControllerState {
  channel: RealtimeChannel | null
  subscribedSpaceId: string | null
  timer: ReturnType<typeof setTimeout> | null
}

export function createRealtimeSyncControllerState(): RealtimeSyncControllerState {
  return {
    channel: null,
    subscribedSpaceId: null,
    timer: null,
  }
}

export function clearRealtimeSyncTimer(state: RealtimeSyncControllerState) {
  if (!state.timer) {
    return
  }

  clearTimeout(state.timer)
  state.timer = null
}

export function scheduleRealtimeSync(
  state: RealtimeSyncControllerState,
  options: {
    isUsingCloudSpace: boolean
    currentSpaceId: string | null | undefined
    reason: string
    onSyncMessage: (message: string) => void
    runSync: (spaceId: string) => unknown | Promise<unknown>
  },
) {
  if (!options.currentSpaceId || !options.isUsingCloudSpace) {
    return
  }

  clearRealtimeSyncTimer(state)
  options.onSyncMessage(`${options.reason}有更新，正在刷新云端数据...`)

  const targetSpaceId = options.currentSpaceId

  state.timer = setTimeout(() => {
    void options.runSync(targetSpaceId)
  }, 180)
}

export async function teardownRealtimeSubscription(
  state: RealtimeSyncControllerState,
  options: {
    supabase: SupabaseClient | null
    onStatusChange: (status: 'idle') => void
  },
) {
  clearRealtimeSyncTimer(state)

  if (options.supabase && state.channel) {
    await options.supabase.removeChannel(state.channel)
  }

  state.channel = null
  state.subscribedSpaceId = null
  options.onStatusChange('idle')
}
