export type WishStatusKey = 'active' | 'done'
export type WishStatusFilterKey = WishStatusKey | 'all'
export type RewardKeywordStatusFilterKey = 'all' | 'claimable' | 'depositable'
export type SyncRealtimeStatus = 'connecting' | 'error' | string
export type ThreadEventKind =
  | 'comment'
  | 'wish_published'
  | 'wish_step_completed'
  | 'wish_completed'
  | 'premium_redeem'
  | 'weekly_welfare_issued'
  | string

type WishStatusSemantic = {
  ariaLabel: string
  compactLabel: string
  label: string
  tone: 'active' | 'done'
}

export const WISH_STATUS_SEMANTICS: Record<WishStatusKey, WishStatusSemantic> = {
  active: {
    ariaLabel: '状态：在路上',
    compactLabel: '在途',
    label: '进行中',
    tone: 'active',
  },
  done: {
    ariaLabel: '状态：已点亮',
    compactLabel: '已亮',
    label: '已完成',
    tone: 'done',
  },
}

export const WISH_STATUS_FILTER_LABELS: Record<WishStatusFilterKey, string> = {
  active: '正在推进',
  all: '全部状态',
  done: '已经实现',
}

export const REWARD_KEYWORD_STATUS_FILTER_LABELS: Record<RewardKeywordStatusFilterKey, string> = {
  all: '全部状态',
  claimable: '可领取',
  depositable: '我能存',
}

export const ENTRY_STATUS_LABELS = {
  entered: '已进入',
  notEntered: '未进入',
} as const

export const SYNC_STATUS_LABELS = {
  error: '同步异常',
  healthy: '同步正常',
  notSynced: '暂未同步',
  syncing: '同步中',
} as const

export const REWARD_CLAIM_LABELS = {
  claimDefault: '领取奖励',
  claimShared: '领取共同奖励',
  pending: '待领取',
} as const

export const REWARD_CLAIM_EDGE_COPY = {
  noCountPending: '当前没有可领取的数字进度奖励。',
  noPendingSmallReward: '当前没有可领取的小奖励。',
  noPendingUnits: '这条数字进度暂时没有待领取的小奖励。',
} as const

export const WISH_BOTTLE_STATUS_LABELS = {
  active: '在路上',
  done: '已点亮',
} as const

export const THREAD_EVENT_KIND_LABELS = {
  comment: '留言',
  premium_redeem: '兑换奖励',
  weekly_welfare_issued: '系统记录',
  wish_completed: '愿望完成',
  wish_published: '写下愿望',
  wish_step_completed: '步骤完成',
} as const

export function getWishStatusSemantic(status: WishStatusKey) {
  return WISH_STATUS_SEMANTICS[status]
}

export function getThreadEventKindLabel(eventKind: ThreadEventKind) {
  return THREAD_EVENT_KIND_LABELS[eventKind as keyof typeof THREAD_EVENT_KIND_LABELS] ?? REWARD_CLAIM_LABELS.claimDefault
}

export function getSyncStatusLabel(params: {
  isLoading: boolean
  syncMessage: string
  usesSupabaseSpace: boolean
  realtimeStatus: SyncRealtimeStatus
}) {
  if (!params.usesSupabaseSpace) {
    return SYNC_STATUS_LABELS.notSynced
  }

  if (params.realtimeStatus === 'error' || params.syncMessage.includes('失败')) {
    return SYNC_STATUS_LABELS.error
  }

  if (params.realtimeStatus === 'connecting' || params.isLoading) {
    return SYNC_STATUS_LABELS.syncing
  }

  return SYNC_STATUS_LABELS.healthy
}
