/* Enhanced Images Page Object with comprehensive methods */

import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import * as fs from 'fs';

export class ImagesPageEnhanced extends BasePage {
  // URL (path only - baseURL comes from playwright.config.ts)
  readonly url = '/dashboard/c/local/imageScanner/images';

  // Selectors
  private readonly pageTitle = '.page .title';
  private readonly filterRow = '.filter-row';
  private readonly tableLayout = '.main-layout > div > div:nth-of-type(3)';
  private readonly downloadFullReportBtn = 'div:nth-of-type(1) > .btn.role-primary';
  private readonly downloadCustomReportBtn = 'div:nth-of-type(2) > .btn.role-primary';
  private readonly table = "table[role='table']";
  private readonly tableHead = "table[role='table'] > thead";
  private readonly tableBody = "table[role='table'] > tbody";
  private readonly noRows = '.no-rows';
  private readonly selectAllCheckbox = '.check .checkbox-custom';

  private readonly pageElements = [
    this.pageTitle,
    this.filterRow,
    this.tableLayout,
    this.downloadFullReportBtn,
    this.downloadCustomReportBtn,
    this.table,
    this.tableHead,
    this.tableBody
  ];

  constructor(page: Page) {
    super(page);
  }

  // navigate(), verifyPageUrl(), and verifyPageElements() are inherited from BasePage

  /**
   * Get table row count (excluding header)
   */
  async getTableRowCount(): Promise<number> {
    const rows = this.page.locator(`${this.tableBody} tr`);
    return await rows.count();
  }

  /**
   * Get table column count
   */
  async getTableColumnCount(): Promise<number> {
    const columns = this.page.locator(`${this.tableHead} th`);
    return await columns.count();
  }

  /**
   * Check if table has data
   */
  async hasTableData(): Promise<boolean> {
    const noRowsElement = this.page.locator(this.noRows);
    return !(await noRowsElement.isVisible());
  }

  /**
   * Verify empty table message
   */
  async verifyEmptyTableMessage() {
    const textContent = await this.getTextContent('td > span');
    const isCorrect = textContent === 'There are no rows to show.';

    if (!isCorrect) {
      throw new Error('Failed - Table displays incomparable string to "There are no rows to show"');
    }
    console.log('Passed: The empty table displays "There are no rows to show"');
  }

