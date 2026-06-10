/* SBOMScanner Dashboard Page Object */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SBOMScannerDashboardPage extends BasePage {
  // URL (path only - baseURL comes from playwright.config.ts)
  readonly url = '/dashboard/c/local/imageScanner/dashboard';

  // Selectors
  private readonly headerTitle = '.header-section .title';
  private readonly summarySection = '.page > .summary-section';
  private readonly filterDropdown = '.filter-dropdown';
  private readonly scanningStats = '.scanning-stats';
  private readonly scanStatSuccess = '.scanning-stats .scan-stat:nth-of-type(1)';
  private readonly scanStatFailed = '.scanning-stats > .failed.scan-stat';
  private readonly scanStatError = '.scanning-stats > .error.scan-stat';
  private readonly scannerMenu = '.accordion.depth-0.expanded.group-highlight.has-children.package';
  private readonly bannerContent = "[data-testid='banner-content'] div";

  private readonly dashboardElements = [
    this.headerTitle,
    this.summarySection,
    this.filterDropdown,
    this.scanningStats,
    this.scanStatSuccess,
    this.scanStatFailed,
    this.scanStatError
  ];

  constructor(page: Page) {
    super(page);
  }

  // navigate() and verifyPageUrl() are inherited from BasePage

  /**
   * Verify scanner menu screenshot
   */
  async verifyScannerMenuScreenshot() {
    const menu = this.page.locator(this.scannerMenu);
    await expect(menu).toHaveScreenshot('sbom_dashboard_submenu.png', { maxDiffPixels: 300 });
  }

  /**
   * Check if registry scan has been started
   */
  async hasScanStats(): Promise<boolean> {
    const count = await this.page.locator(this.scanningStats).count();
    return count > 0;
  }

  /**
   * Verify dashboard page elements are visible
   */
  async verifyDashboardElements() {
    const hasStats = await this.hasScanStats();

    if (hasStats) {
      console.log('Registry scan stat');
      await this.verifyElementsVisible(this.dashboardElements);
    } else {
      const banner = this.page.locator(this.bannerContent);
      console.log("Registry scan has not started yet.");
      await expect(banner).toContainText("The registry scan has not been started yet. Please add your registry and start scan.");
    }
  }

  /**
   * Navigate to Images page via menu
   */
  async navigateToImages() {
    console.log("-- click Images");
    await this.clickMenu(['Vulnerability Scanner', 'Images']);
    await this.delay(2000);
  }

  /**
   * Navigate to Workloads Scan via menu
   */
  async navigateToWorkloadsScan() {
    console.log("-- click to Workloads Scan");
    await this.clickMenu(['Advanced', 'Workloads Scan']);
    await this.delay(2000);
  }

  /**
   * Navigate to Registries Configuration via menu
   */
  async navigateToRegistriesConfig() {
    console.log("-- click to Reg config");
    await this.delay(2000);
    await this.clickMenu(['Advanced', 'Registries configuration']);
  }

  /**
   * Navigate to VEX Management via menu
   */
  async navigateToVexManagement() {
    console.log("-- click to Vex");
    await this.delay(2000);
    await this.clickMenu(['Advanced', 'Vex Management']);
  }
}
