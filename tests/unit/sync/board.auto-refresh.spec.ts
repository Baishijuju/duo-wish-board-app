import { afterEach, describe, expect, it, vi } from 'vitest'
import { BOARD_REFRESH_INTERVAL_MS, createBoardAutoRefresh } from '../../../src/modules/sync/board.auto-refresh'

afterEach(() => { vi.useRealTimers() })

describe('board auto refresh', () => {
  it('refreshes every five minutes and cleans up its timer', async () => {
    vi.useFakeTimers()
    const refresh = vi.fn().mockResolvedValue(true)
    const controller = createBoardAutoRefresh({ canRefresh: () => true, isVisible: () => true, isOnline: () => true, refresh })
    controller.start()
    await vi.advanceTimersByTimeAsync(BOARD_REFRESH_INTERVAL_MS - 1)
    expect(refresh).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(refresh).toHaveBeenCalledTimes(1)
    controller.stop()
    await vi.advanceTimersByTimeAsync(BOARD_REFRESH_INTERVAL_MS)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('defers hidden, offline or editing requests until it is safe', async () => {
    let visible = false
    let online = false
    let canRefresh = false
    const refresh = vi.fn().mockResolvedValue(true)
    const controller = createBoardAutoRefresh({ canRefresh: () => canRefresh, isVisible: () => visible, isOnline: () => online, refresh })
    await controller.request()
    visible = true
    await controller.request()
    online = true
    await controller.request()
    expect(refresh).not.toHaveBeenCalled()
    canRefresh = true
    await controller.flush()
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('does not issue overlapping requests', async () => {
    let resolveRefresh!: (ok: boolean) => void
    const refresh = vi.fn(() => new Promise<boolean>((resolve) => { resolveRefresh = resolve }))
    const controller = createBoardAutoRefresh({ canRefresh: () => true, isVisible: () => true, isOnline: () => true, refresh })
    const first = controller.request()
    await controller.request()
    expect(refresh).toHaveBeenCalledTimes(1)
    resolveRefresh(true)
    await first
  })

  it('backs off after failures and handles network exceptions', async () => {
    vi.useFakeTimers()
    const refresh = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(false).mockResolvedValue(true)
    const controller = createBoardAutoRefresh({ canRefresh: () => true, isVisible: () => true, isOnline: () => true, refresh })
    await controller.request()
    await controller.request()
    expect(refresh).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(BOARD_REFRESH_INTERVAL_MS)
    await controller.request()
    await vi.advanceTimersByTimeAsync(BOARD_REFRESH_INTERVAL_MS)
    await controller.request()
    expect(refresh).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(BOARD_REFRESH_INTERVAL_MS)
    await controller.request()
    expect(refresh).toHaveBeenCalledTimes(3)
  })

  it('catches up if editing starts and finishes while a request is running', async () => {
    let allowed = true
    let resolveRefresh!: (ok: boolean) => void
    const refresh = vi.fn().mockImplementationOnce(() => new Promise<boolean>((resolve) => { resolveRefresh = resolve })).mockResolvedValue(true)
    const controller = createBoardAutoRefresh({ canRefresh: () => allowed, isVisible: () => true, isOnline: () => true, refresh })
    const first = controller.request()
    allowed = false
    await controller.request()
    allowed = true
    await controller.flush()
    expect(refresh).toHaveBeenCalledTimes(1)
    resolveRefresh(true)
    await first
    expect(refresh).toHaveBeenCalledTimes(2)
    controller.stop()
  })
})