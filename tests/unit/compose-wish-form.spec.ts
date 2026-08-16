import { describe, expect, it } from 'vitest'
import { createEmptyWishDraft } from '../../src/composables/useComposeWishForm'

describe('useComposeWishForm', () => {
  it('defaults a new wish to count mode', () => {
    const draft = createEmptyWishDraft('member-a')

    expect(draft.progressMode).toBe('count')
  })
})
