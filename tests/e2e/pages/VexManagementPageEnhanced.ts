/* Enhanced VEX Management Page Object with comprehensive CRUD operations */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class VexManagementPageEnhanced extends BasePage {
  // URL (path only - baseURL comes from playwright.config.ts)
  readonly url = '/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub';

  // Selectors
  private readonly pageTitle = '.with-subheader';
  private readonly createButton = "[data-testid='masthead-create']";
  private readonly table = "table[role='table']";
  private readonly tableHead = "table[role='table'] > thead";
  private readonly tableBody = "table[role='table'] > tbody";
  private readonly deleteButton = 'button#promptRemove';
  private readonly deleteDialog = "[role='dialog']";
  private readonly confirmDeleteButton = "div#focus-trap-card-container-element button[role='button'] > span";

  private readonly pageElements = [
    this.pageTitle,
    this.table,
    this.tableHead,
    this.tableBody
  ];

  // Create/Edit form selectors
  private readonly nameInput = '.mb-20.row > .col.span-3';
  private readonly descriptionInput = '.mb-20.row > .col.span-6';
  private readonly uriInput = '.col.span-9';
  private readonly enabledCheckbox = ".checkbox-container > [tabindex='0']:nth-child(2)";
  private readonly submitButton = "button[role='button'] > span";
  private readonly saveButton = ".right > button[role='button'] > span";

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
   * Validate VEX table and optionally open action menu
   */
  async validateVexTable(openActionMenu: boolean = false) {
    const table = this.page.locator(this.table);
    const rowCount = await this.getTableRowCount();
    const columnCount = await this.getTableColumnCount();

    console.log('');
    console.log('---Table-----------------------------------------------------------------');
    console.log('# Number of rows:' + (rowCount - 1));
    console.log('# Number of columns:' + columnCount);
    console.log('-------------------------------------------------------------------------\n');

    if (rowCount == 0) {
      console.log('Passed: The empty table displays "There are no rows to show"');
      return;
    }

    // Validate each row
    for (let i = 0; i < rowCount - 1; i++) {
      const checkbox = await table.locator(`tr:nth-of-type(${i + 1}) > .row-check`).textContent();
      const status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent();
      const name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent();
      const uri = await table.locator(`tr:nth-of-type(${i + 1}) > .col-uri-external-link`).textContent();
      const updated = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-date-formatter`).textContent();

      console.log('-> ' + checkbox);
      console.log('-> ' + status);
      console.log('-> ' + name);
      console.log('-> ' + uri);
      console.log('-> ' + updated);

      expect(typeof checkbox).toBe('string');
      expect(typeof status).toBe('string');
      expect(typeof name).toBe('string');
      expect(typeof uri).toBe('string');
      expect(typeof updated).toBe('string');
    }

    // Optionally open first row action menu
    if (openActionMenu) {
      await this.page.locator("tr:nth-of-type(1) button[role='button'] > .icon.icon-actions").click();
      await this.delay(2000);

      const actionMenuItems = [
        '.v-popper__inner',
        "div[role='menu'] > div:nth-of-type(1)",
        "div[role='menu'] > div:nth-of-type(2)",
        "div[role='menu'] > div:nth-of-type(3)",
        "div[role='menu'] > div:nth-of-type(4)",
        "div[role='menu'] > div:nth-of-type(5)"
      ];

      await this.verifyElementsVisible(actionMenuItems);
    }
  }

  /**
   * Create new VEX entry
   */
  async createVex(name: string, description: string, uri: string) {
    console.log(`Creating VEX: ${name}`);

    // Click create
    await this.clickElement(this.createButton);
    await this.delay(2000);
    await expect(this.page).toHaveURL(this.url + '/create');
    await this.delay(2000);

    // Fill form
    await this.page.locator(this.nameInput).click();
    await this.page.locator(this.nameInput).pressSequentially(name);

    await this.page.locator(this.descriptionInput).click();
    await this.page.locator(this.descriptionInput).pressSequentially(description);

    await this.page.locator(this.uriInput).click();
    await this.page.locator(this.uriInput).pressSequentially(uri);

    // Check enabled checkbox state
    const enabledCheckbox = this.page.locator(this.enabledCheckbox);
    const cbValue = await enabledCheckbox.getAttribute('aria-checked');
    console.log(`The checkbox value attribute is: ${cbValue}`);

    if (cbValue == "true" || cbValue == "null") {
      console.log(" --> is checked ");
    } else {
      console.log(" --> is unchecked, check it.");
      await this.delay(1000);
    }

    // Submit
    await this.clickElement(this.submitButton);
    await this.delay(1000);
    await expect(this.page).toHaveURL(this.url);
  }

  /**
   * Get list of all VEX names
   */
  async getVexList(): Promise<string[]> {
    const table = this.page.locator(this.table);
    const rowCount = await this.getTableRowCount();
    const vexList: string[] = [];

    for (let i = 0; i < rowCount - 1; i++) {
      const name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent();
      if (name) {
        vexList.push(name);
      }
    }

    return vexList;
  }

  /**
   * Verify VEX exists in list
   */
  async verifyVexExists(name: string): Promise<boolean> {
    const vexList = await this.getVexList();
    console.log(`VEX list: ${vexList}`);

    const found = vexList.find(item => item === name);

    if (found) {
      console.log(`Array contains the string '${name}'.`);
      console.log('New VEX management created successfully!');
      return true;
    } else {
      console.log(`Array does not contain the string '${name}'.`);
      return false;
    }
  }

  /**
   * Delete VEX by creating it first, then deleting
   */
  async createAndDeleteVex(name: string, description: string, uri: string) {
    // Create VEX
    await this.createVex(name, description, uri);

    // Verify creation
    await this.page.reload();
    await this.delay(2000);
    const exists = await this.verifyVexExists(name);
    expect(exists).toBeTruthy();

    // Delete VEX
    await this.deleteVexByName(name);

    // Verify deletion
    await this.page.reload();
    await this.delay(2000);
    const vexList = await this.getVexList();
    const stillExists = vexList.find(item => item === name);

    if (!stillExists) {
      console.log(`VEX '${name}' deleted successfully!`);
    } else {
      throw new Error(`Delete VEX test failed! VEX '${name}' still exists.`);
    }
  }

  /**
   * Delete VEX by name (finds and deletes)
   */
  async deleteVexByName(name: string) {
    const table = this.page.locator(this.table);
    const rowCount = await this.getTableRowCount();

    for (let i = 0; i < rowCount - 2; i++) {
      const rowName = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent();

      if (rowName === name) {
        await table.locator(`tr:nth-of-type(${i + 1}) > .row-check`).click();
        await this.page.locator(this.deleteButton).click();
        await this.delay(1000);

        await expect(this.page.locator(this.deleteDialog)).toBeVisible();
        const dialogText = await this.page.locator('.card-body').innerText();
        expect(dialogText).toContain('You are attempting to delete the Vex Management ' + name);

        await this.clickElement(this.confirmDeleteButton);
        break;
      }
    }
  }

  /**
   * Delete multiple VEX entries (first N rows)
   */
  async deleteMultipleVex(count: number) {
    const rowCount = await this.getTableRowCount();

    if (rowCount < count + 1) {
      throw new Error(`Not enough rows to delete ${count} VEX entries`);
    }

    // Select multiple rows
    for (let i = 1; i <= count; i++) {
      await this.page.locator(`tr:nth-of-type(${i}) > .row-check`).click();
      await this.delay(2000);
    }

    // Delete
    await this.page.locator(this.deleteButton).click();
    await this.delay(1000);
    await expect(this.page.locator(this.deleteDialog)).toBeVisible();

    const dialogText = await this.page.locator('.card-body').innerText();
    expect(dialogText).toContain('You are attempting to delete the Vex Management');

    await this.clickElement(this.confirmDeleteButton);
  }

  /**
   * Toggle VEX status (enable/disable) via 3-dot menu
   */
  async toggleVexStatus(rowIndex: number = 1) {
    const table = this.page.locator(this.table);
    const rowName = await table.locator(`tr:nth-of-type(${rowIndex}) > .col-vex-name-link`).textContent();
    const rowStatus = await table.locator(`tr:nth-of-type(${rowIndex}) > .col-vex-status-cell-badge`).textContent();
    const actionButton = table.locator(`tr:nth-of-type(${rowIndex}) button[role='button'] > .icon.icon-actions`);

    await table.locator(`tr:nth-of-type(${rowIndex}) > .row-check`).click();
    await actionButton.click();
    await this.delay(1000);

    // Click first menu item (toggle status)
    await this.clickElement("div[role='menu'] > div:nth-of-type(1)");
    await this.delay(2000);

    await this.page.reload();

    // Verify status changed
    const newStatus = await table.locator(`tr:nth-of-type(${rowIndex}) > .col-vex-status-cell-badge`).textContent();
    console.log(`Status changed from ${rowStatus} to ${newStatus}`);
  }

  /**
   * Clone VEX entry
   */
  async cloneVex(sourceRowIndex: number, cloneName: string, cloneDescription: string) {
    const table = this.page.locator(this.table);
    const sourceName = await table.locator(`tr:nth-of-type(${sourceRowIndex}) > .col-vex-name-link`).textContent();
    const sourceUri = await table.locator(`tr:nth-of-type(${sourceRowIndex}) > .col-uri-external-link`).textContent();
    const sourceStatus = await table.locator(`tr:nth-of-type(${sourceRowIndex}) > .col-vex-status-cell-badge`).textContent();

    const actionButton = table.locator(`tr:nth-of-type(${sourceRowIndex}) button[role='button'] > .icon.icon-actions`);

    await table.locator(`tr:nth-of-type(${sourceRowIndex}) > .row-check`).click();
    await actionButton.click();
    await this.delay(1000);

    // Click clone button (different position based on status)
    const cloneMenuIndex = sourceStatus === "Enabled" ? 4 : 2;
    await this.clickElement(`div[role='menu'] > div:nth-of-type(${cloneMenuIndex})`);
    await this.delay(1000);

    await expect(this.page).toHaveURL(this.url + '/' + sourceName + '?mode=clone');
    await this.delay(2000);

    // Fill clone form
    await this.clickElement("[data-testid='NameNsDescriptionNameInput']");
    await this.typeText("[data-testid='NameNsDescriptionNameInput']", cloneName);

    await this.clickElement('.col.span-6 > .create.labeled-input');
    await this.typeText('.col.span-6 > .create.labeled-input', cloneDescription);

    // Verify URI matches
    const uriElement = this.page.locator("[class='col span-9'] [aria-disabled]");
    const uriValue = await uriElement.getAttribute('value');

    console.log('from table: ' + sourceUri);
    console.log('from clone: ' + uriValue);

    if (sourceUri?.trim() === uriValue?.trim()) {
      console.log(`Passed: ${sourceUri} is comparable to ${uriValue}`);
    } else {
      throw new Error(`Failed: The clone uri has incomparable string ${sourceUri} and ${uriValue}`);
    }

    // Submit clone
    await this.clickElement(this.submitButton);
    await this.delay(1000);
  }

  /**
   * Edit VEX configuration
   */
  async editVexConfiguration(rowIndex: number, newUri: string) {
    const table = this.page.locator(this.table);
    const vexName = await table.locator(`tr:nth-of-type(${rowIndex}) > .col-vex-name-link`).textContent();
    const vexStatus = await table.locator(`tr:nth-of-type(${rowIndex}) > .col-vex-status-cell-badge`).textContent();
    const actionButton = table.locator(`tr:nth-of-type(${rowIndex}) button[role='button'] > .icon.icon-actions`);

    await table.locator(`tr:nth-of-type(${rowIndex}) > .row-check`).click();
    await actionButton.click();
    await this.delay(1000);

    // If disabled, enable first
    if (vexStatus === "Disabled") {
      await this.clickElement("div[role='menu'] > div:nth-of-type(1)");
      await this.delay(2000);
      await actionButton.click();
    }

    // Click Edit Configuration
    await this.clickElement("div[role='menu'] > div:nth-of-type(2)");
    await this.delay(1000);

    await expect(this.page).toHaveURL(this.url + '/' + vexName + '?mode=edit');
    await this.delay(2000);

    // Edit URI
    await this.clickElement("[class='col span-9'] [aria-disabled]");
    await this.page.locator("[class='col span-9'] [aria-disabled]").selectText();
    await this.typeText("[class='col span-9'] [aria-disabled]", newUri);

    // Save
    await this.clickElement(this.submitButton);
    await this.delay(1000);
  }

  /**
   * Edit VEX YAML
   */
  async editVexYAML(rowIndex: number) {
    const table = this.page.locator(this.table);
    const vexName = await table.locator(`tr:nth-of-type(${rowIndex}) > .col-vex-name-link`).textContent();
    const vexStatus = await table.locator(`tr:nth-of-type(${rowIndex}) > .col-vex-status-cell-badge`).textContent();
    const actionButton = table.locator(`tr:nth-of-type(${rowIndex}) button[role='button'] > .icon.icon-actions`);

    await table.locator(`tr:nth-of-type(${rowIndex}) > .row-check`).click();
    await actionButton.click();
    await this.delay(1000);

    // If disabled, enable first
    if (vexStatus === "Disabled") {
      await this.clickElement("div[role='menu'] > div:nth-of-type(1)");
      await this.delay(2000);
      await actionButton.click();
    }

    // Click Edit YAML
    await this.clickElement("div[role='menu'] > div:nth-of-type(3)");
    await this.delay(1000);

    await expect(this.page).toHaveURL(this.url + '/' + vexName + '?mode=edit&as=yaml');
    await this.delay(2000);

    // Save (no changes)
    await this.clickElement(this.saveButton);
    await this.delay(1000);

    await this.page.reload();
  }

  /**
   * Delete VEX from 3-dot menu
   */
  async deleteVexFromMenu(rowIndex: number) {
    const table = this.page.locator(this.table);
    const vexName = await table.locator(`tr:nth-of-type(${rowIndex}) > .col-vex-name-link`).textContent();
    const vexStatus = await table.locator(`tr:nth-of-type(${rowIndex}) > .col-vex-status-cell-badge`).textContent();
    const actionButton = table.locator(`tr:nth-of-type(${rowIndex}) button[role='button'] > .icon.icon-actions`);

    await table.locator(`tr:nth-of-type(${rowIndex}) > .row-check`).click();
    await actionButton.click();
    await this.delay(1000);

    // If disabled, enable first
    if (vexStatus === "Disabled") {
      await this.clickElement("div[role='menu'] > div:nth-of-type(1)");
      await this.delay(2000);
      await actionButton.click();
      await this.delay(1000);
    }

    // Click Delete (position 5 for enabled)
    await this.clickElement("div[role='menu'] > div:nth-of-type(5)");
    await this.delay(2000);

    await expect(this.page.locator(this.deleteDialog)).toBeVisible();
    const dialogText = await this.page.locator('.card-body').innerText();
    expect(dialogText).toContain('You are attempting to delete the Vex Management');

    await this.clickElement(this.confirmDeleteButton);
    await this.page.reload();

    // Verify deletion
    const vexList = await this.getVexList();
    const stillExists = vexList.find(item => item === vexName);

    if (stillExists) {
      throw new Error(`Delete from menu failed! VEX '${vexName}' still exists.`);
    }

    console.log(`VEX '${vexName}' deleted successfully from menu`);
  }
}
