import type { Page } from '@playwright/test';
import { test, expect } from '../../../fixtures';

const PSEUDO_LOCALIZED_PATTERN = /\[[^a-zA-Z]+\]/;

const dashboardUrl = '/dashboards?pseudolocalization=true&lng=en';

async function expectPseudoLocalized(page: Page, testId: string) {
  const elements = page.getByTestId(testId);
  const count = await elements.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const text = await elements.nth(i).textContent();
    if (text && text.length > 0) {
      expect(text).toMatch(PSEUDO_LOCALIZED_PATTERN);
    }
  }
}

test.describe('Pseudolocalization', { tag: ['@admin'] }, () => {
  test.use({ locale: 'en' });

  test('pseudolocalizes dashboard masthead, activity card, and utilization card', async ({
    page,
  }) => {
    await page.goto(dashboardUrl);
    await page.waitForLoadState('networkidle');

    await test.step('Verify masthead help menu is pseudolocalized', async () => {
      await page.getByTestId('help-dropdown-toggle').click();

      const dropdown = page.getByTestId('help-dropdown');
      const menus = dropdown.locator('ul[role="menu"]');
      await expect(menus).toHaveCount(2);

      const menuItems = dropdown.getByTestId('application-launcher-item');
      const count = await menuItems.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const text = await menuItems.nth(i).textContent();
        if (text && text.length > 0) {
          expect(text).toMatch(PSEUDO_LOCALIZED_PATTERN);
        }
      }

      await page.getByTestId('help-dropdown-toggle').click();
    });

    await test.step('Verify activity card is pseudolocalized', async () => {
      await expectPseudoLocalized(page, 'activity');
      await expectPseudoLocalized(page, 'activity-recent-title');
      await expectPseudoLocalized(page, 'ongoing-title');
      await expectPseudoLocalized(page, 'events-view-all-link');
      await expectPseudoLocalized(page, 'events-pause-button');
    });

    await test.step('Verify utilization card is pseudolocalized', async () => {
      const utilizationCard = page.getByTestId('utilization-card');
      await expect(utilizationCard).toBeVisible();

      const title = utilizationCard.getByTestId('utilization-card__title');
      await expect(title).toHaveText(PSEUDO_LOCALIZED_PATTERN);

      const itemTexts = utilizationCard.getByTestId('utilization-card-item-text');
      const count = await itemTexts.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const text = await itemTexts.nth(i).textContent();
        if (text && text.length > 0) {
          expect(text).toMatch(PSEUDO_LOCALIZED_PATTERN);
        }
      }
    });
  });
});
