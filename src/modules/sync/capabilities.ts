export function isRewardFeatureMissing(message: string) {
  return /reward_pool_items|reward_claims|complete_wish_with_reward|claim_completed_step_reward|claim_count_progress_reward|redeem_premium_reward/i.test(message)
}

export function isWishThreadFeatureMissing(message: string) {
  return /wish_threads|wish_thread_images|thread_reactions|monthly_journal_snapshots|ensure_monthly_journal_snapshots/i.test(message)
}
