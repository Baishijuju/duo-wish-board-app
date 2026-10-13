/**
 * 「本地是否刚刚写过云端」的判定。
 *
 * 为什么需要这个判定
 *   Supabase Realtime 推给本应用的 payload 里没有行数据（new/old 都是空对象），
 *   所以「按行 id 匹配回声」的墓碑逻辑永远命中不了。若不补偿，每次写入都会被
 *   当成他人改动，触发一次完整的全量重拉（实测 16 个请求 / 5-8 秒）。
 *   既然拿不到行 id，就退一步判断「刚才是不是自己在写」。
 *
 * 为什么时间戳必须打在「写入完成」时刻
 *   回声只会**在写入完成之后**才从服务端推回来。最初把时间戳打在写入**发起**
 *   时刻，实测一条耗时 4.9 秒的写入，其回声到达时已经超出 2 秒窗口，
 *   于是又被当成他人改动、触发全量重拉。
 *   网络越慢越容易发生 —— 而这恰恰是最需要跳过回声的场景。
 *   因此改为：在途期间一律跳过；完成后从**完成时刻**起算窗口。
 */

export interface LocalWriteClock {
  /** 最近一次写入**完成**的时刻 */
  lastAt: number
  /** 仍在途的写入数量 */
  pending: number
  /** 最早那条在途写入的发起时刻（兜底用） */
  pendingSince: number
}

/** 写入完成后的抑制窗口 */
export const LOCAL_WRITE_ECHO_WINDOW_MS = 2_000

/**
 * 在途写入的最长信任时间。
 *
 * 正常情况下写入无论成功或失败都会结束。万一是请求卡死（例如手机断网），
 * 不能让对方的改动被无限期压制 —— 超过这个时间就不再因「在途」而跳过。
 */
export const LOCAL_WRITE_PENDING_GRACE_MS = 30_000

export function createLocalWriteClock(): LocalWriteClock {
  return { lastAt: 0, pending: 0, pendingSince: 0 }
}

export function markLocalWriteStart(clock: LocalWriteClock, now = Date.now()) {
  if (clock.pending === 0) {
    clock.pendingSince = now
  }

  clock.pending += 1
}

export function markLocalWriteEnd(clock: LocalWriteClock, now = Date.now()) {
  clock.pending = Math.max(0, clock.pending - 1)
  clock.lastAt = now
}

export function hasRecentLocalWrite(
  clock: LocalWriteClock,
  now = Date.now(),
  windowMs = LOCAL_WRITE_ECHO_WINDOW_MS,
  pendingGraceMs = LOCAL_WRITE_PENDING_GRACE_MS,
) {
  if (clock.pending > 0 && now - clock.pendingSince < pendingGraceMs) {
    return true
  }

  // lastAt 为 0 表示从未完成过任何写入。
  // 不能只写 `now - lastAt < windowMs` —— 那样在 lastAt 为 0 且 now 较小时
  // 会误判为「刚写过」（单元测试抓到过这一点）。
  return clock.lastAt > 0 && now - clock.lastAt < windowMs
}
