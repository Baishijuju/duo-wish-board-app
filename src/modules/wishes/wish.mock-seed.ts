import type { RewardClaimRecord, RewardPoolItem, ThreadReactionRecord, WishImage, WishPriority, WishRecord } from '../../stores/wishes'
import { createMonthlyJournalSnapshotRecord, createThreadReactionRecord } from '../journal/journal.factories'
import { createRewardClaimRecord, createRewardPoolItem } from '../rewards/reward.factories'
import type { SeedWishState } from './wish.local'
import { createWishComment, createWishImage, createWishRecord, createWishStep } from './wish.factories'

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

interface MockRewardDeposit {
  itemId: string
  ownerId: 'member-a' | 'member-b'
  amount: number
  daysAgo: number
}

interface MockRewardRedeem {
  itemId: string
  ownerId: 'member-a' | 'member-b'
  daysAgo: number
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

const mockWishComments: Record<string, Array<{ authorId: 'member-a' | 'member-b'; message: string; daysAgo: number }>> = {
  'wish-a-meal-prep': [
    { authorId: 'member-a', message: '这周先做番茄鸡蛋和照烧鸡腿，不追求花样。', daysAgo: 2 },
    { authorId: 'member-b', message: '我可以顺手把饭盒洗出来，周日晚上别太赶。', daysAgo: 1 },
  ],
  'wish-a-balcony-herbs': [
    { authorId: 'member-b', message: '罗勒如果活下来，下次可以做青酱意面。', daysAgo: 5 },
    { authorId: 'member-a', message: '今天薄荷长出新叶了，先把浇水提醒设好。', daysAgo: 2 },
  ],
  'wish-a-morning-walk': [
    { authorId: 'member-a', message: '今天走到面包店再绕回来，刚好 22 分钟。', daysAgo: 0 },
    { authorId: 'member-b', message: '这个节奏挺舒服的，不用加速。', daysAgo: 0 },
  ],
  'wish-a-skincare-reset': [
    { authorId: 'member-a', message: '四周结束，最有用的是别再乱加新步骤。', daysAgo: 5 },
  ],
  'wish-a-photo-album': [
    { authorId: 'member-a', message: '先挑了 12 张，发现好多小日子其实值得留下。', daysAgo: 3 },
  ],
  'wish-a-budget-date': [
    { authorId: 'member-b', message: '复盘的时候别太严厉，主要是看清楚。', daysAgo: 10 },
  ],
  'wish-a-dentist': [
    { authorId: 'member-a', message: '洗完牙终于不再惦记这件事了。', daysAgo: 10 },
    { authorId: 'member-b', message: '这条应该奖励一下，拖延很久的小事也很消耗。', daysAgo: 9 },
  ],
  'wish-b-running': [
    { authorId: 'member-b', message: '跑第五次的时候膝盖没不舒服，可以继续。', daysAgo: 1 },
    { authorId: 'member-a', message: '下次我在终点买水等你。', daysAgo: 1 },
  ],
  'wish-b-home-coffee': [
    { authorId: 'member-b', message: '手冲比例先固定 1:15，今天这杯比较稳。', daysAgo: 0 },
  ],
  'wish-b-bike-maintenance': [
    { authorId: 'member-b', message: '刹车调完之后安心很多，周末可以骑远一点。', daysAgo: 7 },
  ],
  'wish-b-sleep-before': [
    { authorId: 'member-a', message: '我也一起提前放手机，互相少刷一点。', daysAgo: 2 },
    { authorId: 'member-b', message: '第二晚最难，第三晚反而轻松一点。', daysAgo: 1 },
  ],
  'wish-b-family-photo': [
    { authorId: 'member-b', message: '翻到一张小时候在楼下吃冰棍的照片。', daysAgo: 32 },
  ],
}

const mockWishImages: Record<string, Array<{ note: string; daysAgo: number; color: string }>> = {
  'wish-a-meal-prep': [{ note: '周日晚上先备好的两盒便当。', daysAgo: 1, color: '#d89b72' }],
  'wish-a-balcony-herbs': [{ note: '阳台香草角的第一批小苗。', daysAgo: 2, color: '#8fb49a' }],
  'wish-a-photo-album': [{ note: '准备冲洗的小照片清单。', daysAgo: 3, color: '#b9a7cf' }],
  'wish-a-desk': [{ note: '桌面空出来之后舒服很多。', daysAgo: 2, color: '#c9a184' }],
  'wish-b-home-coffee': [{ note: '今天这杯手冲比例刚好。', daysAgo: 0, color: '#9b806f' }],
  'wish-b-bike-maintenance': [{ note: '链条清理完，车也轻了一点。', daysAgo: 7, color: '#8aa4a6' }],
  'wish-b-plant-corner': [{ note: '玄关的小植物角终于成形。', daysAgo: 11, color: '#8da98b' }],
}

const mockRewardPoolDefinitions: Array<Partial<RewardPoolItem> & Pick<RewardPoolItem, 'id' | 'ownerId' | 'tier' | 'title'>> = [
  { id: 'reward-a-coffee', ownerId: 'member-a', tier: 'daily', title: '上班路上买一杯拿铁', note: '不纠结价格，今天喝喜欢的那杯。', createdAt: createSeedTimestamp(12) },
  { id: 'reward-a-drama', ownerId: 'member-a', tier: 'daily', title: '晚饭后看一集轻松的剧', note: '不倍速，也不边看边回消息。', createdAt: createSeedTimestamp(10) },
  { id: 'reward-a-dessert', ownerId: 'member-a', tier: 'daily', title: '给自己带一小块甜点', note: '选一个真正想吃的口味。', createdAt: createSeedTimestamp(8) },
  { id: 'reward-a-flowers', ownerId: 'member-a', tier: 'premium', title: '给书桌换一小束鲜花', note: '让这周的房间先亮起来一点。', starCoinCost: 12, createdAt: createSeedTimestamp(24) },
  { id: 'reward-a-bookstore', ownerId: 'member-a', tier: 'premium', title: '留一个下午逛书店', note: '不用赶场，慢慢翻书。', starCoinCost: 18, createdAt: createSeedTimestamp(34) },
  { id: 'reward-a-brunch', ownerId: 'member-a', tier: 'premium', title: '找一家窗边早餐店', note: '慢慢吃一顿不赶时间的早餐。', starCoinCost: 22, createdAt: createSeedTimestamp(45) },
  { id: 'reward-b-iced-coffee', ownerId: 'member-b', tier: 'daily', title: '午后买一杯冰咖啡', note: '当作今天认真推进的小收尾。', createdAt: createSeedTimestamp(9) },
  { id: 'reward-b-game-hour', ownerId: 'member-b', tier: 'daily', title: '晚上留一小时打游戏', note: '提前收尾家务，玩的时候不愧疚。', createdAt: createSeedTimestamp(7) },
  { id: 'reward-b-night-walk', ownerId: 'member-b', tier: 'daily', title: '饭后去河边散步', note: '不带任务，只吹一会儿风。', createdAt: createSeedTimestamp(6) },
  { id: 'reward-b-headphones', ownerId: 'member-b', tier: 'premium', title: '换一副通勤耳机', note: '让路上的音乐和播客更舒服。', starCoinCost: 20, createdAt: createSeedTimestamp(40) },
  { id: 'reward-b-bike-route', ownerId: 'member-b', tier: 'premium', title: '租车骑一下午河边路线', note: '找一条风景舒服、坡度不狠的路线。', starCoinCost: 16, createdAt: createSeedTimestamp(31) },
  { id: 'reward-b-weekend-brunch', ownerId: 'member-b', tier: 'premium', title: '吃一次周末早午餐', note: '点一份平时不会点的主菜。', starCoinCost: 24, createdAt: createSeedTimestamp(25) },
]

const mockRewardDeposits: MockRewardDeposit[] = [
  { itemId: 'reward-a-flowers', ownerId: 'member-a', amount: 8, daysAgo: 6 },
  { itemId: 'reward-a-bookstore', ownerId: 'member-a', amount: 18, daysAgo: 14 },
  { itemId: 'reward-a-brunch', ownerId: 'member-b', amount: 6, daysAgo: 4 },
  { itemId: 'reward-b-headphones', ownerId: 'member-b', amount: 9, daysAgo: 8 },
  { itemId: 'reward-b-bike-route', ownerId: 'member-b', amount: 16, daysAgo: 18 },
  { itemId: 'reward-b-weekend-brunch', ownerId: 'member-a', amount: 5, daysAgo: 3 },
]

const mockRewardRedeems: MockRewardRedeem[] = [
  { itemId: 'reward-a-bookstore', ownerId: 'member-a', daysAgo: 12 },
  { itemId: 'reward-b-bike-route', ownerId: 'member-b', daysAgo: 16 },
]

const mockThreadReactions: Array<Partial<ThreadReactionRecord> & Pick<ThreadReactionRecord, 'targetThreadId' | 'actorId' | 'emoji'>> = [
  { id: 'reaction-a-walk-comment-b', targetThreadId: 'wish-a-morning-walk-comment-2', actorId: 'member-a', emoji: '✨', createdAt: createSeedTimestamp(0, 7) },
  { id: 'reaction-a-dentist-complete-b', targetThreadId: 'thread-wish-completed-wish-a-dentist', actorId: 'member-b', emoji: '🎉', createdAt: createSeedTimestamp(9, 2) },
  { id: 'reaction-b-running-comment-a', targetThreadId: 'wish-b-running-comment-2', actorId: 'member-b', emoji: '💪', createdAt: createSeedTimestamp(1, 5) },
  { id: 'reaction-b-bike-reward-a', targetThreadId: 'thread-reward-claim-reward-b-bike-route-redeem', actorId: 'member-a', emoji: '🚲', createdAt: createSeedTimestamp(16, 3) },
  { id: 'reaction-a-bookstore-reward-b', targetThreadId: 'thread-reward-claim-reward-a-bookstore-redeem', actorId: 'member-b', emoji: '📚', createdAt: createSeedTimestamp(12, 3) },
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

function createMockImageDataUrl(label: string, color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="${color}"/><circle cx="220" cy="180" r="120" fill="rgba(255,255,255,.28)"/><circle cx="980" cy="620" r="180" fill="rgba(255,255,255,.18)"/><text x="80" y="690" fill="rgba(55,42,36,.72)" font-family="sans-serif" font-size="58" font-weight="700">${label}</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function createMockWishImages(definition: MockWishDefinition): WishImage[] {
  const imageDefinitions = mockWishImages[definition.id] ?? []

  return imageDefinitions.map((image, imageIndex) => createWishImage({
    id: `${definition.id}-image-${imageIndex + 1}`,
    createdAt: createSeedTimestamp(image.daysAgo, imageIndex + 2),
    createdBy: definition.ownerId,
    fileName: `${definition.id}-${imageIndex + 1}.svg`,
    mimeType: 'image/svg+xml',
    note: image.note,
    sizeBytes: 24_000 + imageIndex * 1200,
    storagePath: `mock/${definition.id}/${imageIndex + 1}.svg`,
    url: createMockImageDataUrl(definition.category || '生活记录', image.color),
  }))
}

function createMockWishComments(definition: MockWishDefinition) {
  const comments = mockWishComments[definition.id] ?? []

  return comments.map((comment, commentIndex) => createWishComment({
    id: `${definition.id}-comment-${commentIndex + 1}`,
    authorId: comment.authorId,
    message: comment.message,
    createdAt: createSeedTimestamp(comment.daysAgo, commentIndex + 3),
  }))
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
      comments: createMockWishComments(definition),
      images: createMockWishImages(definition),
      createdAt,
      updatedAt,
    })
  })
}

