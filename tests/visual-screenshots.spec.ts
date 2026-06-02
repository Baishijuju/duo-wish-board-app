import { expect, test } from '@playwright/test'

const pages = [
  { name: 'home', path: '/' },
  { name: 'list', path: '/list' },
  { name: 'compose', path: '/compose' },
  { name: 'wish-detail', path: '/wish/wish-shared-trip' },
  { name: 'review', path: '/review' },
  { name: 'space', path: '/space' },
]

const viewports = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'iphone-390x844', width: 390, height: 844 },
]

test.describe('official page screenshots', () => {
  for (const viewport of viewports) {
    for (const targetPage of pages) {
      test(`${targetPage.name} at ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto(targetPage.path)
        await expect(page.locator('#app')).toBeVisible()

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

        await page.screenshot({
          path: `playwright-screenshots/${viewport.name}/${targetPage.name}.png`,
          fullPage: true,
          animations: 'disabled',
          caret: 'hide',
        })
      })
    }
  }
})