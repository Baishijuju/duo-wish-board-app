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
      await expect(page.locator('.detail-atelier-action-row .detail-atelier-primary')).toBeVisible()
      await expect(page.locator('.detail-atelier-danger-summary')).toBeVisible()
      await expect(page.locator('.detail-atelier-danger-actions')).not.toBeVisible()
      await expect(page.getByText('以谁的身份留言')).toHaveCount(0)
      await expect(page.locator('.detail-atelier-compose-message-field textarea')).toBeVisible()
      if (viewport.width <= 430) {
        await expect(page.locator('.detail-atelier-compose-attachment-details')).toBeVisible()
      } else {
        await expect(page.locator('.detail-atelier-compose-attachment-panel')).toBeVisible()
      }
      const reactionToggle = viewport.width <= 430
        ? page.locator('.detail-atelier-mobile-thread-more[open] .detail-atelier-reaction-toggle').first()
        : page.locator('.detail-atelier-reaction-toggle').first()

      if (viewport.width <= 430) {
        await expect(page.locator('.detail-atelier-mobile-thread-more-summary').first()).toBeVisible()
        const compactThreadMetrics = await page.evaluate(() => {
          const card = document.querySelector('.detail-atelier-thread-list.detail-atelier-mobile-only .detail-atelier-thread-entry')?.getBoundingClientRect()
          const chips = document.querySelector('.detail-atelier-thread-list.detail-atelier-mobile-only .detail-atelier-mobile-thread-corner-chips')?.getBoundingClientRect()

          return {
            cornerChipsRightInset: Math.round((card?.right ?? 0) - (chips?.right ?? 0)),
            cornerChipsTop: Math.round((chips?.top ?? 0) - (card?.top ?? 0)),
            firstThreadHeight: Math.round(card?.height ?? 0),
          }
        })

        expect(compactThreadMetrics.firstThreadHeight).toBeLessThanOrEqual(190)
        expect(compactThreadMetrics.cornerChipsTop).toBeLessThanOrEqual(20)
        expect(compactThreadMetrics.cornerChipsRightInset).toBeLessThanOrEqual(24)
        await page.locator('.detail-atelier-mobile-thread-more-summary').first().click()
      }

      await expect(reactionToggle).toBeVisible()
      await expect(page.locator('.detail-atelier-reaction-list.is-extended .detail-atelier-reaction-button')).toHaveCount(0)

      if (viewport.width <= 430) {
        const metrics = await page.evaluate(() => {
          const primary = document.querySelector('.detail-atelier-action-row .detail-atelier-primary')?.getBoundingClientRect()
          const danger = document.querySelector('.detail-atelier-danger-summary')?.getBoundingClientRect()
          const compactChipRows = Array.from(document.querySelectorAll('.detail-atelier-chip-row.compact')).map((node) => {
            const box = node.getBoundingClientRect()
            return Math.round(box.width)
          })

          return {
            primaryWidth: primary?.width ?? 0,
            dangerTop: danger?.top ?? Number.POSITIVE_INFINITY,
            compactChipRowMaxWidth: compactChipRows.length ? Math.max(...compactChipRows) : 0,
            viewportWidth: window.innerWidth,
          }
        })

        expect(metrics.primaryWidth).toBeGreaterThanOrEqual(150)
        expect(metrics.dangerTop).toBeGreaterThan(0)
        expect(metrics.compactChipRowMaxWidth).toBeLessThanOrEqual(metrics.viewportWidth)
      }

      await reactionToggle.click()
      await expect(page.locator('.detail-atelier-reaction-list.is-extended:visible .detail-atelier-reaction-button').first()).toBeVisible()
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