function createMockRewardPoolItems() {
  return mockRewardPoolDefinitions.map((item) => createRewardPoolItem(item))
}

function createMockRewardDepositClaims(rewardPoolItems: RewardPoolItem[]) {
  const rewardMap = new Map(rewardPoolItems.map((item) => [item.id, item]))

  return mockRewardDeposits.flatMap((deposit) => {
    const rewardItem = rewardMap.get(deposit.itemId)

    if (!rewardItem) {
      return []
    }

    return [createRewardClaimRecord({
      id: `${deposit.itemId}-deposit-${deposit.ownerId}`,
      ownerId: deposit.ownerId,
      rewardItemId: rewardItem.id,
      claimKind: 'reward_deposit',
      quantity: deposit.amount,
      starCoinDelta: -deposit.amount,
      titleSnapshot: rewardItem.title,
      noteSnapshot: `本地模拟：给「${rewardItem.title}」存入星星币`,
      createdAt: createSeedTimestamp(deposit.daysAgo, 4),
    })]
  })
}

function createMockRewardRedeemClaims(rewardPoolItems: RewardPoolItem[]) {
  const rewardMap = new Map(rewardPoolItems.map((item) => [item.id, item]))

  return mockRewardRedeems.flatMap((redeem) => {
    const rewardItem = rewardMap.get(redeem.itemId)

    if (!rewardItem) {
      return []
    }

    return [createRewardClaimRecord({
      id: `${redeem.itemId}-redeem`,
      ownerId: redeem.ownerId,
      rewardItemId: rewardItem.id,
      claimKind: 'premium_redeem',
      quantity: 1,
      starCoinDelta: 0,
      titleSnapshot: rewardItem.title,
      noteSnapshot: rewardItem.note,
      createdAt: createSeedTimestamp(redeem.daysAgo, 5),
    })]
  })
}

