import type { RewardClaimRecord, WishPriority, WishRecord } from '../../stores/wishes'
import { createRewardClaimRecord } from '../rewards/reward.factories'
import { createWishRecord, createWishStep } from './wish.factories'

type MockWishProgress =
  | { mode: 'count'; current: number; target: number; unit: string; starCoinValue: number }
  | { mode: 'steps'; doneSteps: number; stepTitles: string[]; stepStarCoinValues?: number[] }
  | { mode: 'none' }

interface MockWishDefinition {
  id: string
  title: string
  category: string
  priority: WishPriority
  note: string
  ownerId: 'member-a' | 'member-b'
  status: 'active' | 'done'
  createdDaysAgo: number
  updatedDaysAgo: number
  dueInDays: number | null
  progress: MockWishProgress
  completionStarCoinBonus: number
  scope?: 'private' | 'shared'
  starred?: boolean
}

const mockWishDefinitions: MockWishDefinition[] = [
  { id: 'wish-a-meal-prep', title: '周末备好三天便当', category: '饮食', priority: 'medium', note: '把午饭准备好，工作日少一点临时凑合。', ownerId: 'member-a', status: 'active', createdDaysAgo: 4, updatedDaysAgo: 1, dueInDays: 5, progress: { mode: 'count', current: 2, target: 6, unit: '餐', starCoinValue: 0.5 }, completionStarCoinBonus: 1 },
  { id: 'wish-a-balcony-herbs', title: '把阳台种成香草角', category: '居家', priority: 'low', note: '薄荷、罗勒和迷迭香先活下来。', ownerId: 'member-a', status: 'active', createdDaysAgo: 18, updatedDaysAgo: 2, dueInDays: 24, progress: { mode: 'steps', doneSteps: 2, stepTitles: ['买花盆和土', '种下第一批香草', '整理浇水提醒', '做一次香草料理'], stepStarCoinValues: [1, 1, 0.5, 1] }, completionStarCoinBonus: 2 },
  { id: 'wish-a-morning-walk', title: '早晨散步 20 次', category: '健康', priority: 'medium', note: '不用追求速度，只要出门晒到一点太阳。', ownerId: 'member-a', status: 'active', createdDaysAgo: 32, updatedDaysAgo: 0, dueInDays: 35, progress: { mode: 'count', current: 8, target: 20, unit: '次', starCoinValue: 0.5 }, completionStarCoinBonus: 2, starred: true },
  { id: 'wish-a-skincare-reset', title: '坚持四周睡前护肤', category: '生活', priority: 'low', note: '少买新东西，先把基础流程稳定下来。', ownerId: 'member-a', status: 'done', createdDaysAgo: 45, updatedDaysAgo: 5, dueInDays: -4, progress: { mode: 'steps', doneSteps: 3, stepTitles: ['整理现有护肤品', '记录一周皮肤状态', '坚持四周基础流程'], stepStarCoinValues: [0.5, 1, 1.5] }, completionStarCoinBonus: 2 },
  { id: 'wish-a-tea-shelf', title: '整理一个常喝茶的小架子', category: '居家', priority: 'low', note: '把杯子、茶叶和滤网放在顺手的位置。', ownerId: 'member-a', status: 'active', createdDaysAgo: 9, updatedDaysAgo: 9, dueInDays: null, progress: { mode: 'none' }, completionStarCoinBonus: 1 },
  { id: 'wish-a-family-call', title: '这个月给家里打 4 次电话', category: '关系', priority: 'high', note: '不用聊很久，认真问问近况就好。', ownerId: 'member-a', status: 'active', createdDaysAgo: 20, updatedDaysAgo: 4, dueInDays: 7, progress: { mode: 'count', current: 1, target: 4, unit: '次', starCoinValue: 1 }, completionStarCoinBonus: 2 },
  { id: 'wish-a-closet-reset', title: '把衣柜换季整理完', category: '居家', priority: 'medium', note: '留下真正会穿的，其他先分出去。', ownerId: 'member-a', status: 'active', createdDaysAgo: 60, updatedDaysAgo: 12, dueInDays: 14, progress: { mode: 'steps', doneSteps: 1, stepTitles: ['清出不穿的衣服', '补齐收纳盒', '整理通勤衣区', '整理周末衣区', '送出闲置衣物'], stepStarCoinValues: [1, 0.5, 1, 1, 1] }, completionStarCoinBonus: 3 },
  { id: 'wish-a-photo-album', title: '整理 30 张今年喜欢的照片', category: '记录', priority: 'medium', note: '从手机里挑出来，做成一个小相册。', ownerId: 'member-a', status: 'active', createdDaysAgo: 80, updatedDaysAgo: 3, dueInDays: 28, progress: { mode: 'count', current: 12, target: 30, unit: '张', starCoinValue: 0.5 }, completionStarCoinBonus: 2 },
  { id: 'wish-a-breakfast-week', title: '连续五天认真吃早餐', category: '饮食', priority: 'low', note: '不是为了精致，是为了早上不空着。', ownerId: 'member-a', status: 'done', createdDaysAgo: 28, updatedDaysAgo: 6, dueInDays: -2, progress: { mode: 'count', current: 5, target: 5, unit: '天', starCoinValue: 1 }, completionStarCoinBonus: 2 },
  { id: 'wish-a-budget-date', title: '做一次月度花销复盘', category: '财务', priority: 'medium', note: '看清楚钱去了哪里，不责怪自己。', ownerId: 'member-a', status: 'active', createdDaysAgo: 14, updatedDaysAgo: 14, dueInDays: 3, progress: { mode: 'steps', doneSteps: 0, stepTitles: ['导出账单', '标出大额支出', '写下下月预算', '定一个小奖励'], stepStarCoinValues: [0.5, 1, 1, 0.5] }, completionStarCoinBonus: 2 },
  { id: 'wish-a-yoga', title: '练 10 次睡前拉伸', category: '健康', priority: 'low', note: '让肩颈和后背轻一点。', ownerId: 'member-a', status: 'active', createdDaysAgo: 25, updatedDaysAgo: 8, dueInDays: 18, progress: { mode: 'count', current: 3, target: 10, unit: '次', starCoinValue: 0.5 }, completionStarCoinBonus: 1 },
  { id: 'wish-a-repair-shoes', title: '把常穿的鞋送去修一次', category: '生活', priority: 'low', note: '能修就先修，不急着买新的。', ownerId: 'member-a', status: 'active', createdDaysAgo: 38, updatedDaysAgo: 20, dueInDays: 9, progress: { mode: 'none' }, completionStarCoinBonus: 1 },
  { id: 'wish-a-read-novel', title: '读完一本搁置很久的小说', category: '阅读', priority: 'medium', note: '每天读几页，把注意力慢慢收回来。', ownerId: 'member-a', status: 'active', createdDaysAgo: 11, updatedDaysAgo: 1, dueInDays: 30, progress: { mode: 'count', current: 120, target: 300, unit: '页', starCoinValue: 0.1 }, completionStarCoinBonus: 2 },
  { id: 'wish-a-dentist', title: '完成一次牙齿检查', category: '健康', priority: 'high', note: '预约、检查、处理建议，一次走完。', ownerId: 'member-a', status: 'done', createdDaysAgo: 70, updatedDaysAgo: 10, dueInDays: -8, progress: { mode: 'none' }, completionStarCoinBonus: 3 },
  { id: 'wish-a-lunchbox-menu', title: '做出 5 个不腻的便当组合', category: '饮食', priority: 'medium', note: '轮换起来，午饭就不用每天重新想。', ownerId: 'member-a', status: 'active', createdDaysAgo: 22, updatedDaysAgo: 2, dueInDays: 20, progress: { mode: 'steps', doneSteps: 3, stepTitles: ['番茄牛肉饭', '鸡肉蔬菜卷', '虾仁炒饭', '豆腐盖饭', '冷面便当'], stepStarCoinValues: [1, 1, 1, 1, 1] }, completionStarCoinBonus: 2 },
  { id: 'wish-b-running', title: '累计完成 12 次慢跑', category: '健康', priority: 'medium', note: '先把出门频率养稳，再慢慢拉距离。', ownerId: 'member-b', status: 'active', createdDaysAgo: 16, updatedDaysAgo: 1, dueInDays: 26, progress: { mode: 'count', current: 5, target: 12, unit: '次', starCoinValue: 0.5 }, completionStarCoinBonus: 2, scope: 'shared' },
  { id: 'wish-b-home-coffee', title: '练会三种家里咖啡做法', category: '饮食', priority: 'low', note: '手冲、拿铁和冷萃各练一次。', ownerId: 'member-b', status: 'active', createdDaysAgo: 8, updatedDaysAgo: 0, dueInDays: 16, progress: { mode: 'steps', doneSteps: 2, stepTitles: ['手冲比例稳定', '练一次拿铁奶泡', '做一瓶冷萃'], stepStarCoinValues: [1, 1, 1] }, completionStarCoinBonus: 1 },
  { id: 'wish-b-movie-list', title: '看完 10 部想补的电影', category: '娱乐', priority: 'low', note: '不用写长影评，看完记一句感受。', ownerId: 'member-b', status: 'active', createdDaysAgo: 19, updatedDaysAgo: 6, dueInDays: 42, progress: { mode: 'count', current: 4, target: 10, unit: '部', starCoinValue: 0.5 }, completionStarCoinBonus: 2 },
  { id: 'wish-b-bike-maintenance', title: '把自行车彻底保养一次', category: '出行', priority: 'medium', note: '链条、刹车、胎压和灯都检查一遍。', ownerId: 'member-b', status: 'done', createdDaysAgo: 42, updatedDaysAgo: 7, dueInDays: -3, progress: { mode: 'steps', doneSteps: 3, stepTitles: ['清洁链条', '检查刹车', '补足胎压'], stepStarCoinValues: [1, 1, 1] }, completionStarCoinBonus: 2 },
  { id: 'wish-b-plant-water', title: '连续两周照顾好绿植', category: '居家', priority: 'low', note: '浇水、转盆、剪掉枯叶。', ownerId: 'member-b', status: 'active', createdDaysAgo: 13, updatedDaysAgo: 3, dueInDays: 8, progress: { mode: 'count', current: 6, target: 14, unit: '天', starCoinValue: 0.5 }, completionStarCoinBonus: 1 },
  { id: 'wish-b-desk-clean', title: '把书桌恢复到能专心工作的状态', category: '居家', priority: 'medium', note: '先清掉纸张和线，再留出真正的桌面。', ownerId: 'member-b', status: 'active', createdDaysAgo: 5, updatedDaysAgo: 5, dueInDays: 2, progress: { mode: 'none' }, completionStarCoinBonus: 1 },
  { id: 'wish-b-soup', title: '学会煲一锅稳定好喝的汤', category: '饮食', priority: 'medium', note: '从番茄牛腩和玉米排骨里选一种。', ownerId: 'member-b', status: 'active', createdDaysAgo: 30, updatedDaysAgo: 2, dueInDays: 17, progress: { mode: 'steps', doneSteps: 1, stepTitles: ['选定菜谱', '买齐食材', '第一次试做', '调整味道再做一次'], stepStarCoinValues: [0.5, 0.5, 1, 1] }, completionStarCoinBonus: 2 },
  { id: 'wish-b-sleep-before', title: '一周内 7 晚提前放下手机', category: '作息', priority: 'high', note: '睡前半小时不刷短视频。', ownerId: 'member-b', status: 'active', createdDaysAgo: 10, updatedDaysAgo: 1, dueInDays: 4, progress: { mode: 'count', current: 2, target: 7, unit: '晚', starCoinValue: 1 }, completionStarCoinBonus: 2, starred: true },
  { id: 'wish-b-laundry-routine', title: '固定一套周末洗衣流程', category: '生活', priority: 'low', note: '洗、晒、收、叠，不再拖到周一。', ownerId: 'member-b', status: 'done', createdDaysAgo: 26, updatedDaysAgo: 4, dueInDays: -1, progress: { mode: 'count', current: 4, target: 4, unit: '步', starCoinValue: 0.5 }, completionStarCoinBonus: 1 },
  { id: 'wish-b-cafe-map', title: '整理 8 家适合工作的咖啡店', category: '城市', priority: 'low', note: '记录插座、安静程度和好喝的东西。', ownerId: 'member-b', status: 'active', createdDaysAgo: 52, updatedDaysAgo: 15, dueInDays: 60, progress: { mode: 'count', current: 3, target: 8, unit: '家', starCoinValue: 0.5 }, completionStarCoinBonus: 2 },
  { id: 'wish-b-family-photo', title: '整理一次家里的老照片', category: '记录', priority: 'medium', note: '先挑一小盒，扫描几张最喜欢的。', ownerId: 'member-b', status: 'active', createdDaysAgo: 64, updatedDaysAgo: 32, dueInDays: 45, progress: { mode: 'steps', doneSteps: 0, stepTitles: ['挑出第一盒照片', '擦干净相框', '扫描 10 张', '备份到云盘'], stepStarCoinValues: [0.5, 0.5, 1, 1] }, completionStarCoinBonus: 2 },
  { id: 'wish-b-swim', title: '恢复游泳 6 次', category: '健康', priority: 'medium', note: '先找回水感，不追求速度。', ownerId: 'member-b', status: 'active', createdDaysAgo: 18, updatedDaysAgo: 9, dueInDays: 25, progress: { mode: 'count', current: 1, target: 6, unit: '次', starCoinValue: 1 }, completionStarCoinBonus: 2 },
  { id: 'wish-b-bathroom-cabinet', title: '整理浴室柜和备用日用品', category: '居家', priority: 'low', note: '把过期和重复的东西清掉。', ownerId: 'member-b', status: 'active', createdDaysAgo: 24, updatedDaysAgo: 3, dueInDays: 12, progress: { mode: 'steps', doneSteps: 2, stepTitles: ['清空柜子', '丢掉过期用品', '补齐常用消耗品', '分类放回去', '贴一个补货清单'], stepStarCoinValues: [0.5, 0.5, 1, 1, 0.5] }, completionStarCoinBonus: 2 },
  { id: 'wish-b-bike-ride', title: '找一天骑车去河边吹风', category: '出行', priority: 'low', note: '不赶路，带水和耳机就好。', ownerId: 'member-b', status: 'active', createdDaysAgo: 36, updatedDaysAgo: 18, dueInDays: 21, progress: { mode: 'none' }, completionStarCoinBonus: 1 },
  { id: 'wish-b-plant-corner', title: '把玄关做成小植物角', category: '居家', priority: 'medium', note: '换一个托盘，把灯和植物放顺。', ownerId: 'member-b', status: 'done', createdDaysAgo: 90, updatedDaysAgo: 11, dueInDays: -9, progress: { mode: 'steps', doneSteps: 4, stepTitles: ['量玄关尺寸', '买托盘', '换上耐阴植物', '整理灯线'], stepStarCoinValues: [0.5, 0.5, 1, 1] }, completionStarCoinBonus: 2 },
]

