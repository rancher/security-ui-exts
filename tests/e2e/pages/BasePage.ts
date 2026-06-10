/* Base Page Object */

import { Page, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL path
   */
  async navigateTo(path: string) {
    console.log(`=> Navigate to URL ${path} ......`);
    await this.page.goto(path);
  }

  /**
   * Wait/delay for specified milliseconds
   */
  async delay(ms: number): Promise<void> {
    console.log(`=> Delay timeout for ${ms} milliseconds ......`);
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Click an element by selector
   */
  async clickElement(selector: string) {
    console.log(`=> User click element "${selector}"`);
    await this.page.click(selector);
  }

  /**
   * Click by text content
   */
  async clickByText(text: string) {
    console.log(`=> User click string "${text}"`);
    await this.page.getByText(text).click();
  }

  /**
   * Type text with delay between keystrokes
   */
  async typeText(selector: string, text: string) {
    console.log(`=> User Press key string "${text}"`);
    await this.page.locator(selector).pressSequentially(text, { delay: 100 });
  }

  /**
   * Verify elements are visible
   */
  async verifyElementsVisible(selectors: string[]) {
    for (const selector of selectors) {
      if (selector !== undefined && selector !== null) {
        console.log(`=> Locator "${selector}" is loaded and visible.`);
        await expect(this.page.locator(selector)).toBeVisible();
      } else {
        console.log(`>>> Element "${selector}" fails to load and visible!`);
        throw new Error(`>>> Element "${selector}" fails to load and visible!`);
      }
    }
  }

  /**
   * Get inner text of an element
   */
  async getInnerText(selector: string): Promise<string> {
    const locator = this.page.locator(selector);
    console.log("=> Retrieve the element visible string");
    const innerText = await locator.innerText();
    console.log('=> Inner Text: ', innerText);
    return innerText;
  }

  /**
   * Get text content of an element
   */
  async getTextContent(selector: string): Promise<string> {
    const locator = this.page.locator(selector);
    console.log("Retrieve the element Content");
    const textContent = await locator.textContent();
    console.log('=> Text Content: ', textContent);
    return textContent || '';
  }

  /**
   * Navigate through menu hierarchy
   */
  async clickMenu(path: string[]) {
    for (let i = 0; i < path.length; i++) {
      const name = path[i];
      const isLast = i === path.length - 1;

      // Try link first (clickable menu item)
      const link = this.page.getByRole('link', { name });

      if (await link.count() > 0 && isLast) {
        await link.first().click();
        return;
      }

      // Otherwise treat as expandable header
      const button = this.page.getByRole('button', { name });

      if (await button.count() === 0) {
        throw new Error(`Menu "${name}" not found`);
      }

      const expanded = await button.first().getAttribute('aria-expanded');

      if (expanded === 'false') {
        await button.first().click();
      }

      // wait to allow DOM to render children
      await this.page.waitForTimeout(1000);
    }

    // If last item wasn't clicked yet (edge case)
    const last = path[path.length - 1];
    await this.page.getByRole('link', { name: last }).first().click();
  }

  /**
   * Navigate to the page's default URL
   * Child classes should define a readonly 'url' property (path only, e.g., '/dashboard/...')
   */
  async navigate() {
    const pageUrl = (this as any).url;
    if (!pageUrl) {
      throw new Error('Page class must define a "url" property to use navigate()');
    }
    await this.navigateTo(pageUrl);
    await this.delay(2000);
  }

  /**
   * Verify current URL matches expected URL
   * If no URL provided, uses the page's default 'url' property
   */
  async verifyPageUrl(expectedUrl?: string) {
    const urlToVerify = expectedUrl || (this as any).url;
    if (!urlToVerify) {
      throw new Error('Either provide a URL or define a "url" property on the page class');
    }
    expect(this.page).toHaveURL(urlToVerify);
  }

  /**
   * Verify page elements are visible
   * Child classes should define a 'pageElements' property
   */
  async verifyPageElements() {
    const elements = (this as any).pageElements;
    if (!elements) {
      throw new Error('Page class must define a "pageElements" property to use verifyPageElements()');
    }
    await this.verifyElementsVisible(elements);
  }
}
