import type {
  WishBottleColorTier,
  WishProgressMode,
  WishProgressSnapshot,
  WishStep,
} from '../../stores/wishes'

export function normalizeProgressNumber(value: number | null | undefined) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  return Math.max(0, Math.round(numericValue))
}

export function normalizeProgressMode(
  progressMode: WishProgressMode | null | undefined,
  steps: WishStep[],
  progressTarget: number,
  progressCurrent: number,
  progressUnit: string,
): WishProgressMode {
  if (progressMode === 'count' || progressMode === 'steps' || progressMode === 'none') {
    return progressMode
  }

  if (steps.length) {
    return 'steps'
  }

  if (progressTarget > 0 || progressCurrent > 0 || progressUnit) {
    return 'count'
  }

  return 'none'
}

export function getWishCompletionTimestamp(wish: Pick<{ status: string; completedAt: string | null; updatedAt: string }, 'status' | 'completedAt' | 'updatedAt'>) {
  if (wish.status !== 'done') {
    return null
  }

  const timestamp = new Date(wish.completedAt ?? wish.updatedAt).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

export function getWishProgressSnapshot(
  wish: Pick<{ progressMode: WishProgressMode; progressCurrent: number; progressTarget: number; progressUnit: string; steps: WishStep[] }, 'progressMode' | 'progressCurrent' | 'progressTarget' | 'progressUnit' | 'steps'>,
): WishProgressSnapshot {
  if (wish.progressMode === 'count') {
    const target = Math.max(1, normalizeProgressNumber(wish.progressTarget))
    const current = Math.min(normalizeProgressNumber(wish.progressCurrent), target)
    const unit = wish.progressUnit.trim()

    return {
      mode: 'count',
      current,
      target,
      percent: Math.round((current / target) * 100),
      label: `${current}/${target}${unit ? ` ${unit}` : ''}`,
      pendingStepTitles: [],
      isReady: current >= target,
    }
  }

  if (wish.progressMode === 'steps') {
    const target = wish.steps.length
    const current = wish.steps.filter((step) => step.isDone).length

    return {
      mode: 'steps',
      current,
      target,
      percent: target ? Math.round((current / target) * 100) : 0,
      label: `${current}/${target} steps`,
      pendingStepTitles: wish.steps.filter((step) => !step.isDone).map((step) => step.title),
      isReady: target > 0 && current >= target,
    }
  }

  return {
    mode: 'none',
    current: 0,
    target: 0,
    percent: 0,
    label: '',
    pendingStepTitles: [],
    isReady: false,
  }
}

export function getWishBottleColorTier(percent: number): WishBottleColorTier {
  const normalizedPercent = Math.max(0, Math.min(100, Math.round(percent)))

  if (normalizedPercent <= 20) {
    return 'blue'
  }

  if (normalizedPercent <= 40) {
    return 'green'
  }

  if (normalizedPercent <= 60) {
    return 'orange'
  }

  if (normalizedPercent <= 80) {
    return 'gold'
  }

  return 'rainbow'
}