function createSeedTimestamp(daysAgo: number, hourOffset = 0) {
  const date = new Date()
  date.setHours(9 + (hourOffset % 8), 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

function createSeedDueDate(daysFromNow: number | null) {
  if (daysFromNow === null) {
    return ''
  }

  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().slice(0, 10)
}

function createMockSeedWishes() {
  return mockWishDefinitions.map((definition, definitionIndex) => {
    const createdAt = createSeedTimestamp(definition.createdDaysAgo, definitionIndex)
    const updatedAt = createSeedTimestamp(Math.min(definition.updatedDaysAgo, definition.createdDaysAgo), definitionIndex + 1)
    const progress = definition.progress
    const steps = progress.mode === 'steps'
      ? progress.stepTitles.map((title, stepIndex) => {
          const stepCreatedAt = createSeedTimestamp(Math.max(definition.createdDaysAgo - stepIndex, definition.updatedDaysAgo), stepIndex)
          const isDone = stepIndex < progress.doneSteps
          return createWishStep({
            id: `${definition.id}-step-${stepIndex + 1}`,
            title,
            isDone,
            starCoinValue: progress.stepStarCoinValues?.[stepIndex] ?? 1,
            createdAt: stepCreatedAt,
            updatedAt: isDone ? updatedAt : stepCreatedAt,
          })
        })
      : []

    return createWishRecord({
      id: definition.id,
      title: definition.title,
      category: definition.category,
      priority: definition.priority,
      dueDate: createSeedDueDate(definition.dueInDays),
      note: definition.note,
      ownerId: definition.ownerId,
      scope: definition.scope ?? 'private',
      status: definition.status,
      starred: definition.starred ?? false,
      progressMode: progress.mode,
      progressCurrent: progress.mode === 'count' ? progress.current : 0,
      progressStarCoinValue: progress.mode === 'count' ? progress.starCoinValue : 0,
      progressTarget: progress.mode === 'count' ? progress.target : 0,
      progressUnit: progress.mode === 'count' ? progress.unit : '',
      completionStarCoinBonus: definition.completionStarCoinBonus,
      completedAt: definition.status === 'done' ? updatedAt : null,
      steps,
      comments: [],
      createdAt,
      updatedAt,
    })
  })
}

function createMockSeedRewardClaims(wishes: WishRecord[]) {
  return wishes.flatMap((wish) => {
    const claims: RewardClaimRecord[] = []

    if (wish.progressMode === 'count' && wish.progressCurrent > 0 && wish.progressStarCoinValue > 0) {
      const starCoinDelta = wish.progressCurrent * wish.progressStarCoinValue
      claims.push(createRewardClaimRecord({
        id: `${wish.id}-count-star-coin-claim`,
        ownerId: wish.ownerId,
        claimKind: 'count_star_coin',
        quantity: Math.max(1, Math.round(wish.progressCurrent)),
        sourceWishId: wish.id,
        starCoinDelta,
        titleSnapshot: `${starCoinDelta} 星星币`,
        noteSnapshot: '本地模拟：数字进度已获得星星币',
        createdAt: wish.updatedAt,
      }))
    }

    if (wish.progressMode === 'steps') {
      for (const step of wish.steps.filter((item) => item.isDone && item.starCoinValue > 0)) {
        claims.push(createRewardClaimRecord({
          id: `${step.id}-star-coin-claim`,
          ownerId: wish.ownerId,
          claimKind: 'step_star_coin',
          sourceWishId: wish.id,
          sourceStepId: step.id,
          starCoinDelta: step.starCoinValue,
          titleSnapshot: `${step.starCoinValue} 星星币`,
          noteSnapshot: '本地模拟：步骤完成已获得星星币',
          createdAt: step.updatedAt,
        }))
      }
    }

    if (wish.status === 'done' && wish.completionStarCoinBonus > 0) {
      claims.push(createRewardClaimRecord({
        id: `${wish.id}-completion-star-coin-claim`,
        ownerId: wish.ownerId,
        claimKind: 'wish_completion_bonus',
        sourceWishId: wish.id,
        starCoinDelta: wish.completionStarCoinBonus,
        titleSnapshot: `${wish.completionStarCoinBonus} 星星币`,
        noteSnapshot: '本地模拟：愿望完成奖励',
        createdAt: wish.completedAt ?? wish.updatedAt,
      }))
    }

    return claims
  })
}

export function createMockWishSeedState() {
  const wishes = createMockSeedWishes()
  return {
    rewardClaims: createMockSeedRewardClaims(wishes),
    wishes,
  }
}
