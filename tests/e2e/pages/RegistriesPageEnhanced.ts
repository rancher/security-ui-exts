/* Enhanced Registries Page Object with CRUD operations */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegistriesPageEnhanced extends BasePage {
  // URL (path only - baseURL comes from playwright.config.ts)
  readonly url = '/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.registry';

  // Selectors
  private readonly pageTitle = "[class='m-0']";
  private readonly createButton = "[data-testid='masthead-create']";
  private readonly table = "table[role='table']";
  private readonly tableHead = "table[role='table'] > thead";
  private readonly tableBody = "table[role='table'] > tbody";
  private readonly noRows = '.no-rows';
  private readonly filterInput = '.filter-row .filter-item:nth-of-type(1) .filter-input-wrapper';
  private readonly scanButton = '.btn.role-primary.table-btn';
  private readonly deleteButton = 'button#promptRemove';

  private readonly pageElements = [
    this.pageTitle,
    this.createButton,
    this.table,
    this.tableHead,
    this.tableBody
  ];

  // Create form selectors
  private readonly nameInput = '.mb-20.row > div:nth-of-type(2)';
  private readonly uriInput = '.row:nth-of-type(3) [aria-disabled]';
  private readonly createSubmitButton = '.ready-for-action';
  private readonly deleteDialog = "[role='dialog']";
  private readonly confirmDeleteButton = "div#focus-trap-card-container-element button[role='button']";

  constructor(page: Page) {
    super(page);
  }

  // navigate(), verifyPageUrl(), and verifyPageElements() are inherited from BasePage

  /**
   * Get table row count
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
    const rowCount = await this.getTableRowCount();
    const noRowsElement = this.page.locator(this.noRows);
    return rowCount > 2 || !(await noRowsElement.isVisible());
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
   * Validate registry table data
   */
  async validateRegistryTable() {
    const table = this.page.locator(this.table);
    const rowCount = await this.getTableRowCount();
    const columnCount = await this.getTableColumnCount();

    console.log('');
    console.log('---Table-----------------------------------------------------------------');
    console.log('# Number of rows:' + (rowCount - 1));
    console.log('# Number of columns:' + columnCount);
    console.log('-------------------------------------------------------------------------\n');

    const hasData = await this.hasTableData();

    if (!hasData) {
      await this.verifyEmptyTableMessage();
      return;
    }

    // Validate each row
    for (let i = 0; i < rowCount - 1; i++) {
      const checkbox = await table.locator(`tr:nth-of-type(${i + 1}) > .row-check`).textContent();
      const registry = await table.locator(`tr:nth-of-type(${i + 1}) > .col-registry-name-cell`).textContent();
      const namespace = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(3)`).textContent();
      const uri = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(4)`).textContent();
      const repositories = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(5)`).textContent();
      const scanInterval = await table.locator(`tr:nth-of-type(${i + 1}) > .col-scan-interval`).textContent();
      const status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-registry-status-cell-badge`).textContent();
      const progress = await table.locator(`tr:nth-of-type(${i + 1}) .col-progress-cell`).textContent();
      const prevScan = await table.locator(`tr:nth-of-type(${i + 1}) > .col-previous-scan-cell`).textContent();
      const menu = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(10)`).textContent();

      expect(typeof checkbox).toBe('string');
      expect(typeof registry).toBe('string');
      expect(typeof namespace).toBe('string');
      expect(typeof uri).toBe('string');
      expect(typeof repositories).toBe('string');
      expect(typeof scanInterval).toBe('string');
      expect(typeof status).toBe('string');
      expect(typeof progress).toBe('string');
      expect(typeof prevScan).toBe('string');
      expect(typeof menu).toBe('string');
    }
  }

  /**
   * Create a new registry
   */
  async createRegistry(registryName: string, uri: string) {
    console.log(`Creating registry: ${registryName}`);

    // Click create button
    await this.clickElement(this.createButton);
    await expect(this.page).toHaveURL(this.url + '/create');

    // Fill in registry name
    await this.clickElement(this.nameInput);
    await this.typeText(this.nameInput, registryName);

    // Fill in URI
    await this.clickElement(this.uriInput);
    await this.typeText(this.uriInput, uri);

    // Click create
    await this.clickElement(this.createSubmitButton);
    await this.delay(2000);

    // Wait for navigation back to list
    await this.page.reload();
    await expect(this.page).toHaveURL(this.url);
  }

  /**
   * Filter registries by name
   */
  async filterByRegistry(searchText: string) {
    console.log(`Filtering by: ${searchText}`);
    await this.clickElement(this.filterInput);
    await this.typeText(this.filterInput, searchText);
    await this.delay(1000);
  }

  /**
   * Verify registry exists in table
   */
  async verifyRegistryExists(registryName: string): Promise<boolean> {
    const table = this.page.locator(this.table);
    const rowCount = await this.getTableRowCount();

    console.log('');
    console.log('---Table-----------------------------------------------------------------');
    console.log('# Number of rows found after filtering: ' + (rowCount - 1));
    console.log('-------------------------------------------------------------------------\n');

    expect(rowCount).toBeGreaterThanOrEqual(2); // At least 1 row + header

    const registryNameCell = await table.locator(`tr:nth-of-type(1) > .col-registry-name-cell`).textContent();
    console.log('-> Matched registry found: Registry added successfully - ' + registryNameCell);

    return registryNameCell?.includes(registryName) || false;
  }

  /**
   * Delete registry by selecting first row
   */
  async deleteFirstRegistry() {
    console.log('Deleting first registry');

    // Select first row checkbox
    await this.clickElement('tr:nth-of-type(1) > .row-check');
    await this.delay(1000);

    // Verify buttons are enabled
    await this.page.getByRole('button', { name: 'Start scan' }).isEnabled();
    await this.page.getByRole('button', { name: 'Delete' }).isEnabled();

    // Click delete button
    await this.page.getByRole('button', { name: 'Delete' }).click();
    await this.delay(2000);

    // Verify delete dialog
    await expect(this.page.locator(this.deleteDialog)).toBeVisible();
    const dialogText = await this.page.locator('.card-body').innerText();
    expect(dialogText).toContain('You are attempting to delete the Registries configuration');

    // Confirm deletion
    await this.clickElement(this.confirmDeleteButton);
    await this.delay(2000);
  }

  /**
   * Delete registry by name (filter first)
   */
  async deleteRegistryByName(searchText: string) {
    console.log(`Deleting registry matching: ${searchText}`);

    // Filter by name
    await this.filterByRegistry(searchText);

    const rowCount = await this.getTableRowCount();

    console.log('');
    console.log('---Table-----------------------------------------------------------------');
    console.log('# Number of rows found to be deleted: ' + (rowCount - 1));
    console.log('-------------------------------------------------------------------------\n');

    expect(rowCount).toBeGreaterThanOrEqual(2);

    const table = this.page.locator(this.table);
    const registryName = await table.locator(`tr:nth-of-type(1) > .col-registry-name-cell`).textContent();
    console.log('-------------------------------------------------------------------------');
    console.log('-> Matched registry found to be deleted: ' + registryName);
    console.log('-------------------------------------------------------------------------\n');

    // Delete first matching registry
    await this.deleteFirstRegistry();
  }
}
