/* Dashboard Page Object */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  // Selectors
  private readonly clusterMenu = () => this.page.getByTestId('menu-cluster-local');
  private readonly sbomScannerLink = 'span:has-text("Vulnerability Scanner")';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to Rancher home dashboard
   */
  async navigateToHome() {
    await this.navigateTo('/dashboard/home');
    await this.delay(3000);
    console.log("URL: " + this.page.url());
  }

  /**
   * Navigate to SBOMScanner from home dashboard
   */
  async navigateToSBOMScanner() {
    console.log("-- Navigating to SBOMScanner");
    await this.clusterMenu().click();
    await this.clickElement(this.sbomScannerLink);
    await this.delay(2000);
  }

  /**
   * Open the Rancher menu
   */
  async openRancherMenu() {
    await this.clusterMenu().click();
    await this.delay(2000);
  }
}