function createMockThreadReactions() {
  return mockThreadReactions.map((reaction) => createThreadReactionRecord(reaction))
}

function createMockMonthlyJournalSnapshots() {
  return [
    createMonthlyJournalSnapshotRecord({
      id: 'snapshot-mock-last-month',
      monthKey: createMonthKey(-1),
      coverTitle: '把小事慢慢收进生活里',
      coverSubtitle: '上个月完成了几件拖了很久的小愿望。',
      createdAt: createSeedTimestamp(18, 2),
      createdBy: 'member-a',
      metricsSnapshot: {
        completedWishCount: 4,
        commentCount: 7,
        rewardEventCount: 9,
        wishCount: 12,
      },
      narrativeBlocks: [
        { actorId: 'member-a', title: '换窗帘、洗牙、早餐这几件事终于落地', body: '很多愿望并不大，但做完之后会明显少一点惦记。' },
        { actorId: 'member-b', title: '自行车和玄关植物角都完成了', body: '空间被整理顺了，周末也多了一点出门的理由。' },
      ],
      sourceRefs: [
        { wishId: 'wish-a-dentist', eventKind: 'wish_completed' },
        { wishId: 'wish-b-bike-maintenance', eventKind: 'wish_completed' },
      ],
    }),
    createMonthlyJournalSnapshotRecord({
      id: 'snapshot-mock-two-months-ago',
      monthKey: createMonthKey(-2),
      coverTitle: '认真开始之前，也先好好记录',
      coverSubtitle: '这个月更多是在写下、整理和找到节奏。',
      createdAt: createSeedTimestamp(49, 1),
      createdBy: 'member-b',
      metricsSnapshot: {
        completedWishCount: 2,
        commentCount: 4,
        rewardEventCount: 5,
        wishCount: 9,
      },
      narrativeBlocks: [
        { actorId: 'member-a', title: '照片、预算和衣柜都开始有了轮廓', body: '不是一下子完成，而是先把入口找到。' },
        { actorId: 'member-b', title: '跑步、咖啡和睡前放手机进入清单', body: '生活习惯类愿望开始变得可追踪。' },
      ],
      sourceRefs: [
        { wishId: 'wish-a-photo-album', eventKind: 'wish_published' },
        { wishId: 'wish-b-sleep-before', eventKind: 'wish_published' },
      ],
    }),
  ]
}

function createMonthKey(monthOffset: number) {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() + monthOffset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
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

export function createMockWishSeedState(): SeedWishState {
  const wishes = createMockSeedWishes()
  const rewardPoolItems = createMockRewardPoolItems()
  return {
    monthlyJournalSnapshots: createMockMonthlyJournalSnapshots(),
    rewardClaims: [
      ...createMockSeedRewardClaims(wishes),
      ...createMockRewardDepositClaims(rewardPoolItems),
      ...createMockRewardRedeemClaims(rewardPoolItems),
    ],
    rewardPoolItems,
    threadReactions: createMockThreadReactions(),
    wishes,
  }
}
