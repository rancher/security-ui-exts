/* Filename: sbomscanner_workloads.pom.test.ts
 * Complete POM migration of sbomscanner_workloads.test.ts (5 tests)
 */

import { expect } from "@playwright/test";
import { test } from "../fixture/fixture";
import { DashboardPage } from "../pages/DashboardPage";
import { WorkloadsScanPageEnhanced } from "../pages/WorkloadsScanPageEnhanced";
import { exec } from "child_process";

test.describe("*** SBOMSCANNER UI TEST (Workloads - POM)", () => {
  let dashboardPage: DashboardPage;
  let workloadsPage: WorkloadsScanPageEnhanced;

  test.beforeEach(async ({ page }) => {
    console.log("");
    console.log(" ---------------------- ");
    console.log(" :: Before each test :: ");
    console.log(" ---------------------- ");
    console.log("");

    exec("rm -rf downloads/*", (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });

    // Initialize page objects
    dashboardPage = new DashboardPage(page);
    workloadsPage = new WorkloadsScanPageEnhanced(page);

    await workloadsPage.delay(2000);
  });

  for (let m = 1; m < 6; m++) {
    test(`SBOMSCANNER > WORKLOADS SCAN ELEMENT NAVIGATION #${m}`, async ({ page }, testInfo) => {
      console.log("======================================================================");
      console.log(`Running test ${m}: ${testInfo.title}`);
      console.log("======================================================================");

      // Navigate to home
      await dashboardPage.navigateToHome();
      console.log("URL: " + page.url());
      await dashboardPage.delay(1000);

      // Open Rancher menu
      await dashboardPage.openRancherMenu();
      console.log("");

      // Navigate to Workloads Scan
      await workloadsPage.navigateViaMenu();

      // Verify URL
      await workloadsPage.verifyPageUrl();

      // Check enabled checkbox state
      const checkboxState = await workloadsPage.verifyCheckboxAndGetState();
      console.log(`Test #${m} - Checkbox state: ${checkboxState}`);
    });
  }
});
