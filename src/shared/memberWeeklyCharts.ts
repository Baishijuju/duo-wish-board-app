import type { RewardClaimRecord, WishRecord } from '../stores/wishes'

export function chartDateKey(timestamp: string | Date) {
  const date = new Date(new Date(timestamp).getTime() + 8 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 10)
}

export function weeklyChartDates(today: string) {
  const date = new Date(`${today}T00:00:00Z`)
  const mondayOffset = (date.getUTCDay() + 6) % 7
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date)
    day.setUTCDate(date.getUTCDate() - mondayOffset + index)
    return day.toISOString().slice(0, 10)
  })
}

export function buildMemberWeeklyChart(
  wishes: WishRecord[],
  claims: RewardClaimRecord[],
  memberIds: string[],
  dates: string[],
  metric: 'progress' | 'coins',
) {
  const wishMap = new Map(wishes.map((wish) => [wish.id, wish]))
  const events: Array<{ ownerId: string; date: string; category: string; units: number }> = []
  for (const claim of claims) {
    const wish = claim.sourceWishId ? wishMap.get(claim.sourceWishId) : undefined
    if (!wish) continue
    const units = metric === 'progress'
      ? claim.claimKind === 'count_star_coin' ? Math.max(0, claim.quantity) : 0
      : claim.claimKind === 'count_star_coin'
        ? Math.max(0, claim.quantity) * Math.max(0, wish.progressStarCoinValue)
        : Math.max(0, claim.starCoinDelta)
    if (units > 0) events.push({ ownerId: claim.ownerId, date: chartDateKey(claim.createdAt), category: wish.category || '未分类', units })
  }
  if (metric === 'progress') {
    for (const wish of wishes) {
      for (const step of wish.steps) {
        if (step.isDone) events.push({ ownerId: wish.ownerId, date: chartDateKey(step.updatedAt), category: wish.category || '未分类', units: 1 })
      }
      if (wish.completedAt) events.push({ ownerId: wish.ownerId, date: chartDateKey(wish.completedAt), category: wish.category || '未分类', units: 1 })
    }
  }
  const relevantEvents = events.filter((event) => dates.includes(event.date) && memberIds.includes(event.ownerId))
  const categoryTotals = new Map<string, number>()
  for (const event of relevantEvents) categoryTotals.set(event.category, (categoryTotals.get(event.category) ?? 0) + event.units)
  const categories = [...categoryTotals].sort((left, right) => right[1] - left[1]).slice(0, 5).map(([category]) => category)
  const days = dates.map((date) => ({
    date,
    members: memberIds.map((ownerId) => {
      const memberEvents = relevantEvents.filter((event) => event.date === date && event.ownerId === ownerId)
      const layers = new Map<number, number>()
      for (const event of memberEvents) {
        const categoryIndex = categories.indexOf(event.category)
        const index = categoryIndex < 0 ? 5 : categoryIndex
        layers.set(index, (layers.get(index) ?? 0) + event.units)
      }
      return { ownerId, total: memberEvents.reduce((sum, event) => sum + event.units, 0), layers: [...layers].map(([index, units]) => ({ index, units })) }
    }),
  }))
  return {
    categories,
    days,
    max: Math.max(1, ...days.flatMap((day) => day.members.map((member) => member.total))),
    totals: memberIds.map((ownerId) => ({ ownerId, total: relevantEvents.filter((event) => event.ownerId === ownerId).reduce((sum, event) => sum + event.units, 0) })),
  }
}