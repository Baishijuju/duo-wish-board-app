import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { shouldUseAppCapability, type AppCapabilityAccess, type AppCapabilityKey } from './capabilities'

export interface RealtimeSyncControllerState {
  channel: RealtimeChannel | null
  subscribedSpaceId: string | null
  timer: ReturnType<typeof setTimeout> | null
}

export interface RealtimeTableBinding {
  table: string
  filter?: string
  capabilityKey?: AppCapabilityKey
  onEvent: (payload?: { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) => void
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

export function buildRealtimeSubscription(
  state: RealtimeSyncControllerState,
  options: {
    supabase: SupabaseClient
    spaceId: string
    capabilityAccess: AppCapabilityAccess
    bindings: RealtimeTableBinding[]
    onStatusChange: (status: 'idle' | 'connecting' | 'subscribed' | 'error') => void
  },
) {
  state.subscribedSpaceId = options.spaceId
  options.onStatusChange('connecting')

  let channel = options.supabase.channel(`wish-space-${options.spaceId}`)

  for (const binding of options.bindings) {
    if (binding.capabilityKey && !shouldUseAppCapability(options.capabilityAccess, binding.capabilityKey)) {
      continue
    }

    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: binding.table,
        ...(binding.filter ? { filter: binding.filter } : {}),
      },
      (payload) => {
        binding.onEvent(payload as { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null })
      },
    )
  }

  state.channel = channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      options.onStatusChange('subscribed')
      return
    }

    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      options.onStatusChange('error')
      return
    }

    if (status === 'CLOSED') {
      options.onStatusChange('idle')
    }
  })
}