  /**
   * Validate table data - checks all rows and columns
   */
  async validateTableData() {
    const table = this.page.locator(this.table);
    const rowCount = await this.getTableRowCount();
    const columnCount = await this.getTableColumnCount();

    console.log('');
    console.log('---Table-----------------------------------------------------------------');
    console.log('# Number of rows:' + (rowCount - 1)); // eliminate header
    console.log('# Number of columns:' + columnCount);
    console.log('-------------------------------------------------------------------------\n');

    const hasData = await this.hasTableData();

    if (!hasData) {
      await this.verifyEmptyTableMessage();
      return;
    }

    // Loop through each row and validate data types
    for (let i = 0; i < rowCount - 1; i++) {
      const imageCheckbox = await table.locator(`tr:nth-of-type(${i + 1}) > .row-check`).textContent();
      const imageReference = await table.locator(`tr:nth-of-type(${i + 1}) > .col-image-name-cell`).textContent();

      const cveCritical = await table.locator(`tr:nth-of-type(${i + 1}) > .col-identified-cves-cell > div .badge`).nth(0).textContent();
      const cveHigh = await table.locator(`tr:nth-of-type(${i + 1}) > .col-identified-cves-cell > div .badge`).nth(1).textContent();
      const cveMedium = await table.locator(`tr:nth-of-type(${i + 1}) > .col-identified-cves-cell > div .badge`).nth(2).textContent();
      const cveLow = await table.locator(`tr:nth-of-type(${i + 1}) > .col-identified-cves-cell > div .badge`).nth(3).textContent();
      const cveUnknown = await table.locator(`tr:nth-of-type(${i + 1}) > .col-identified-cves-cell > div .badge`).nth(4).textContent();

      const imageId = await table.locator(`tr:nth-of-type(${i + 1}) > .col-image-id-cell`).textContent();
      const imageRegistry = await table.locator(`tr:nth-of-type(${i + 1}) > .col-registry-cell-link`).textContent();
      const imageRepository = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(6)`).textContent();
      const imagePlatform = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(7)`).textContent();
      const imageDownload = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(8)`).textContent();

      // Convert CVE strings to numbers
      const crVal = Number(cveCritical);
      const hiVal = Number(cveHigh);
      const meVal = Number(cveMedium);
      const loVal = Number(cveLow);
      const unVal = Number(cveUnknown);

      console.log(`ROW ${i} == ${crVal} - ${hiVal} - ${meVal} - ${loVal} - ${unVal}`);

      // Assertions
      expect(typeof imageCheckbox).toBe('string');
      expect(typeof imageReference).toBe('string');
      expect(crVal).toBeGreaterThanOrEqual(0);
      expect(hiVal).toBeGreaterThanOrEqual(0);
      expect(meVal).toBeGreaterThanOrEqual(0);
      expect(loVal).toBeGreaterThanOrEqual(0);
      expect(unVal).toBeGreaterThanOrEqual(0);
      expect(typeof imageId).toBe('string');
      expect(typeof imageRegistry).toBe('string');
      expect(typeof imageRepository).toBe('string');
      expect(typeof imagePlatform).toBe('string');
      expect(typeof imageDownload).toBe('string');
    }
  }

  /**
   * Click select all checkbox and validate all rows are selected
   */
  async selectAllAndValidate() {
    const table = this.page.locator(this.table);
    const rowCount = await this.getTableRowCount();

    const hasData = await this.hasTableData();
    if (!hasData) {
      await this.verifyEmptyTableMessage();
      return;
    }

    // Click select all checkbox
    await this.clickElement(this.selectAllCheckbox);
    await this.delay(1000);

    // Validate each row is checked
    for (let i = 0; i < rowCount - 2; i++) {
      const checkbox = table.locator(`tbody .main-row:nth-of-type(${i + 1}) .checkbox-custom`);
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
      await expect(checkbox).toHaveAttribute('role', 'checkbox');
    }
  }

  /**
   * Click each checkbox individually and validate
   */
  async validateIndividualCheckboxes() {
    const table = this.page.locator(this.table);
    const rowCount = await this.getTableRowCount();

    const hasData = await this.hasTableData();
    if (!hasData) {
      await this.verifyEmptyTableMessage();
      return;
    }

    await this.delay(1000);

    // Check each checkbox
    for (let i = 0; i < rowCount - 2; i++) {
      await this.clickElement(`tbody .main-row:nth-of-type(${i + 1}) .checkbox-custom`);
      const checkbox = table.locator(`tbody .main-row:nth-of-type(${i + 1}) .checkbox-custom`);

      await expect(checkbox).toBeChecked();
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
      await expect(checkbox).toHaveAttribute('role', 'checkbox');
    }

    await this.delay(1000);

    // Uncheck each checkbox
    for (let i = 0; i < rowCount - 2; i++) {
      await this.clickElement(`tbody .main-row:nth-of-type(${i + 1}) .checkbox-custom`);
      const checkbox = table.locator(`tbody .main-row:nth-of-type(${i + 1}) .checkbox-custom`);

      await expect(checkbox).not.toBeChecked();
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
      await expect(checkbox).toHaveAttribute('role', 'checkbox');
    }
  }

  /**
   * Download JSON report from first row
   */
  async downloadFirstRowJSONReport() {
    const table = this.page.locator(this.table);
    const hasData = await this.hasTableData();

    if (!hasData) {
      await this.verifyEmptyTableMessage();
      return;
    }

    // Click three dots action
    await table.locator(`tr:nth-of-type(1) button[role='button']`).click();
    await this.delay(1000);

    const downloadPromise = this.page.waitForEvent('download');

    // Click Vulnerability report (JSON)
    await table.locator("div[role='menu'] > div:nth-of-type(3)").click();
    await this.delay(3000);

    const download = await downloadPromise;
    const filePath = 'downloads/' + download.suggestedFilename();

    await download.saveAs(filePath);
    expect(fs.existsSync(filePath)).toBeTruthy();

    const stats = await fs.promises.stat(filePath);
    expect(stats.size).toBeGreaterThan(0);

    console.log(`Downloaded JSON report: ${filePath}, Size: ${stats.size} bytes`);
  }
}
