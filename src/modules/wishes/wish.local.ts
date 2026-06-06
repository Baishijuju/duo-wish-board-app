import type {
  MonthlyJournalSnapshotRecord,
  RewardClaimRecord,
  RewardPoolItem,
  ThreadReactionRecord,
  WishCoinRecord,
  WishRecord,
} from '../../stores/wishes'
import {
  createMonthlyJournalSnapshotRecord,
  createThreadReactionRecord,
} from '../journal/journal.factories'
import { createRewardClaimRecord, createRewardPoolItem } from '../rewards/reward.factories'
import { createWishCoinRecord, createWishRecord } from './wish.factories'

export const STORAGE_KEY = 'duo-wish-board-app:v3'
export const LEGACY_STORAGE_KEYS = ['duo-wish-board-app:v2'] as const

export interface PersistedWishState {
  version: 6
  monthlyJournalSnapshots: MonthlyJournalSnapshotRecord[]
  rewardClaims: RewardClaimRecord[]
  rewardPoolItems: RewardPoolItem[]
  threadReactions: ThreadReactionRecord[]
  wishes: WishRecord[]
  coins: WishCoinRecord[]
}

export interface SeedWishState {
  coins: WishCoinRecord[]
  monthlyJournalSnapshots: MonthlyJournalSnapshotRecord[]
  rewardClaims: RewardClaimRecord[]
  rewardPoolItems: RewardPoolItem[]
  threadReactions: ThreadReactionRecord[]
  wishes: WishRecord[]
}

export function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export function clearLegacyWishStorage(storage: Storage) {
  for (const legacyStorageKey of LEGACY_STORAGE_KEYS) {
    storage.removeItem(legacyStorageKey)
  }
}

export function hydrateWishState(createSeedWishState: () => SeedWishState) {
  const storage = getBrowserStorage()

  if (!storage) {
    return createSeedWishState()
  }

  clearLegacyWishStorage(storage)

  const raw = storage.getItem(STORAGE_KEY)

  if (!raw) {
    return createSeedWishState()
  }

  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      return {
        coins: [],
        monthlyJournalSnapshots: [],
        rewardClaims: [],
        rewardPoolItems: [],
        threadReactions: [],
        wishes: parsed.map((wish) => createWishRecord(wish)),
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return createSeedWishState()
    }

    const parsedWishes = Array.isArray((parsed as { wishes?: unknown }).wishes)
      ? (parsed as { wishes: WishRecord[] }).wishes.map((wish) => createWishRecord(wish))
      : null
    const parsedCoins = Array.isArray((parsed as { coins?: unknown }).coins)
      ? (parsed as { coins: WishCoinRecord[] }).coins.map((coin) => createWishCoinRecord(coin))
      : []
    const parsedRewardPoolItems = Array.isArray((parsed as { rewardPoolItems?: unknown }).rewardPoolItems)
      ? (parsed as { rewardPoolItems: RewardPoolItem[] }).rewardPoolItems.map((item) => createRewardPoolItem(item))
      : []
    const parsedRewardClaims = Array.isArray((parsed as { rewardClaims?: unknown }).rewardClaims)
      ? (parsed as { rewardClaims: RewardClaimRecord[] }).rewardClaims.map((claim) => createRewardClaimRecord(claim))
      : []
    const parsedThreadReactions = Array.isArray((parsed as { threadReactions?: unknown }).threadReactions)
      ? (parsed as { threadReactions: ThreadReactionRecord[] }).threadReactions.map((reaction) => createThreadReactionRecord(reaction))
      : []
    const parsedMonthlyJournalSnapshots = Array.isArray((parsed as { monthlyJournalSnapshots?: unknown }).monthlyJournalSnapshots)
      ? (parsed as { monthlyJournalSnapshots: MonthlyJournalSnapshotRecord[] }).monthlyJournalSnapshots.map((snapshot) => createMonthlyJournalSnapshotRecord(snapshot))
      : []

    if (!parsedWishes) {
      return createSeedWishState()
    }

    return {
      coins: parsedCoins,
      monthlyJournalSnapshots: parsedMonthlyJournalSnapshots,
      rewardClaims: parsedRewardClaims,
      rewardPoolItems: parsedRewardPoolItems,
      threadReactions: parsedThreadReactions,
      wishes: parsedWishes,
    }
  } catch {
    return createSeedWishState()
  }
}

export function touchWish<T extends { updatedAt: string }>(wish: T) {
  return {
    ...wish,
    updatedAt: new Date().toISOString(),
  }
}
