/* Filename: sbomscanner_registries.pom.test.ts
 * Complete POM migration of sbomscanner_registries.test.ts (3 tests)
 */

import { expect } from "@playwright/test";
import { test } from "../fixture/fixture";
import { RegistriesPageEnhanced } from "../pages/RegistriesPageEnhanced";

// Import utility functions
const { generateRandomString, sharedValue } = require('../utils/commands.ts');

test.describe("*** SBOMSCANNER UI TEST (Registries - POM)", () => {
  test.describe.configure({ mode: "default" });

  let registriesPage: RegistriesPageEnhanced;

  test.beforeEach(async ({ page }) => {
    console.log("");
    console.log(" ----------------------");
    console.log(" :: Before each test ::");
    console.log(" ----------------------");
    console.log("");

    // Initialize page object
    registriesPage = new RegistriesPageEnhanced(page);

    // Navigate to registries page
    await registriesPage.navigate();
  });

  test("SBOMSCANNER > ADVANCES > REGISTRIES CONFIGURATION", async ({ page }, testInfo) => {
    console.log("========================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("========================================");

    console.log("URL: " + page.url());
    await registriesPage.delay(1000);

    // Verify URL
    await registriesPage.verifyPageUrl();
    console.log("");

    // Verify page elements
    await registriesPage.verifyPageElements();

    // Validate registry table
    await registriesPage.validateRegistryTable();
  });

  test("SBOMSCANNER > ADVANCES > REGISTRIES CONFIGURATION > REGISTRY CREATE", async ({ page }, testInfo) => {
    const randstr = await generateRandomString(5);
    const registryName = sharedValue + randstr + "registry.docker.hub.com";

    console.log("========================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("========================================");

    console.log("URL: " + page.url());
    await registriesPage.delay(1000);

    // Verify URL
    await registriesPage.verifyPageUrl();
    console.log("");

    // Verify page elements
    await registriesPage.verifyPageElements();

    // Create new registry
    await registriesPage.createRegistry(registryName, "['*']");

    // Filter by the new registry name
    await registriesPage.filterByRegistry(sharedValue + randstr);

    // Verify registry was created
    const exists = await registriesPage.verifyRegistryExists(registryName);
    expect(exists).toBeTruthy();
  });

  test("SBOMSCANNER > ADVANCES > REGISTRIES CONFIGURATION > REGISTRY DELETE", async ({ page }, testInfo) => {
    console.log("========================================");
    console.log(`Running test: ${testInfo.title}`);
    console.log("========================================");

    console.log("URL: " + page.url());
    await registriesPage.delay(1000);

    // Verify URL
    await registriesPage.verifyPageUrl();

    // Delete registry by filtering for 'uitest' (global shared value)
    await registriesPage.deleteRegistryByName("uitest");

    console.log("Registry deletion completed");
  });
});
