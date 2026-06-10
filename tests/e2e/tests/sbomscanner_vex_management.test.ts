/* Filename: sbomscanner_vex_management.pom.test.ts
 * Complete POM migration of sbomscanner_vex_management.test.ts (8 tests)
 */

import { expect } from "@playwright/test";
import { test } from "../fixture/fixture";
import { VexManagementPageEnhanced } from "../pages/VexManagementPageEnhanced";

// Import utility functions
const { generateRandomString, sharedValue } = require('../utils/commands.ts');

test.describe("*** SBOMSCANNER UI TEST (VEX Management - POM)", () => {
  test.describe.configure({ mode: "default" });

  let vexPage: VexManagementPageEnhanced;

  test.beforeEach(async ({ page }) => {
    console.log("");
    console.log(" ----------------------");
    console.log(" :: Before each test ::");
    console.log(" ----------------------");
    console.log("");

    // Initialize page object
    vexPage = new VexManagementPageEnhanced(page);

    // Navigate to VEX Management page
    await vexPage.navigate();
  });

  test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT", async ({ page }, testInfo) => {
    console.log("================================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("================================================================================");

    await vexPage.delay(3000);
    console.log("URL: " + page.url());
    await vexPage.delay(1000);

    // Verify URL
    await vexPage.verifyPageUrl();
    console.log("");

    // Verify page elements
    await vexPage.verifyPageElements();

    // Validate VEX table and open action menu
    await vexPage.validateVexTable(true);
  });

  // Create VEX tests - loop 3 times
  for (let m = 0; m < 3; m++) {
    test(`SBOMSCANNER > ADVANCES > VEX MANAGEMENT > CREATE #${m + 1}`, async ({ page }, testInfo) => {
      const randstr = await generateRandomString(5);
      const vexName = sharedValue + randstr;

      console.log("================================================================================");
      console.log(`Running test: ${testInfo.title}`);
      console.log("================================================================================");

      await vexPage.delay(3000);
      console.log("URL: " + page.url());
      await vexPage.delay(1000);

      // Verify URL
      await vexPage.verifyPageUrl();
      console.log("");

      // Verify page elements
      await vexPage.verifyPageElements();

      // Create new VEX
      await vexPage.createVex(
        vexName,
        "this is a test for ui automation",
        "https://github.com/rancher/vexhub"
      );

      // Verify creation
      const exists = await vexPage.verifyVexExists(vexName);
      expect(exists).toBeTruthy();
    });
  }

  test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > DELETE", async ({ page }, testInfo) => {
    const randstr = await generateRandomString(5);
    const vexName = sharedValue + randstr;

    console.log("================================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("================================================================================");

    await vexPage.delay(3000);
    console.log("URL: " + page.url());
    await vexPage.delay(1000);

    // Verify URL
    await vexPage.verifyPageUrl();
    console.log("");

    // Verify page elements
    await vexPage.verifyPageElements();

    // Create and then delete VEX
    await vexPage.createAndDeleteVex(
      vexName,
      "this is a test for ui automation",
      "https://github.com/rancher/vexhub"
    );
  });

  test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > DELETE MULTIPLE", async ({ page }, testInfo) => {
    console.log("================================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("================================================================================");

    await vexPage.delay(3000);
    console.log("URL: " + page.url());
    await vexPage.delay(1000);

    // Verify URL
    await vexPage.verifyPageUrl();
    console.log("");

    // Verify page elements
    await vexPage.verifyPageElements();

    // Get row count before deletion
    const rowCountBefore = await vexPage.getTableRowCount();
    console.log("--- < Table Before Multiple Delete >-----------------------------------------------------------------");
    console.log("# Number of rows:" + (rowCountBefore - 1));
    console.log("--------------------------------------------------------------------------------------------");
    console.log("");

    // Delete first 2 VEX entries
    await vexPage.deleteMultipleVex(2);

    // Verify deletion
    await vexPage.delay(2000);
    await page.reload();
    await vexPage.delay(2000);

    const rowCountAfter = await vexPage.getTableRowCount();
    console.log("--- < Table After Multiple Delete > ---------------------------------------------------------------");
    console.log("# Number of rows after multiple deletion:" + (rowCountAfter - 1));
    console.log("------------------------------------------------------------------------------------------");
    console.log("");

    console.log("Before multiple deletion ====> " + (rowCountBefore - 3));
    console.log("After multiple deletion ====> " + (rowCountAfter - 1));

    if ((rowCountBefore - 3) == (rowCountAfter - 1)) {
      console.log(" * Number of rows matches the before and after multiple vex management deletion.");
      console.log(" * Multiple Vex management deleted successfully!");
    } else {
      throw new Error(" *** Multiple Vex management deletion test failed!");
    }
  });

  test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > ENABLE OR DISABLE FROM 3dot MENU", async ({ page }, testInfo) => {
    console.log("================================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("================================================================================");

    await vexPage.delay(3000);
    console.log("URL: " + page.url());
    await vexPage.delay(1000);

    // Verify URL
    await vexPage.verifyPageUrl();
    console.log("");

    // Verify page elements
    await vexPage.verifyPageElements();

    // Validate table
    await vexPage.validateVexTable();

    // Toggle status of first VEX entry
    await vexPage.toggleVexStatus(1);
  });

  test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > DELETE FROM 3dot MENU", async ({ page }, testInfo) => {
    console.log("================================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("================================================================================");

    await vexPage.delay(3000);
    console.log("URL: " + page.url());
    await vexPage.delay(1000);

    // Verify URL
    await vexPage.verifyPageUrl();
    console.log("");

    // Verify page elements
    await vexPage.verifyPageElements();

    // Validate table
    await vexPage.validateVexTable();

    // Delete first VEX from menu
    await vexPage.deleteVexFromMenu(1);
  });

  test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > CLONE FROM 3dot MENU", async ({ page }, testInfo) => {
    const randstr = await generateRandomString(5);
    const cloneName = "clone" + sharedValue + randstr;

    console.log("================================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("================================================================================");

    await vexPage.delay(3000);
    console.log("URL: " + page.url());
    await vexPage.delay(1000);

    // Verify URL
    await vexPage.verifyPageUrl();
    console.log("");

    // Verify page elements
    await vexPage.verifyPageElements();

    // Validate table
    await vexPage.validateVexTable();

    // Clone first VEX entry
    await vexPage.cloneVex(1, cloneName, "this is cloning test");

    // Verify clone was created
    await page.reload();
    const exists = await vexPage.verifyVexExists(cloneName);
    expect(exists).toBeTruthy();
  });

  test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > EDIT CONFIGURATION FROM 3dot MENU", async ({ page }, testInfo) => {
    const randstr = await generateRandomString(5);
    const editedUri = sharedValue + randstr + "_edited";

    console.log("================================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("================================================================================");

    await vexPage.delay(3000);
    console.log("URL: " + page.url());
    await vexPage.delay(1000);

    // Verify URL
    await vexPage.verifyPageUrl();
    console.log("");

    // Verify page elements
    await vexPage.verifyPageElements();

    // Validate table
    await vexPage.validateVexTable();

    // Edit first VEX configuration
    await vexPage.editVexConfiguration(1, editedUri);

    console.log("VEX configuration edited successfully");
  });

  test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > EDIT YAML FROM 3dot MENU", async ({ page }, testInfo) => {
    console.log("================================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("================================================================================");

    await vexPage.delay(3000);
    console.log("URL: " + page.url());
    await vexPage.delay(1000);

    // Verify URL
    await vexPage.verifyPageUrl();
    console.log("");

    // Verify page elements
    await vexPage.verifyPageElements();

    // Validate table
    await vexPage.validateVexTable();

    // Edit first VEX YAML
    await vexPage.editVexYAML(1);

    console.log("VEX YAML edited successfully");
  });
});
