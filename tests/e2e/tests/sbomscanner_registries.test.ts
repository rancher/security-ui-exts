/* Filename: sbomscanner_registries.test.ts 
*/


import { chromium, expect, Page } from "@playwright/test"
import * as custom from '../utils/commands.ts'
import { test } from "../fixture/fixture.ts"

import { test as setup } from '@playwright/test';
const { delay, navigateTo, userClickByElem, userPresskey, generateRandomString } = require('../utils/commands.ts');
const { isVisibled, isLoaded, retrInnerText, retrTextContent, userClickByText } = require('../utils/commands.ts');
const { sharedValue, updateSharedValue } = require('../utils/commands.ts');

import * as fs from 'fs';
import { Console } from 'console';
const outputFilePath: string = 'output.log';
const output = fs.createWriteStream(outputFilePath);

// Create a new console instance that writes to the file stream
const myConsole = new Console(output);


const sbom_images = ["[class='m-0']", //title
    "[data-testid='masthead-create']", //create btn
    //".summary-section",
    //".search-.filter-row > div:nth-of-type(1)  .filter-input",
    //".btn.role-primary.scan-btn.table-btn", //start scan btn
    //".table-top-left .table-btn:nth-of-type(2)", //delete btn

    /* Locate the table */
    "table[role='table']",
    "table[role='table'] > thead",
    "table[role='table'] > tbody"
]


