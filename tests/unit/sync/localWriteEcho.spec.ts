import { describe, expect, it } from 'vitest'
import {
  LOCAL_WRITE_ECHO_WINDOW_MS,
  LOCAL_WRITE_PENDING_GRACE_MS,
  createLocalWriteClock,
  hasRecentLocalWrite,
  markLocalWriteEnd,
  markLocalWriteStart,
} from '../../../src/modules/sync/localWriteEcho'

describe('localWriteEcho', () => {
  it('从未写过时不跳过', () => {
    const clock = createLocalWriteClock()

    expect(hasRecentLocalWrite(clock, 1_000)).toBe(false)
  })

  it('写入刚完成时跳过（这是自己的回声）', () => {
    const clock = createLocalWriteClock()
    markLocalWriteStart(clock, 1_000)
    markLocalWriteEnd(clock, 1_100)

    expect(hasRecentLocalWrite(clock, 1_200)).toBe(true)
    expect(hasRecentLocalWrite(clock, 1_100 + LOCAL_WRITE_ECHO_WINDOW_MS - 1)).toBe(true)
  })

  it('超出窗口后不再跳过（可能是对方的改动）', () => {
    const clock = createLocalWriteClock()
    markLocalWriteStart(clock, 1_000)
    markLocalWriteEnd(clock, 1_100)

    expect(hasRecentLocalWrite(clock, 1_100 + LOCAL_WRITE_ECHO_WINDOW_MS + 1)).toBe(false)
  })

  it('慢写入：耗时 4.9 秒，回声到达时仍必须跳过', () => {
    // 这正是生产环境实测到的回归。
    // 时间戳曾打在「发起」时刻（1000），而这条写入到 5900 才完成、
    // 回声 5950 到达，早已超出 2 秒窗口 —— 于是被当成他人改动，
    // 触发了一次 16 个请求的全量重拉。日志：
    //   4915ms 201 POST /rest/v1/wish_comments
    //    443ms 200 POST /rest/v1/rpc/get_reward_claim_sync_payload
    const clock = createLocalWriteClock()
    markLocalWriteStart(clock, 1_000)
    markLocalWriteEnd(clock, 5_900)

    expect(hasRecentLocalWrite(clock, 5_950)).toBe(true)
    expect(hasRecentLocalWrite(clock, 5_900 + LOCAL_WRITE_ECHO_WINDOW_MS + 1)).toBe(false)
  })

  it('写入在途期间跳过', () => {
    const clock = createLocalWriteClock()
    markLocalWriteStart(clock, 1_000)

    expect(hasRecentLocalWrite(clock, 1_500)).toBe(true)
    expect(clock.pending).toBe(1)
  })

  it('多个写入在途时，逐个结束', () => {
    const clock = createLocalWriteClock()
    markLocalWriteStart(clock, 1_000)
    markLocalWriteStart(clock, 1_100)

    markLocalWriteEnd(clock, 1_200)
    expect(clock.pending).toBe(1)
    expect(hasRecentLocalWrite(clock, 1_300)).toBe(true)

    markLocalWriteEnd(clock, 1_400)
    expect(clock.pending).toBe(0)
  })

  it('写入卡死超过信任时间后，不再无限期压制对方的改动', () => {
    const clock = createLocalWriteClock()
    markLocalWriteStart(clock, 1_000)

    expect(hasRecentLocalWrite(clock, 1_000 + LOCAL_WRITE_PENDING_GRACE_MS - 1)).toBe(true)
    expect(hasRecentLocalWrite(clock, 1_000 + LOCAL_WRITE_PENDING_GRACE_MS + 1)).toBe(false)
  })

  it('多余的结束调用不会让计数变成负数', () => {
    const clock = createLocalWriteClock()
    markLocalWriteEnd(clock, 1_000)

    expect(clock.pending).toBe(0)
  })
})
