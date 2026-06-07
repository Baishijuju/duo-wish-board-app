import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'iphone-390x844', width: 390, height: 844 },
]

async function disableMotion(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
    `,
  })
}

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

test.describe('compose and detail visual acceptance', () => {
  for (const viewport of viewports) {
    test(`compose keeps the primary action reachable at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/compose')
      await expect(page.locator('#app')).toBeVisible()
      await disableMotion(page)
      await expectNoHorizontalOverflow(page)

      await expect(page.locator('.compose-field-title input')).toBeVisible()
      await expect(page.locator('.compose-preview-core-stage')).toBeVisible()
      await expect(page.locator('.compose-preview-summary-stage')).toHaveCount(0)
      await expect(page.getByRole('button', { name: '先写下这条愿望' })).toBeVisible()
      await expect(page.getByRole('button', { name: '再补一些细节' })).toBeVisible()

      await page.getByRole('button', { name: '再补一些细节' }).click()
      await expect(page.locator('.compose-preview-summary-stage')).toBeVisible()
      await expect(page.locator('.compose-preview-supplementary-stage')).toBeVisible()

      if (viewport.width <= 430) {
        await expect(page.locator('.compose-mobile-submit')).toBeVisible()
        const metrics = await page.evaluate(() => {
          const submitBox = document.querySelector('.compose-mobile-submit')?.getBoundingClientRect()
          const optionWidths = Array.from(document.querySelectorAll('.compose-option-card')).map((node) => Math.round(node.getBoundingClientRect().width))
          const priorityWidths = Array.from(document.querySelectorAll('.priority-row .compose-member-chip')).map((node) => Math.round(node.getBoundingClientRect().width))

          return {
            submitTop: submitBox?.top ?? Number.POSITIVE_INFINITY,
            minOptionWidth: Math.min(...optionWidths),
            minPriorityWidth: Math.min(...priorityWidths),
            viewportHeight: window.innerHeight,
          }
        })

        expect(metrics.submitTop).toBeLessThan(metrics.viewportHeight * 2.4)
        expect(metrics.minOptionWidth).toBeGreaterThanOrEqual(76)
        expect(metrics.minPriorityWidth).toBeGreaterThanOrEqual(76)
      }
    })

    test(`detail keeps low-frequency actions quiet at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/wish/wish-shared-trip')
      await expect(page.locator('#app')).toBeVisible()
      await disableMotion(page)
      await expectNoHorizontalOverflow(page)

      await expect(page.locator('.detail-atelier-story-card h1')).toBeVisible()
      await expect(page.locator('.detail-atelier-action-row')).toHaveCount(0)
      await expect(page.locator('.detail-atelier-overview-card.is-warm')).toHaveCount(0)
      await expect(page.locator('.detail-atelier-story-card .detail-atelier-hero-summary-grid')).toContainText('愿望币')
      await expect(page.locator('.detail-atelier-story-card .detail-atelier-hero-summary-grid')).toContainText('星星币')
      await expect(page.getByRole('button', { name: '完成并领奖' })).toHaveCount(0)
      await expect(page.locator('.detail-atelier-danger-summary')).toBeVisible()
      await expect(page.locator('.detail-atelier-danger-actions')).not.toBeVisible()
      await expect(page.getByText('以谁的身份留言')).toHaveCount(0)
      await expect(page.locator('.detail-atelier-compose-message-field textarea')).toBeVisible()

      const sectionOrder = await page.evaluate(() => {
        const progress = document.querySelector('#progress')?.getBoundingClientRect()
        const compose = document.querySelector('.detail-atelier-compose-band')?.getBoundingClientRect()

        return {
          progressTop: progress?.top ?? Number.POSITIVE_INFINITY,
          composeTop: compose?.top ?? 0,
        }
      })

      expect(sectionOrder.progressTop).toBeLessThan(sectionOrder.composeTop)

      if (viewport.width <= 430) {
        await expect(page.locator('.detail-atelier-story-card .detail-atelier-mobile-more-summary').filter({ hasText: '更多信息' })).toHaveCount(0)
        await expect(page.locator('.detail-atelier-story-card .detail-atelier-mobile-info-card')).toContainText('写下的人')
        await expect(page.locator('.detail-atelier-story-card .detail-atelier-mobile-info-card')).toContainText('创建时间')
        await expect(page.locator('.detail-atelier-compose-attachment-details')).toBeVisible()
      } else {
        await expect(page.locator('.detail-atelier-compose-attachment-panel')).toBeVisible()
      }

      if (viewport.width <= 430) {
        await page.locator('.detail-atelier-step-more-card .detail-atelier-mobile-more-summary').click()
      }

      const budgetStepCard = viewport.width <= 430
        ? page.locator('.detail-atelier-step-more-card .detail-atelier-step-card').filter({ hasText: '列出预算和时间窗' })
        : page.locator('.detail-atelier-step-list.detail-atelier-desktop-only .detail-atelier-step-card').filter({ hasText: '列出预算和时间窗' })
      const stepFeedbackCopy = '这个步骤已经放回路上，空间页里对应的小奖励也会先收住。'

      await budgetStepCard.getByRole('button', { name: '放回未完成' }).click()
      if (viewport.width <= 430) {
        await expect(page.locator('.detail-atelier-progress-quick-action .detail-atelier-step-feedback')).toHaveText(stepFeedbackCopy)
        await expect(budgetStepCard.locator('.detail-atelier-step-feedback')).toHaveCount(0)
      } else {
        await expect(budgetStepCard.locator('.detail-atelier-step-feedback')).toHaveText(stepFeedbackCopy)
      }
      await expect(page.locator('.detail-atelier-story-card > .detail-atelier-feedback').filter({ hasText: stepFeedbackCopy })).toHaveCount(0)

      const reactionToggle = viewport.width <= 430
        ? page.locator('.detail-atelier-mobile-reaction-rail .detail-atelier-reaction-toggle').first()
        : page.locator('.detail-atelier-reaction-toggle').first()

      if (viewport.width <= 430) {
        await expect(page.locator('.detail-atelier-mobile-thread-more-summary')).toHaveCount(0)
        await expect(page.locator('.detail-atelier-mobile-reaction-rail').first()).toBeVisible()
        const compactThreadMetrics = await page.evaluate(() => {
          const card = document.querySelector('.detail-atelier-thread-list.detail-atelier-mobile-only .detail-atelier-thread-entry')?.getBoundingClientRect()
          const chips = document.querySelector('.detail-atelier-thread-list.detail-atelier-mobile-only .detail-atelier-mobile-thread-corner-chips')?.getBoundingClientRect()
          const reactionRail = document.querySelector('.detail-atelier-thread-list.detail-atelier-mobile-only .detail-atelier-mobile-reaction-rail')?.getBoundingClientRect()

          return {
            cornerChipsRightInset: Math.round((card?.right ?? 0) - (chips?.right ?? 0)),
            cornerChipsTop: Math.round((chips?.top ?? 0) - (card?.top ?? 0)),
            firstThreadHeight: Math.round(card?.height ?? 0),
            reactionRailHeight: Math.round(reactionRail?.height ?? 0),
          }
        })

        expect(compactThreadMetrics.firstThreadHeight).toBeLessThanOrEqual(190)
        expect(compactThreadMetrics.cornerChipsTop).toBeLessThanOrEqual(20)
        expect(compactThreadMetrics.cornerChipsRightInset).toBeLessThanOrEqual(24)
        expect(compactThreadMetrics.reactionRailHeight).toBeLessThanOrEqual(34)
      }

      await expect(reactionToggle).toBeVisible()
      await expect(reactionToggle).toHaveAttribute('aria-expanded', 'false')
      await expect(page.locator('.detail-atelier-reaction-list.is-extended .detail-atelier-reaction-button')).toHaveCount(0)
      await expect(page.locator('#detail-thread-reaction-sheet')).toHaveCount(0)

      if (viewport.width <= 430) {
        const metrics = await page.evaluate(() => {
          const danger = document.querySelector('.detail-atelier-danger-summary')?.getBoundingClientRect()
          const heroSummary = document.querySelector('.detail-atelier-story-card .detail-atelier-hero-summary-grid')?.getBoundingClientRect()
          const progress = document.querySelector('#progress')?.getBoundingClientRect()
          const compose = document.querySelector('.detail-atelier-compose-band')?.getBoundingClientRect()
          const compactChipRows = Array.from(document.querySelectorAll('.detail-atelier-chip-row.compact')).map((node) => {
            const box = node.getBoundingClientRect()
            return Math.round(box.width)
          })

          return {
            dangerTop: danger?.top ?? Number.POSITIVE_INFINITY,
            heroSummaryWidth: Math.round(heroSummary?.width ?? 0),
            progressBeforeCompose: (progress?.top ?? Number.POSITIVE_INFINITY) < (compose?.top ?? 0),
            compactChipRowMaxWidth: compactChipRows.length ? Math.max(...compactChipRows) : 0,
            viewportWidth: window.innerWidth,
          }
        })

        expect(metrics.dangerTop).toBeGreaterThan(0)
        expect(metrics.heroSummaryWidth).toBeGreaterThan(300)
        expect(metrics.progressBeforeCompose).toBe(true)
        expect(metrics.compactChipRowMaxWidth).toBeLessThanOrEqual(metrics.viewportWidth)
      }

      await reactionToggle.click()

      if (viewport.width <= 430) {
        const reactionSheet = page.locator('#detail-thread-reaction-sheet')

        await expect(reactionToggle).toHaveAttribute('aria-expanded', 'true')
        await expect(reactionSheet).toBeVisible()
        await expect(reactionSheet.locator('.detail-atelier-reaction-picker-grid .detail-atelier-reaction-button').first()).toBeVisible()
        await expect(reactionSheet.getByText(/还可以再选|已经选满/)).toBeVisible()
        await expectNoHorizontalOverflow(page)

        await reactionSheet.locator('.detail-atelier-reaction-picker-close').click()
        await expect(reactionSheet).toHaveCount(0)
        await expect(reactionToggle).toHaveAttribute('aria-expanded', 'false')
      } else {
        await expect(page.locator('.detail-atelier-reaction-list.is-extended:visible .detail-atelier-reaction-button').first()).toBeVisible()
      }

      await page.goto('/wish/wish-health-run')
      await expect(page.locator('.detail-atelier-story-card h1')).toBeVisible()
      await expect(page.getByRole('button', { name: '完成并领奖' })).toHaveCount(0)
      await expect(page.locator('.detail-atelier-overview-card.is-warm')).toHaveCount(0)

      const countFeedbackCopy = '数字进度先往前走了 1 点，小奖励已经留到空间页等你去领。'
      const countQuickAction = page.locator('.detail-atelier-progress-quick-action').first()

      await countQuickAction.locator('.detail-atelier-progress-primary').click()
      await expect(countQuickAction.locator('.detail-atelier-progress-feedback')).toHaveText(countFeedbackCopy)
      await expect(page.locator('.detail-atelier-story-card > .detail-atelier-feedback').filter({ hasText: countFeedbackCopy })).toHaveCount(0)

      for (let clickIndex = 0; clickIndex < 6; clickIndex += 1) {
        await countQuickAction.locator('.detail-atelier-progress-primary').click()
      }

      const completionButton = page.locator('.detail-atelier-progress-completion')
      await expect(completionButton).toBeVisible()
      await completionButton.click()
      await expect(page.locator('.detail-atelier-story-card > .detail-atelier-feedback')).toHaveText('先去空间页给自己准备至少一个高档奖励，再来完成这条愿望。')
      await expectNoHorizontalOverflow(page)
    })

    test(`space keeps reward member cards paired at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/space')
      await expect(page.locator('#app')).toBeVisible()
      await disableMotion(page)
      await expectNoHorizontalOverflow(page)

      await page.getByRole('button', { name: /编辑/ }).click()

      const rewardMembers = page.locator('.reward-member-strip')
      await expect(rewardMembers.first()).toBeVisible()
      await expect(rewardMembers).toHaveCount(2)

      await rewardMembers.first().scrollIntoViewIfNeeded()
      const metrics = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.reward-member-strip')).slice(0, 2).map((node) => node.getBoundingClientRect())

        return {
          firstTop: Math.round(cards[0]?.top ?? 0),
          secondTop: Math.round(cards[1]?.top ?? 9999),
          maxRight: Math.round(Math.max(...cards.map((card) => card.right))),
          viewportWidth: window.innerWidth,
        }
      })

      expect(Math.abs(metrics.firstTop - metrics.secondTop)).toBeLessThanOrEqual(4)
      expect(metrics.maxRight).toBeLessThanOrEqual(metrics.viewportWidth)
    })
  }
})
