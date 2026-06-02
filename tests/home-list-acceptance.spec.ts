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
  const overflow = await page.evaluate(() => {
    const root = document.documentElement
    return root.scrollWidth - root.clientWidth
  })

  expect(overflow).toBeLessThanOrEqual(1)
}

test.describe('home and list visual acceptance', () => {
  for (const viewport of viewports) {
    test(`home has one clear first-screen flow at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      await expect(page.locator('#app')).toBeVisible()
      await disableMotion(page)
      await expectNoHorizontalOverflow(page)

      const title = page.locator('.atelier-hero-copy h1')
      const primaryFocus = page.locator('.priority-card.is-primary-focus')
      const bottleCard = page.locator('.wish-bottle-card').first()

      await expect(title).toBeVisible()
      await expect(primaryFocus).toBeVisible()
      await expect(bottleCard).toBeVisible()

      if (viewport.width <= 430) {
        const metrics = await page.evaluate(() => {
          const titleBox = document.querySelector('.atelier-hero-copy h1')?.getBoundingClientRect()
          const primaryBox = document.querySelector('.priority-card.is-primary-focus')?.getBoundingClientRect()
          const bottleBox = document.querySelector('.wish-bottle-card')?.getBoundingClientRect()

          return {
            titleTop: titleBox?.top ?? Number.POSITIVE_INFINITY,
            primaryTop: primaryBox?.top ?? Number.POSITIVE_INFINITY,
            primaryBottom: primaryBox?.bottom ?? Number.POSITIVE_INFINITY,
            bottleTop: bottleBox?.top ?? Number.POSITIVE_INFINITY,
            viewportHeight: window.innerHeight,
          }
        })

        expect(metrics.titleTop).toBeGreaterThanOrEqual(0)
        expect(metrics.primaryTop).toBeLessThan(metrics.viewportHeight)
        expect(metrics.primaryBottom).toBeLessThan(metrics.viewportHeight + 160)
        expect(metrics.bottleTop).toBeLessThan(metrics.viewportHeight + 120)
      }
    })

    test(`list remains scannable at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/list')
      await expect(page.locator('#app')).toBeVisible()
      await disableMotion(page)
      await expectNoHorizontalOverflow(page)

      await expect(page.locator('.list-board-filter-row').first()).toBeVisible()
      await expect(page.locator('.list-board-item').first()).toBeVisible()

      if (viewport.width <= 430) {
        const metrics = await page.evaluate(() => {
          const filterWidths = Array.from(document.querySelectorAll('.list-board-filter-pill')).map((node) =>
            Math.round(node.getBoundingClientRect().width),
          )
          const firstCard = document.querySelector('.list-board-item')?.getBoundingClientRect()
          const firstAction = document.querySelector('.list-board-card-actions .list-board-action')?.getBoundingClientRect()

          return {
            minFilterWidth: Math.min(...filterWidths),
            firstCardWidth: firstCard?.width ?? 0,
            firstActionWidth: firstAction?.width ?? 0,
          }
        })

        expect(metrics.minFilterWidth).toBeGreaterThanOrEqual(62)
        expect(metrics.firstCardWidth).toBeGreaterThanOrEqual(330)
        expect(metrics.firstActionWidth).toBeGreaterThanOrEqual(150)
      }
    })
  }
})