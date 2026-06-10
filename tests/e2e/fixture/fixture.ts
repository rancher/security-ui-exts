/* Filename: fixture-with-pom.ts
 * Enhanced fixture with Page Object Model support
 */

import { test as base, expect } from '@playwright/test';
import {
  DashboardPage,
  SBOMScannerDashboardPage,
  ImagesPageEnhanced,
  RegistriesPageEnhanced,
  VexManagementPageEnhanced,
  WorkloadsScanPageEnhanced
} from '../pages';

type PageObjects = {
  dashboardPage: DashboardPage;
  sbomDashboardPage: SBOMScannerDashboardPage;
  // Enhanced page objects (use these for all tests)
  imagesPageEnhanced: ImagesPageEnhanced;
  registriesPageEnhanced: RegistriesPageEnhanced;
  vexManagementPageEnhanced: VexManagementPageEnhanced;
  workloadsScanPageEnhanced: WorkloadsScanPageEnhanced;
};

export const test = base.extend<PageObjects>({
  page: async ({ page }, use) => {
    const consolelogs: string[] = [];

    // capture errors like failed network calls, etc.
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consolelogs.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    // capture uncaught exceptions error
    page.on('pageerror', (exception) => {
      consolelogs.push(`[${exception.name}] ${exception.message}`);
    });

    await use(page);

    // assertions - can be disabled via SHOW_CONSOLE_ERRORS=false for demo screenshots
    const showConsoleErrors = process.env.SHOW_CONSOLE_ERRORS !== 'false';

    if (showConsoleErrors) {
      console.log("");
      console.log(" ------------------------------------------------------------------------- ");
      console.log(" >>> Captured Browser Console Log Errors <<<  ");
      console.log(" ------------------------------------------------------------------------- ");
      console.log(consolelogs);
      console.log("");
      console.log(" ------------------------------------------------------------------------- ");
      console.log("");
    }

    /* Failed the test if error is captured in the console log */
    // expect(consolelogs).toStrictEqual([]);
    // expect(consolelogs).toHaveLength(0);
  },

  // Provide page objects as fixtures
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  sbomDashboardPage: async ({ page }, use) => {
    await use(new SBOMScannerDashboardPage(page));
  },

  // Enhanced page objects (use these for all tests)
  imagesPageEnhanced: async ({ page }, use) => {
    await use(new ImagesPageEnhanced(page));
  },

  registriesPageEnhanced: async ({ page }, use) => {
    await use(new RegistriesPageEnhanced(page));
  },

  vexManagementPageEnhanced: async ({ page }, use) => {
    await use(new VexManagementPageEnhanced(page));
  },

  workloadsScanPageEnhanced: async ({ page }, use) => {
    await use(new WorkloadsScanPageEnhanced(page));
  },
});

export { expect };
