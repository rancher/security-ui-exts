/* Filename: sbomscanner_images.pom.test.ts
 * Complete POM migration of sbomscanner_images.test.ts (4 tests)
 */

import { expect } from "@playwright/test";
import { test } from "../fixture/fixture";
import { ImagesPageEnhanced } from "../pages/ImagesPageEnhanced";
import { exec } from "child_process";

test.describe("*** SBOMSCANNER UI TEST (Images - POM)", () => {
  test.describe.configure({ mode: "default" });

  let imagesPage: ImagesPageEnhanced;

  test.beforeEach(async ({ page }) => {
    console.log("");
    console.log(" ---------------------- ");
    console.log(" :: Before each test :: ");
    console.log(" ---------------------- ");
    console.log("");

    exec("rm downloads/*", (error, stdout, stderr) => {
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

    // Initialize page object
    imagesPage = new ImagesPageEnhanced(page);

    // Navigate to images page
    await imagesPage.navigate();
  });

  test("SBOMSCANNER > IMAGES > TABLE DATA VALIDATION", async ({ page }, testInfo) => {
    console.log("======================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("======================================================================");

    console.log("URL: " + page.url());
    await imagesPage.delay(1000);

    // Verify URL
    await imagesPage.verifyPageUrl();
    console.log("");

    // Verify page elements are visible
    await imagesPage.verifyPageElements();

    // Validate all table data
    await imagesPage.validateTableData();
  });

  test("SBOMSCANNER > IMAGES > TABLE CHECKBOX CUSTOM VALIDATION", async ({ page }, testInfo) => {
    console.log("======================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("======================================================================");

    console.log("URL: " + page.url());
    await imagesPage.delay(1000);

    // Verify URL
    await imagesPage.verifyPageUrl();
    console.log("");

    // Verify page elements are visible
    await imagesPage.verifyPageElements();

    // Get table info
    const rowCount = await imagesPage.getTableRowCount();
    const columnCount = await imagesPage.getTableColumnCount();

    console.log("");
    console.log("---Table-----------------------------------------------------------------");
    console.log("# Number of rows:" + (rowCount - 1));
    console.log("# Number of columns:" + columnCount);
    console.log("-------------------------------------------------------------------------\n");

    // Select all checkboxes and validate
    await imagesPage.selectAllAndValidate();
  });

  test("SBOMSCANNER > IMAGES > TABLE EACH CHECKBOX VALIDATION", async ({ page }, testInfo) => {
    console.log("======================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("======================================================================");

    console.log("URL: " + page.url());
    await imagesPage.delay(1000);

    // Verify URL
    await imagesPage.verifyPageUrl();
    console.log("");

    // Verify page elements are visible
    await imagesPage.verifyPageElements();

    // Get table info
    const rowCount = await imagesPage.getTableRowCount();
    const columnCount = await imagesPage.getTableColumnCount();

    console.log("");
    console.log("---Table-----------------------------------------------------------------");
    console.log("# Number of rows:" + (rowCount - 1));
    console.log("# Number of columns:" + columnCount);
    console.log("-------------------------------------------------------------------------\n");

    // Validate individual checkboxes
    await imagesPage.validateIndividualCheckboxes();
  });

  test("SBOMSCANNER > IMAGES > DOWNLOAD VALIDATION", async ({ page }, testInfo) => {
    console.log("======================================================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("======================================================================");

    console.log("URL: " + page.url());
    await imagesPage.delay(1000);

    // Verify URL
    await imagesPage.verifyPageUrl();
    console.log("");

    // Verify page elements are visible
    await imagesPage.verifyPageElements();

    // Get table info
    const rowCount = await imagesPage.getTableRowCount();
    const columnCount = await imagesPage.getTableColumnCount();

    console.log("");
    console.log("---Table-----------------------------------------------------------------");
    console.log("# Number of rows:" + (rowCount - 1));
    console.log("# Number of columns:" + columnCount);
    console.log("-------------------------------------------------------------------------\n");

    // Download JSON report from first row
    await imagesPage.downloadFirstRowJSONReport();
  });
});
