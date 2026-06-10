/* Filename: sbomscanner_pom_fixture.test.ts
 * Ultimate POM version using fixture-injected page objects
 * This is the cleanest approach - page objects are automatically available
 */

import { test, expect } from "../fixture/fixture";
import { exec } from "child_process";

test.describe("*** SBOMSCANNER DASHBOARD", () => {
  test.describe.configure({ mode: "default" });

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

    await page.waitForTimeout(2000);
  });

  test("SBOMSCANNER > PAGE ELEMENT VALIDATION", async ({
    page,
    dashboardPage,
    sbomDashboardPage
  }, testInfo) => {
    console.log("======================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("======================================================================");

    // Navigate to home first (browser starts at about:blank)
    await dashboardPage.navigateToHome();

    // Then navigate to SBOMScanner
    await dashboardPage.navigateToSBOMScanner();

    // Verify URL
    await sbomDashboardPage.verifyPageUrl();
    console.log("URL: " + page.url());

    // Verify scanner menu screenshot
    await sbomDashboardPage.verifyScannerMenuScreenshot();

    // Verify dashboard elements based on scan status
    await sbomDashboardPage.verifyDashboardElements();

    console.log("");
  });

  test("SBOMSCANNER MENU NAVIGATION", async ({
    page,
    dashboardPage,
    sbomDashboardPage,
    imagesPageEnhanced,
    workloadsScanPageEnhanced,
    registriesPageEnhanced,
    vexManagementPageEnhanced
  }, testInfo) => {
    console.log("======================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("======================================================================");

    // Navigate to home
    await dashboardPage.navigateToHome();
    console.log("URL: " + page.url());

    // Open Rancher menu
    await dashboardPage.openRancherMenu();

    // Navigate to SBOMScanner Dashboard
    console.log("-- click SBOMScanner");
    await sbomDashboardPage.clickMenu(['Vulnerability Scanner']);
    await sbomDashboardPage.delay(2000);
    await sbomDashboardPage.verifyPageUrl();

    // Navigate to Images
    await sbomDashboardPage.navigateToImages();
    await imagesPageEnhanced.verifyPageUrl();

    // Navigate to Workloads Scan
    await workloadsScanPageEnhanced.clickMenu(['Advanced', 'Workloads Scan']);
    await workloadsScanPageEnhanced.verifyPageUrl();

    // Navigate to Registries Config
    await registriesPageEnhanced.delay(2000);
    await registriesPageEnhanced.clickMenu(['Advanced', 'Registries configuration']);
    await registriesPageEnhanced.verifyPageUrl();

    // Navigate to VEX Management
    await vexManagementPageEnhanced.delay(2000);
    await vexManagementPageEnhanced.clickMenu(['Advanced', 'Vex Management']);
    await vexManagementPageEnhanced.verifyPageUrl();
  });
});
