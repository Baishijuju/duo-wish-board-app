export const BOARD_REFRESH_INTERVAL_MS = 5 * 60 * 1000

export function createBoardAutoRefresh(options: {
  canRefresh: () => boolean
  isVisible: () => boolean
  isOnline: () => boolean
  refresh: () => Promise<boolean>
}) {
  let timer: ReturnType<typeof setInterval> | undefined
  let isRunning = false
  let isStopped = false
  let pending = false
  let failures = 0
  let retryAfter = 0

  async function request() {
    if (isStopped) return false
    if (!options.isVisible() || !options.isOnline() || !options.canRefresh()) {
      pending = true
      return false
    }
    if (isRunning) return false
    if (Date.now() < retryAfter) return false

    isRunning = true
    pending = false
    try {
      const ok = await options.refresh()
      if (ok) {
        failures = 0
        retryAfter = 0
      } else {
        failures += 1
        retryAfter = Date.now() + Math.min(BOARD_REFRESH_INTERVAL_MS * 2 ** (failures - 1), 30 * 60 * 1000)
      }
      return ok
    } catch {
      failures += 1
      retryAfter = Date.now() + Math.min(BOARD_REFRESH_INTERVAL_MS * 2 ** (failures - 1), 30 * 60 * 1000)
      return false
    } finally {
      isRunning = false
      if (pending && !isStopped && options.isVisible() && options.isOnline() && options.canRefresh() && Date.now() >= retryAfter) {
        void request()
      }
    }
  }

  return {
    request,
    flush: () => pending ? request() : Promise.resolve(false),
    start() {
      if (timer) return
      isStopped = false
      timer = setInterval(() => { void request() }, BOARD_REFRESH_INTERVAL_MS)
    },
    stop() {
      isStopped = true
      pending = false
      if (timer) clearInterval(timer)
      timer = undefined
    },
  }
}