test.describe("*** SBOMSCANNER UI TEST", () => {

     test.describe.configure({ mode: "default" }) //serial
     
    /* browser capabilities */
    const capabilities = {
        browserName: "Chrome", //`
        browserVersion: "latest",
        "LT:Options": {
            platform: "ubuntu",
            build: "Playwright Test Build",
            name: "Playwright Test",
            user: '',
            accessKey: '',
            network: true,
            video: true,
            console: true,
            tunnel: false, // Add tunnel configuration if testing locally hosted webpage
            tunnelName: "", // Optional
            geoLocation: '', //
        },
    };

    test.beforeEach(async ({ page }) => {

        console.log("")
        console.log(" ----------------------")
        console.log(" :: Before each test ::")
        console.log(" ----------------------")
        console.log("")
        delay(page, 2000)
        await navigateTo(page, "/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.registry")

    })


    test("SBOMSCANNER > ADVANCES > REGISTRIES CONFIGURATION ", async ({ page }, testInfo) => {

        console.log("========================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("========================================")

        console.log("URL: " + page.url())
        delay(page, 1000)

        const sbom_registry_menu = page.locator(".accordion.depth-0.expanded.group-highlight.has-children.package")
        ////await expect(sbom_registry_menu).toHaveScreenshot('\sbom_submenu_registry.png', { maxDiffPixels: 300 })

        //assert url matches to image api string
        await expect(page).toHaveURL('https://RANCHERURL/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.registry')
        console.log("")


        // Verify the elements are loaded and visibled before proceeding 
        await isVisibled(page, sbom_images)

        const table = page.locator("table[role='table']");

        // Locate all the rows within the table
        const rows = table.locator('tr');
        const rowCount = await rows.count();

        // Locate all the columns within the table
        const column = table.locator('th');
        const columnCount = await column.count();

        console.log("")
        console.log("---Table-----------------------------------------------------------------")
        console.log("# Number of rows:" + (rowCount - 1)) //eliminate 1 for row header
        console.log("# Number of columns:" + columnCount)
        console.log("-------------------------------------------------------------------------\n")

        //First, if the table has no data, it should return the "There are no rows to show" text string on the first row
        //Fail the test if it does not show or unmatched

        const no_rows = await table.locator(".no-rows") // just for checking for data does not exist
        if (rowCount == 2 && no_rows) {
            const s = await retrTextContent(page, "td > span")

            let noRowString: boolean = s === 'There are no rows to show.';

            //check the no row string if no row visible
            if (!noRowString) {
                throw new Error("Failed - Table displays incomparable string to \"There are no rows to show\"")
            }
            else {
                console.log("Passed: The empty table displays \"There are no rows to show\"")
            }
        }
        else {

            // Loop through each row
            for (let i = 0; i < rowCount - 1; i++) {

                const _checkbox = await table.locator(`tr:nth-of-type(${i + 1}) > .row-check`).textContent()
                const _registry = await table.locator(`tr:nth-of-type(${i + 1}) > .col-registry-name-cell`).textContent()
                const _namespace = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(3)`).textContent()
                const _uri = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(4)`).textContent()
                const _repositories = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(5)`).textContent()
                const _scan_interval = await table.locator(`tr:nth-of-type(${i + 1}) > .col-scan-interval`).textContent()
                const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-registry-status-cell-badge`).textContent()
                const _progress = await table.locator(`tr:nth-of-type(${i + 1}) .col-progress-cell`).textContent()
                const _prev_scan = await table.locator(`tr:nth-of-type(${i + 1}) > .col-previous-scan-cell`).textContent()
                const _registry_menu = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(10)`).textContent()

                expect(typeof _checkbox).toBe('string')
                expect(typeof _registry).toBe('string')
                expect(typeof _namespace).toBe('string')
                expect(typeof _uri).toBe('string')
                expect(typeof _repositories).toBe('string')
                expect(typeof _scan_interval).toBe('string')
                expect(typeof _status).toBe('string')
                expect(typeof _progress).toBe('string')
                expect(typeof _prev_scan).toBe('string')
                expect(typeof _registry_menu).toBe('string')

            }
        }

    })


    test("SBOMSCANNER > ADVANCES > REGISTRIES CONFIGURATION > REGISTRY CREATE ", async ({ page }, testInfo) => {

        const randstr = await generateRandomString(5)
        const tmp = sharedValue + randstr;

        console.log("========================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("========================================")

        console.log("URL: " + page.url())
        delay(page, 1000)

        //assert url matches to image api string
        await expect(page).toHaveURL('https://RANCHERURL/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.registry')
        console.log("")

        // Verify the elements are loaded and visibled before proceeding 
        await isVisibled(page, sbom_images)

        await userClickByElem(page, "[data-testid='masthead-create']") //click on  create button
        await expect(page).toHaveURL("https://RANCHERURL/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.registry/create")

        const registry_config = [".primaryheader",
            ".vs--single.vs--searchable [role='combobox']",
            ".mb-20.row > div:nth-of-type(2)", //registry
            ".mb-20.row > div:nth-of-type(3)", //description
           
            ".row:nth-of-type(3) [aria-disabled]", //uri
            "div:nth-of-type(1) > .edit.labeled-input", //CA Cert Bundle
            "div:nth-of-type(6) > .col.span-6", //authentication
            ".vs--multiple [role='combobox']", //repositories to scan
            "div:nth-of-type(8) > .col.span-3", //scan interval

            "button#cru-cancel",
            ".cru-resource-footer div .role-secondary span", //edit as yaml
            ".ready-for-action" //create btn
        ]

        await isVisibled(page, registry_config)

        console.log("< Dropdown values ===========================")
        const dropdown_elems = await retrInnerText(page, ".vs--single.vs--searchable [role='combobox']")
        console.log("==>> " + dropdown_elems)

        //const result: string[] = dropdown_elems.split("\n");

        await userClickByElem(page, ".mb-20.row > div:nth-of-type(2)") //type in registry
        await userPresskey(page, ".mb-20.row > div:nth-of-type(2)", tmp + "registry.docker.hub.com")

        await userClickByElem(page, ".row:nth-of-type(3) [aria-disabled]") //type in uri
        await userPresskey(page, ".row:nth-of-type(3) [aria-disabled]", "['*']")

        await userClickByElem(page, ".ready-for-action") //create new registry

        await delay(page, 2000)

        await page.reload()

        //Back to registry page
        await expect(page).toHaveURL("https://RANCHERURL/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.registry")

        /* to verify the new registry is created 
        */

        //search by the new created registry
        await userClickByElem(page, ".filter-row .filter-item:nth-of-type(1) .filter-input-wrapper") //filter by registry
        ////await userPresskey(page, ".filter-row .filter-item:nth-of-type(1) .filter-input-wrapper", tmp+randstr + "registry.docker.hub.com")

        await userPresskey(page, ".filter-row .filter-item:nth-of-type(1) .filter-input-wrapper", tmp)

        //await isVisibled(page, "table[role='table']")

        const table = page.locator("table[role='table']");

        // Locate all the rows within the table
        const rows = table.locator('tr');
        const rowCount = await rows.count();

        console.log("")
        console.log("---Table-----------------------------------------------------------------")
        console.log("# Number of rows found after filtering: " + (rowCount - 1)) //eliminate 1 for row header
        console.log("-------------------------------------------------------------------------\n")

        expect(rowCount).toBeGreaterThanOrEqual(2) //verify return result is at least 1, include the header row.

        const _registry_name = await table.locator(`tr:nth-of-type(1) > .col-registry-name-cell`).textContent()
        console.log("-> Matched registry found: Registry added successfully - " + _registry_name)

        /* Delete the registry */
        /* ---------------------------------------------------------------------------
        await userClickByElem(page, "tr:nth-of-type(1) > .row-check")
        
        const scan_btn = await page.locator(".btn.role-primary.table-btn").nth(1) //scan btn
        const del_btn = await page.locator(".btn.role-primary.table-btn").nth(2) //delete btn
        
        //expect(scan_btn).toBeEnabled()
        //expect(del_btn).toBeEnabled()

        //await userClickByElem(page, scan_btn)
        await page.getByRole('button', { name: 'Start scan' }).isEnabled();
        await page.getByRole('button', { name: 'Delete' }).isEnabled();

        await page.getByRole('button', { name: 'Start scan' }).click();
        await delay(page, 8000)

        await page.getByRole('button', { name: 'Delete' }).click();
        await delay(page, 2000)
        //await isVisibled(page, "[role='dialog']")
        await expect(page.locator("[role='dialog']")).toBeVisible();
        
        (await page.locator(".card-body").innerText()).includes("You are attempting to delete the Registries configuration")

        await userClickByElem(page, "div#focus-trap-card-container-element button[role='button']") //delete
        //.role-secondary  //cancel btn
        
        //.growl-container > div > div:nth-of-type(1)

     -------------------------------------------------- */

    })


    test("SBOMSCANNER > ADVANCES > REGISTRIES CONFIGURATION > REGISTRY DELETE ", async ({ page }, testInfo) => {

        console.log("========================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("========================================")

        console.log("URL: " + page.url())
        delay(page, 1000)

        //Back to registry page
        await expect(page).toHaveURL("https://RANCHERURL/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.registry")

        /* to verify the new registry is created 
        */

        //search by the new created registry
        await userClickByElem(page, ".filter-row .filter-item:nth-of-type(1) .filter-input-wrapper") //filter by registry
        ////await userPresskey(page, ".filter-row .filter-item:nth-of-type(1) .filter-input-wrapper", tmp+randstr + "registry.docker.hub.com")

        await userPresskey(page, ".filter-row .filter-item:nth-of-type(1) .filter-input-wrapper", "uitest") //global sharevalue

        const table = page.locator("table[role='table']");

        // Locate all the rows within the table
        const rows = table.locator('tr');
        const rowCount = await rows.count();

        console.log("")
        console.log("---Table-----------------------------------------------------------------")
        console.log("# Number of rows found to be deleted: " + (rowCount - 1)) //eliminate 1 for row header
        console.log("-------------------------------------------------------------------------\n")

        expect(rowCount).toBeGreaterThanOrEqual(2) //verify return result is at least 1, include the header row.
        console.log("-------------------------------------------------------------------------")
        const _registry_name = await table.locator(`tr:nth-of-type(1) > .col-registry-name-cell`).textContent()
        console.log("-> Matched registry found to be deleted: " + _registry_name)
        console.log("-------------------------------------------------------------------------\n")


        /* Delete the registry */
        await userClickByElem(page, "tr:nth-of-type(1) > .row-check")

        const scan_btn = await page.locator(".btn.role-primary.table-btn").nth(1) //scan btn
        const del_btn = await page.locator(".btn.role-primary.table-btn").nth(2) //delete btn

        //await userClickByElem(page, scan_btn)
        await page.getByRole('button', { name: 'Start scan' }).isEnabled();
        await page.getByRole('button', { name: 'Delete' }).isEnabled();

        //await page.getByRole('button', { name: 'Start scan' }).click();
        //await delay(page, 8000)

        await page.getByRole('button', { name: 'Delete' }).click(); //click del button
        await delay(page, 2000)
        
        await expect(page.locator("[role='dialog']")).toBeVisible();
        (await page.locator(".card-body").innerText()).includes("You are attempting to delete the Registries configuration")

        await userClickByElem(page, "div#focus-trap-card-container-element button[role='button']") //confirm delete btn
        //.role-secondary  //cancel btn
        //.growl-container > div > div:nth-of-type(1)


        /* validate deletion */
        //...............------        

    })


}) //the end

