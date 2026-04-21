/* Filename: sbomscanner_images.test.ts 
*/

import { chromium, expect, Page } from "@playwright/test"
import * as custom from '../utils/commands.ts'
import { test } from "../fixture/fixture.ts"

import { test as setup } from '@playwright/test';
const { delay, navigateTo, userClickByElem, userPresskey } = require('../utils/commands.ts');
const { isVisibled, isLoaded, retrInnerText, retrTextContent, userClickByText } = require('../utils/commands.ts');

import * as fs from 'fs';
import { Console } from 'console';
const outputFilePath: string = 'output.log';
const output = fs.createWriteStream(outputFilePath);

// Create a new console instance that writes to the file stream
const myConsole = new Console(output);

import { exec } from "child_process";
import { runInContext } from "vm";
import { types } from "util";

const sbom_images = [
    ".page  .title", //SBOMScanner Images title
    ".filter-row", //filter section
    ".main-layout > div > div:nth-of-type(3)", //table layout
    "div:nth-of-type(1) > .btn.role-primary", //Download full report button
    "div:nth-of-type(2) > .btn.role-primary", //Download custom report button

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
        console.log(" ---------------------- ")
        console.log(" :: Before each test :: ")
        console.log(" ---------------------- " )
        console.log("")


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

        delay(page, 2000)
         

        await navigateTo(page, "/dashboard/c/local/imageScanner/images") //navigate to image page

    })


    test("SBOMSCANNER > IMAGES > TABLE DATA VALIDATION ", async ({ page }, testInfo) => {

        console.log("======================================================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("======================================================================")

        console.log("URL: " + page.url())
        delay(page, 1000)

        //assert url matches to image api string
        await expect(page).toHaveURL('https://RANCHERURL/dashboard/c/local/imageScanner/images')
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

        const no_rows = await table.locator(".no-rows").isVisible() // just for checking for data does not exist
        if (no_rows) {
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

                const image_checkbox = await table.locator(`tr:nth-of-type(${i + 1}) > .row-check`).textContent()
                const image_reference = await table.locator(`tr:nth-of-type(${i + 1}) > .col-image-name-cell`).textContent()

                const cve_critical = await table.locator(`tr:nth-of-type(${i + 1}) > .col-identified-cves-cell > div .badge`).nth(0).textContent()
                const cve_high = await table.locator(`tr:nth-of-type(${i + 1}) > .col-identified-cves-cell > div .badge`).nth(1).textContent()
                const cve_medium = await table.locator(`tr:nth-of-type(${i + 1}) > .col-identified-cves-cell > div .badge`).nth(2).textContent()
                const cve_low = await table.locator(`tr:nth-of-type(${i + 1}) > .col-identified-cves-cell > div .badge`).nth(3).textContent()
                const cve_unknown = await table.locator(`tr:nth-of-type(${i + 1}) > .col-identified-cves-cell > div .badge`).nth(4).textContent()

                const image_id = await table.locator(`tr:nth-of-type(${i + 1}) > .col-image-id-cell`).textContent()
                const image_registry = await table.locator(`tr:nth-of-type(${i + 1}) > .col-registry-cell-link`).textContent()
                const image_repository = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(6)`).textContent()
                const image_platform = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(7)`).textContent()
                const image_download = await table.locator(`tr:nth-of-type(${i + 1}) > td:nth-of-type(8)`).textContent()

                // convert cve string to number
                const cr_val: number = Number(cve_critical);
                const hi_val: number = Number(cve_high);
                const me_val: number = Number(cve_medium);
                const lo_val: number = Number(cve_low);
                const un_value: number | null | undefined = Number(cve_unknown);

                //console.log("=>" + typeof critical)
                console.log(`ROW ${i} == ${cr_val} - ${hi_val} - ${me_val} - ${lo_val} - ${un_value}`)

                expect(typeof image_checkbox).toBe('string')
                expect(typeof image_reference).toBe('string')

                // assert the cve value should be a number greater than 0
                expect(cr_val).toBeGreaterThanOrEqual(0)
                expect(hi_val).toBeGreaterThanOrEqual(0)
                expect(me_val).toBeGreaterThanOrEqual(0)
                expect(lo_val).toBeGreaterThanOrEqual(0)
                expect(un_value).toBeGreaterThanOrEqual(0)

                expect(typeof image_id).toBe('string')
                expect(typeof image_registry).toBe('string')
                expect(typeof image_repository).toBe('string')
                expect(typeof image_platform).toBe('string')
                expect(typeof image_download).toBe('string')

            }
        }

    })

    test("SBOMSCANNER > IMAGES > TABLE CHECKBOX CUSTOM VALIDATION ", async ({ page }, testInfo) => {

        console.log("======================================================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("======================================================================")

        console.log("URL: " + page.url())
        delay(page, 1000)

        //assert url matches to image api string
        await expect(page).toHaveURL('https://RANCHERURL/dashboard/c/local/imageScanner/images')
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

        const no_rows = await table.locator(".no-rows").isVisible() // just for checking for data does not exist
        if (no_rows) {
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

            //click on the custom checkbox to select all
            await userClickByElem(page, ".check .checkbox-custom")
            await delay(page, 1000)

            // Loop through each row
            for (let i = 0; i < rowCount - 2; i++) {

                //const image_checkbox = await table.locator(`tr:nth-of-type(${i+1}) > .row-check`)
                const image_checkbox = await table.locator(`tbody .main-row:nth-of-type(${i + 1}) .checkbox-custom`)

                expect(image_checkbox).toBeChecked()
                expect(image_checkbox).toHaveAttribute("aria-checked", "true")
                expect(image_checkbox).toHaveAttribute("role", "checkbox")

            }
        }

    })

    test("SBOMSCANNER > IMAGES > TABLE EACH CHECKBOX VALIDATION ", async ({ page }, testInfo) => {

        console.log("======================================================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("======================================================================")

        
        console.log("URL: " + page.url())
        delay(page, 1000)

        //assert url matches to image api string
        await expect(page).toHaveURL('https://RANCHERURL/dashboard/c/local/imageScanner/images')
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

        const no_rows = await table.locator(".no-rows").isVisible() // just for checking for data does not exist
       
        if (no_rows) {
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

            await delay(page, 1000)

            // Loop through each row
            for (let i = 0; i < rowCount - 2; i++) {

                //Click on each row checkbox is checked and validate
                await userClickByElem(page, `tbody .main-row:nth-of-type(${i + 1}) .checkbox-custom`)
                const image_checkbox = await table.locator(`tbody .main-row:nth-of-type(${i + 1}) .checkbox-custom`)

                expect(image_checkbox).toBeChecked()
                expect(image_checkbox).toHaveAttribute("aria-checked", "true")
                expect(image_checkbox).toHaveAttribute("role", "checkbox")

            }

            await delay(page, 1000)

            // Loop through each row
            for (let i = 0; i < rowCount - 2; i++) {

                //Click on each row checkbox is unchecked and validate
                await userClickByElem(page, `tbody .main-row:nth-of-type(${i + 1}) .checkbox-custom`)
                const image_checkbox = await table.locator(`tbody .main-row:nth-of-type(${i + 1}) .checkbox-custom`)

                expect(image_checkbox).not.toBeChecked()
                expect(image_checkbox).toHaveAttribute("aria-checked", "false")
                expect(image_checkbox).toHaveAttribute("role", "checkbox")

            }

        }

    })

    test("SBOMSCANNER > IMAGES > DOWNLOAD VALIDATION", async ({ page }, testInfo) => {

        console.log("======================================================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("======================================================================")

        console.log("URL: " + page.url())
        delay(page, 1000)

        //assert url matches to image api string
        await expect(page).toHaveURL('https://RANCHERURL/dashboard/c/local/imageScanner/images')
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
        
        const no_rows = await table.locator(".no-rows").isVisible() // just for checking for data does not exist
        
        const textstringExists = await page.locator('text=There are no rows to show').isVisible();

          if (no_rows){
            console.log('Table has no row found');

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

            
            //Just check the first row JSON download
            await table.locator(`tr:nth-of-type(1) button[role='button']`).click() //three dots action
            await delay(page, 1000)
            const downloadPromise_JSON = page.waitForEvent('download');
            await table.locator("div[role='menu'] > div:nth-of-type(3)").click() //Vulnerability report (JSON)
            await delay(page, 3000)
            const download_JSON = await downloadPromise_JSON;
            const filePath_JSON = 'downloads/' + download_JSON.suggestedFilename();

            await download_JSON.saveAs(filePath_JSON);
            expect(fs.existsSync(filePath_JSON)).toBeTruthy();

            const stats = await fs.promises.stat(filePath_JSON);
            expect(stats.size).toBeGreaterThan(0);

        }


    })






}) //the end

