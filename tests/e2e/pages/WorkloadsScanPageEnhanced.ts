/* Enhanced Workloads Scan Page Object */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class WorkloadsScanPageEnhanced extends BasePage {
  // URL (path only - baseURL comes from playwright.config.ts)
  readonly url = '/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.workloadscanconfiguration/default?mode=edit';

  // Selectors
  private readonly enabledCheckbox = ".col.span-12 > .checkbox-outer-container.has-clean-tooltip span[role='checkbox']";

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to Workloads Scan via menu
   */
  async navigateViaMenu() {
    console.log(" - click to Workloads Scan");
    await this.clickMenu(['SBOMScanner', 'Advanced', 'Workloads Scan']);
    await this.delay(2000);
  }

  // navigate() and verifyPageUrl() are inherited from BasePage

  /**
   * Get enabled checkbox state
   */
  async getEnabledCheckboxState(): Promise<string | null> {
    const checkbox = this.page.locator(this.enabledCheckbox);
    const value = await checkbox.getAttribute('aria-checked');
    console.log("enabled checkbox value: " + value);
    console.log("");
    return value;
  }

  /**
   * Verify checkbox is visible and get its state
   */
  async verifyCheckboxAndGetState(): Promise<string | null> {
    const checkbox = this.page.locator(this.enabledCheckbox);
    await expect(checkbox).toBeVisible();
    return await this.getEnabledCheckboxState();
  }
}
