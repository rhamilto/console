import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class OverviewPage extends BasePage {
  private readonly controlPlaneSection = this.page.getByTestId('Control Plane');

  /**
   * Navigate to the Overview page
   */
  async navigateToOverview(): Promise<void> {
    await this.goTo('/overview');
    await this.waitForLoadingComplete();
  }

  /**
   * Get the Control Plane section locator
   */
  getControlPlaneSection(): Locator {
    return this.controlPlaneSection;
  }

  /**
   * Navigate to Overview via sidebar navigation
   */
  async navigateViaNav(): Promise<void> {
    // Wait for any ongoing navigation or loading to complete
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {
      // Page might already be idle
    });
    await this.waitForLoadingComplete();

    // Click Home in sidebar
    const homeButton = this.page.getByRole('button', { name: 'Home' });
    await this.robustClick(homeButton);

    // Click Overview in the expanded section
    const overviewLink = this.page.getByRole('link', { name: 'Overview' });
    await this.robustClick(overviewLink);

    await this.waitForLoadingComplete();
  }
}
