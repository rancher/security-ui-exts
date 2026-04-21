/* Filename: sbomscanner_registries.test.ts 
*/


import { chromium, expect, Page } from "@playwright/test"
import * as custom from '../utils/commands.ts'
import { test } from "../fixture/fixture.ts"

import { test as setup } from '@playwright/test';
const { delay, navigateTo, userClickByElem, userInput, userPresskey, generateRandomString } = require('../utils/commands.ts');
const { isVisibled, isLoaded, retrInnerText, retrTextContent, userClickByText } = require('../utils/commands.ts');
const { sharedValue, updateSharedValue } = require('../utils/commands.ts');

import * as fs from 'fs';
import { Console, error } from 'console';
import { exit } from "process";
const outputFilePath: string = 'output.log';
const output = fs.createWriteStream(outputFilePath);

// Create a new console instance that writes to the file stream
const myConsole = new Console(output);


const sbom_images = [".with-subheader", //title
            //".description",
            //".header-right .role-primary", ///create btn  https://github.com/rancher/vexhub

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
        await navigateTo(page, "/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub")
        delay(page, 2000)

        /* 
        const d = page.locator(".description")

        let desc: unknown = "Configure the security scanner to use up-to-date VEX reports. This will prioritize remediation efforts, focusing on vulnerabilities that are confirmed to be exploitable and reducing the noise coming from false positives."
        let desc_val: string = desc as string
        expect(d).toContainText(desc_val)
        */

    })


    test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT ", async ({ page }, testInfo) => {

        console.log("================================================================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("================================================================================")

        //await navigateTo(page, "/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub")

        delay(page, 3000)
        console.log("URL: " + page.url())
        delay(page, 1000)

        //assert url matches to image api string
        await expect(page).toHaveURL('https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub')
        console.log("")

        const sbom_vex_menu = page.locator(".accordion.depth-0.expanded.group-highlight.has-children.package")
        ////await expect(sbom_vex_menu).toHaveScreenshot('\sbom_submenu_vex.png', { maxDiffPixels: 300 })

        const sbom_images = [".with-subheader", //title
        
            //"Create", ///create btn  https://github.com/rancher/vexhub

            /* Locate the table */
            "table[role='table']",
            "table[role='table'] > thead",
            "table[role='table'] > tbody"
        ]

        // Verify the elements are loaded and visibled before proceeding 
        await isVisibled(page, sbom_images)

        /* XXXXXX
        const d = page.locator(".description")

        let desc: unknown = "Configure the security scanner to use up-to-date VEX reports. This will prioritize remediation efforts, focusing on vulnerabilities that are confirmed to be exploitable and reducing the noise coming from false positives."
        let desc_val: string = desc as string

        expect(d).toContainText(desc_val)
        */


        // Locate all the rows within the table
        const table = page.locator("table[role='table']");
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

        if (rowCount == 0) {
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
            table.locator(`tr:nth-of-type(1) > .row-check`).click()
            // Loop through each row
            for (let i = 0; i < rowCount - 1; i++) {

                const _checkbox = await table.locator(`tr:nth-of-type(${i + 1}) > .row-check`).textContent()
                const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()
                const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                const _uri = await table.locator(`tr:nth-of-type(${i + 1}) > .col-uri-external-link`).textContent()
                //const _createdby = await table.locator(`tr:nth-of-type(${i + 1}) > [data-testid='sortable-cell-0-3']`).textContent()

                const _updated = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-date-formatter`).textContent()
                //const _action = await table.locator(`tr:nth-of-type(${i + 1}) > .role-link .icon-actions`).textContent()

                console.log("-> " + _checkbox)
                console.log("-> " + _status)
                console.log("-> " + _name)
                console.log("-> " + _uri)
                //console.log("-> " + _createdby)
                console.log("-> " + _updated)
                //console.log("-> " + _action)

                expect(typeof _checkbox).toBe('string')
                expect(typeof _status).toBe('string')
                expect(typeof _name).toBe('string')
                expect(typeof _uri).toBe('string')
                //expect(typeof _createdby).toBe('string')
                expect(typeof _updated).toBe('string')
                //expect(typeof _action).toBe('string')

                //await userClickByElem(page, ".role-link .icon-actions")

            }


            //click on first row 3dot menu
            await page.locator("tr:nth-of-type(1) button[role='button'] > .icon.icon-actions").click()

            const action_menu = [
                ".v-popper__inner",
                "div[role='menu'] > div:nth-of-type(1)", //disable
                "div[role='menu'] > div:nth-of-type(2)", //Edit Configuration
                "div[role='menu'] > div:nth-of-type(3)", //Edit yaml
                "div[role='menu'] > div:nth-of-type(4)", //clone
                "div[role='menu'] > div:nth-of-type(5)"  //delete
            ]

            await delay(page, 2000)
            await isVisibled(page, action_menu)

        }


    })


    for (let m = 0; m < 3; m++) {
        test(`SBOMSCANNER > ADVANCES > VEX MANAGEMENT > CREATE #${m + 1}`, async ({ page }, testInfo) => {

            const randstr = await generateRandomString(5)
            const tmp = sharedValue + randstr;

            console.log("================================================================================")
            console.log(`Running test: ${testInfo.title}`);
            //console.log(`Test path: ${testInfo.titlePath}`);
            console.log("================================================================================")

            //await navigateTo(page, "/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub")

            delay(page, 3000)
            console.log("URL: " + page.url())
            delay(page, 1000)

            //assert url matches to image api string
            await expect(page).toHaveURL('https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub')
            console.log("")

            const sbom_vex_menu = page.locator(".accordion.depth-0.expanded.group-highlight.has-children.package")
            ////await expect(sbom_vex_menu).toHaveScreenshot('\sbom_submenu_vex.png', { maxDiffPixels:300 })

            const sbom_images = [".with-subheader", //title",
                //".description",
                //".header-right .role-primary", ///create btn  https://github.com/rancher/vexhub

                /* Locate the table */
                "table[role='table']",
                "table[role='table'] > thead",
                "table[role='table'] > tbody"
            ]

            // Verify the elements are loaded and visibled before proceeding 
            await isVisibled(page, sbom_images)

            /*  XXXXXX
            const d = page.locator(".description")

            let desc: unknown = "Configure the security scanner to use up-to-date VEX reports. This will prioritize remediation efforts, focusing on vulnerabilities that are confirmed to be exploitable and reducing the noise coming from false positives."
            let desc_val: string = desc as string
            expect(d).toContainText(desc_val)
            */


            /* CREATEte new vex management
            */

            await userClickByElem(page, "[data-testid='masthead-create']")
            await delay(page, 2000)
            await expect(page).toHaveURL('https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub/create')
                                                                    
            await delay(page, 2000)

            const v_name = page.locator(".mb-20.row > .col.span-3")
            const v_description = page.locator(".mb-20.row > .col.span-6")
            const v_hub_uri = page.locator(".col.span-9")
            const v_enabled_status = page.locator(".checkbox-container > [tabindex='0']:nth-child(2)") //(".check-custom")

            await v_name.click()
            await v_name.pressSequentially(tmp)

            await v_description.click()
            await v_description.pressSequentially("this is a test for ui automation")

            await v_hub_uri.click()
            await v_hub_uri.pressSequentially("https://github.com/rancher/vexhub")
            //await page.getByRole('button', { name: 'Delete' }).click();

            //expect(v_enabled_status).toBeChecked()
            const cb_valueAttribute = await v_enabled_status.getAttribute('aria-checked');
            console.log(`The checkbox value attribute is: ${cb_valueAttribute}`);

            if (cb_valueAttribute == "true" || cb_valueAttribute == "null") {
                console.log(" --> ischecked ")
            }
            else {
                console.log(" --> isunchecked, check it.")
                //await v_enabled_status.click() //check enabled if it is unchecked
                //.checkbox-container

                //await userClickByElem(page, ".checkbox-container")
                await delay(page, 1000)
            }

            userClickByElem(page, "button[role='button'] > span") //create vex management button
            await delay(page, 1000)
            await expect(page).toHaveURL('https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub') //expect back to vex management main page

            /* Verify the newly created vex management
             */
            // Locate all the rows within the table
            const table = page.locator("table[role='table']");
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

            //temp array
            let vex_namelist: string[] = []

            //First, if the table has no data, it should return the "There are no rows to show" text string on the first row
            //Fail the test if it does not show or unmatched

            if (rowCount == 0) {
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
                    const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()
                    const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                    const _uri = await table.locator(`tr:nth-of-type(${i + 1}) > .col-uri-external-link`).textContent()
                    //const _createdby = await table.locator(`tr:nth-of-type(${i + 1}) > tr:nth-of-type(1) > td:nth-of-type(5)`).textContent()

                    const _updated = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-date-formatter`).textContent()

                    //const _action = await table.locator(`tr:nth-of-type(${i + 1}) > .role-link .icon-actions`).textContent()

                    console.log("-> " + _checkbox)
                    console.log("-> " + _status)
                    console.log("-> " + _name)
                    console.log("-> " + _uri)
                    //console.log("-> " + _createdby)
                    console.log("-> " + _updated)
                    //console.log("-> " + _action)

                    expect(typeof _checkbox).toBe('string')
                    expect(typeof _status).toBe('string')
                    expect(typeof _name).toBe('string')
                    expect(typeof _uri).toBe('string')
                    //expect(typeof _createdby).toBe('string')
                    expect(typeof _updated).toBe('string')
                    //expect(typeof _action).toBe('string')

                    vex_namelist.push(`${_name}`) //added the name to an array list

                    /*
                    await userClickByElem(page, ".role-link .icon-actions")
    
                    const action_menu = [
                        "div[role='menu']",
                        "div[role='menu'] > div:nth-of-type(1)", //disable
                        "div[role='menu'] > div:nth-of-type(2)", //Edit Configuration
                        "div[role='menu'] > div:nth-of-type(3)", //Edit yaml
                        "div[role='menu'] > div:nth-of-type(4)", //clone
                        "div[role='menu'] > div:nth-of-type(5)" //delete
                    ]
    
                    await delay(page, 2000)
                    await isVisibled(page, action_menu)
                    */


                }
            }

            console.log(tmp)
            console.log("Name list===> " + vex_namelist)


            const foundString = vex_namelist.find(item => item === tmp);

            if (foundString) {
                console.log(`Array contains the string '${tmp}'.`);
                console.log("New Vex management created successfully!")
            }
            else {
                console.log(`Array does not contain the string '${tmp}'.`);
                throw new Error("Create new Vex management test failed!")
            }

        })
    }


    test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > DELETE ", async ({ page }, testInfo) => {

        const randstr = await generateRandomString(5)
        const tmp = sharedValue + randstr;

        console.log("================================================================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("================================================================================")

        delay(page, 3000)
        console.log("URL: " + page.url())
        delay(page, 1000)

        //assert url matches to image api string
        await expect(page).toHaveURL('https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub')
        console.log("")

        const sbom_vex_menu = page.locator(".accordion.depth-0.expanded.group-highlight.has-children.package")
        ////await expect(sbom_vex_menu).toHaveScreenshot('\sbom_submenu_vex.png', { maxDiffPixels: 300 })


        // Verify the elements are loaded and visibled before proceeding 
        await isVisibled(page, sbom_images)

        /* CREATEt new vex management
        */
        await userClickByElem(page, "[data-testid='masthead-create']")
        await delay(page, 2000)
        await expect(page).toHaveURL('https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub/create')

        await delay(page, 2000)

        const v_name = page.locator(".mb-20.row > .col.span-3")
        const v_description = page.locator(".mb-20.row > .col.span-6")
        const v_hub_uri = page.locator(".col.span-9")
        const v_enabled_status = page.locator(".checkbox-container > [tabindex='0']:nth-child(2)") //(".check-custom")

        await v_name.click()
        await v_name.pressSequentially(tmp)

        await v_description.click()
        await v_description.pressSequentially("this is a test for ui automation")

        await v_hub_uri.click()
        await v_hub_uri.pressSequentially("https://github.com/rancher/vexhub")
        //await page.getByRole('button', { name: 'Delete' }).click();

        //expect(v_enabled_status).toBeChecked()
        const cb_valueAttribute = await v_enabled_status.getAttribute('aria-checked');
        console.log(`The checkbox value attribute is: ${cb_valueAttribute}`);

        if (cb_valueAttribute == "true" || cb_valueAttribute == "null") {
            console.log(" --> ischecked ")
        }
        else {
            console.log(" --> isunchecked, check it.")
            //await v_enabled_status.click() //check enabled if it is unchecked
            //.checkbox-container

            //await userClickByElem(page, ".checkbox-container")
            await delay(page, 1000)
        }

        userClickByElem(page, "button[role='button'] > span") //create vex management button
        await delay(page, 1000)
        await expect(page).toHaveURL('https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub') //expect back to vex management main page

        /* Verify the newly created vex management
         */
        // Locate all the rows within the table
        const table = page.locator("table[role='table']");
        const rows = table.locator('tr');
        const rowCount = await rows.count();

        // Locate all the columns within the table
        const column = table.locator('th');
        const columnCount = await column.count();

        console.log("")
        console.log("--- < Table Before Create >-----------------------------------------------------------------")
        console.log("# Number of rows:" + (rowCount - 1)) //eliminate 1 for row header
        console.log("# Number of columns:" + columnCount)
        console.log("--------------------------------------------------------------------------------------------")
        console.log("")

        //temp array
        let vex_namelist: string[] = []

        //First, if the table has no data, it should return the "There are no rows to show" text string on the first row
        //Fail the test if it does not show or unmatched

        if (rowCount == 0) {
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
                const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()
                const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                const _uri = await table.locator(`tr:nth-of-type(${i + 1}) > .col-uri-external-link`).textContent()
                //const _createdby = await table.locator(`tr:nth-of-type(${i + 1}) > tr:nth-of-type(1) > td:nth-of-type(5)`).textContent()

                const _updated = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-date-formatter`).textContent()

                //const _action = await table.locator(`tr:nth-of-type(${i + 1}) > .role-link .icon-actions`).textContent()

                console.log("-> " + _checkbox)
                console.log("-> " + _status)
                console.log("-> " + _name)
                console.log("-> " + _uri)
                //console.log("-> " + _createdby)
                console.log("-> " + _updated)
                //console.log("-> " + _action)

                expect(typeof _checkbox).toBe('string')
                expect(typeof _status).toBe('string')
                expect(typeof _name).toBe('string')
                expect(typeof _uri).toBe('string')
                //expect(typeof _createdby).toBe('string')
                expect(typeof _updated).toBe('string')
                //expect(typeof _action).toBe('string')

                vex_namelist.push(`${_name}`) //added the name to an array list

            }
        }

        console.log(tmp)
        console.log("Name list===> " + vex_namelist)


        const foundString = vex_namelist.find(item => item === tmp);

        if (foundString) {
            console.log(`Array contains the string '${tmp}'.`);
            console.log("New Vex management created successfully!")
        }
        else {
            console.log(`Array does not contain the string '${tmp}'.`);
            throw new Error("Create new Vex management test failed!")
        }

        /* --- Delete validation --- 
        */
        //temp array
        await delay(page, 2000)
        await page.reload();
        await delay(page, 2000)
        const ntable = page.locator("table[role='table']");
        const nrows = ntable.locator('tr');
        const nrowCount = await nrows.count();

        console.log("")
        console.log("--- < Table After Create > ---------------------------------------------------------------")
        console.log("# Number of rows:" + (nrowCount - 1)) //eliminate 1 for row header
        console.log("------------------------------------------------------------------------------------------")
        console.log("")

        for (let k = 0; k < nrowCount - 2; k++) { ////here is -2?

            const _ncheckbox = await ntable.locator(`tr:nth-of-type(${k + 1}) > .row-check`).textContent()
            const _nstatus = await ntable.locator(`tr:nth-of-type(${k + 1}) > .col-vex-status-cell-badge`).textContent()
            const _nname = await ntable.locator(`tr:nth-of-type(${k + 1}) > .col-vex-name-link`).textContent()
            const _nuri = await ntable.locator(`tr:nth-of-type(${k + 1}) > .col-uri-external-link`).textContent()
            //const _ndel_createdby = await ntable.locator(`tr:nth-of-type(${k + 1}) > tr:nth-of-type(1) > td:nth-of-type(5)`).textContent()

            const _nupdated = await ntable.locator(`tr:nth-of-type(${k + 1}) > .col-vex-date-formatter`).textContent()

            //const _action = await ntable.locator(`tr:nth-of-type(${k + 1}) > .role-link .icon-actions`).textContent()

            expect(typeof _ncheckbox).toBe('string')
            expect(typeof _nstatus).toBe('string')
            expect(typeof _nname).toBe('string')
            expect(typeof _nuri).toBe('string')
            //expect(typeof _ndel_createdby).toBe('string')
            expect(typeof _nupdated).toBe('string')
            //expect(typeof _naction).toBe('string')

            if (_nname === tmp) {
                await table.locator(`tr:nth-of-type(${k + 1}) > .row-check`).click()   //check the row
                await page.locator("button#promptRemove > span").click() //delete btn
                await delay(page, 1000)
                await expect(page.locator("[role='dialog']")).toBeVisible(); //delete confirmation dialog
                (await page.locator(".card-body").innerText()).includes("You are attempting to delete the Vex Management " + tmp)

                await userClickByElem(page, "div#focus-trap-card-container-element button[role='button'] > span") //confirm delete btn

            }
        }

        /*
            confirm vex management deletion
        */

        let vex_del_namelist: string[] = []
        await delay(page, 2000)
        page.reload();
        await delay(page, 2000)
        const ndeltable = page.locator("table[role='table']");
        const ndelrows = ndeltable.locator('tr');
        const ndelrowCount = await ndelrows.count();

        console.log("")
        console.log("--- < Table After Delete > ---------------------------------------------------------------")
        console.log("# Number of rows:" + (ndelrowCount - 1)) //eliminate 1 for row header
        console.log("-------------------------------------------------------------------------------------------")
        console.log("")

        for (let j = 0; j < ndelrowCount - 1; j++) {

            const _ndel_checkbox = await ndeltable.locator(`tr:nth-of-type(${j + 1}) > .row-check`).textContent()
            const _ndel_status = await ndeltable.locator(`tr:nth-of-type(${j + 1}) > .col-vex-status-cell-badge`).textContent()
            const _ndel_name = await ndeltable.locator(`tr:nth-of-type(${j + 1}) > .col-vex-name-link`).textContent()
            const _ndel_uri = await ndeltable.locator(`tr:nth-of-type(${j + 1}) > .col-uri-external-link`).textContent()
            //const n_del_createdby = await ndeltable.locator(`tr:nth-of-type(${j + 1}) > tr:nth-of-type(1) > td:nth-of-type(5)`).textContent()
            const _ndel_updated = await ndeltable.locator(`tr:nth-of-type(${j + 1}) > .col-vex-date-formatter`).textContent()

            expect(typeof _ndel_checkbox).toBe('string')
            expect(typeof _ndel_status).toBe('string')
            expect(typeof _ndel_name).toBe('string')
            expect(typeof _ndel_uri).toBe('string')
            //expect(typeof _ndel_createdby).toBe('string')
            expect(typeof _ndel_updated).toBe('string')
            //expect(typeof _ndel_action).toBe('string')

            vex_del_namelist.push(`${_ndel_name}`) //added name to the list

        }
        const delvexString = vex_del_namelist.find(item => item === tmp);

        if (!delvexString) {
            console.log(`Array contains the string '${tmp}'.`);
            console.log("New Vex management deleted successfully!")
        }
        else {
            console.log(`Array does not contain the string '${tmp}'.`);
            throw new Error("Delete new Vex management test failed!")
        }

    })


    test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > DELETE MULTIPLE ", async ({ page }, testInfo) => {

        const randstr = await generateRandomString(5)
        const tmp = sharedValue + randstr;

        console.log("================================================================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("================================================================================")

        //await navigateTo(page, "/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub")

        delay(page, 3000)
        console.log("URL: " + page.url())
        delay(page, 1000)

        //assert url matches to image api string
        await expect(page).toHaveURL('https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub')
        console.log("")

        const sbom_vex_menu = page.locator(".accordion.depth-0.expanded.group-highlight.has-children.package")
        ////await expect(sbom_vex_menu).toHaveScreenshot('\sbom_submenu_vex.png', { maxDiffPixels: 300 })

        // Verify the elements are loaded and visibled before proceeding 
        await isVisibled(page, sbom_images)


        /* Verify the vex management list
         */
        // Locate all the rows within the table
        const table = page.locator("table[role='table']");
        const rows = table.locator('tr');
        const rowCount = await rows.count();

        // Locate all the columns within the table
        const column = table.locator('th');
        const columnCount = await column.count();

        console.log("")
        console.log("--- < Table Before Multiple Delete >-----------------------------------------------------------------")
        console.log("# Number of rows:" + (rowCount - 1)) //eliminate 1 for row header
        console.log("# Number of columns:" + columnCount)
        console.log("--------------------------------------------------------------------------------------------")
        console.log("")

        //temp array
        let vex_namelist: string[] = []

        //First, if the table has no data, it should return the "There are no rows to show" text string on the first row
        //Fail the test if it does not show or unmatched

        if (rowCount == 0) {
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
        else if (rowCount > 0 && rowCount < 2) {
            throw new Error(" Failed this test case since the table contains less than 2 rows for multiple deletion ")
        }
        else {

            // Loop through each row
            for (let i = 0; i < rowCount - 1; i++) {

                const _checkbox = await table.locator(`tr:nth-of-type(${i + 1}) > .row-check`).textContent()
                const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()
                const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                const _uri = await table.locator(`tr:nth-of-type(${i + 1}) > .col-uri-external-link`).textContent()
                //const _createdby = await table.locator(`tr:nth-of-type(${i + 1}) > tr:nth-of-type(1) > td:nth-of-type(5)`).textContent()

                const _updated = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-date-formatter`).textContent()

                //const _action = await table.locator(`tr:nth-of-type(${i + 1}) > .role-link .icon-actions`).textContent()

                expect(typeof _checkbox).toBe('string')
                expect(typeof _status).toBe('string')
                expect(typeof _name).toBe('string')
                expect(typeof _uri).toBe('string')
                //expect(typeof _createdby).toBe('string')
                expect(typeof _updated).toBe('string')
                //expect(typeof _action).toBe('string')

                vex_namelist.push(`${_name}`) //added the name to an array list

            }

            /*
                Check the first two rows
            */

            await page.locator("tr:nth-of-type(1) > .row-check").click()
            await delay(page, 2000)
            await page.locator("tr:nth-of-type(2) > .row-check").click()
            await delay(page, 2000)
            await page.locator("button#promptRemove > span").click() //delete btn
            await delay(page, 1000)
            await expect(page.locator("[role='dialog']")).toBeVisible();
            (await page.locator(".card-body").innerText()).includes("You are attempting to delete the Vex Management ")

            await userClickByElem(page, "div#focus-trap-card-container-element button[role='button'] > span") //confirm delete btn


        }



        /* 
            --- Multiple Delete validation --- 
        */
        //temp array
        await delay(page, 2000)
        await page.reload();
        await delay(page, 2000)
        const ntable = page.locator("table[role='table']");
        const nrows = ntable.locator('tr');
        const nrowCount = await nrows.count();

        console.log("")
        console.log("--- < Table After Create > ---------------------------------------------------------------")
        console.log("# Number of rows after multiple deletion:" + (nrowCount - 1)) //eliminate 1 for row header
        console.log("------------------------------------------------------------------------------------------")
        console.log("")

        /*
            confirm vex management deletion
        */
        console.log("")
        console.log("Before multiple deletion ====> " + (rowCount - 3))
        console.log("After multiple deletion ====>" + (nrowCount - 1))

        /* compare before and after of the row count */
        if ((rowCount - 3) == (nrowCount - 1)) {
            console.log(` * Number of rows matches the before and after multiple vex management deletion.`);
            console.log(" * Multiple Vex management deleted successfully!")
        }
        else {
            throw new Error(" *** Multiple Vex management deletion test failed!")
        }

    })


    test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > ENABLE OR DISABLE FROM 3dot MENU ", async ({ page }, testInfo) => {

        console.log("================================================================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("================================================================================")

        await navigateTo(page, "/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub")

        delay(page, 3000)
        console.log("URL: " + page.url())
        delay(page, 1000)

        //assert url matches to image api string
        await expect(page).toHaveURL('https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub')
        console.log("")

        const sbom_vex_menu = page.locator(".accordion.depth-0.expanded.group-highlight.has-children.package")
        ////await expect(sbom_vex_menu).toHaveScreenshot('\sbom_submenu_vex.png', { maxDiffPixels: 300 })


        // Verify the elements are loaded and visibled before proceeding 
        await isVisibled(page, sbom_images)

        // Locate all the rows within the table
        const table = page.locator("table[role='table']");
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

        if (rowCount == 0) {
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
            table.locator(`tr:nth-of-type(1) > .row-check`).click()
            // Loop through each row
            for (let i = 0; i < rowCount - 1; i++) {

                const _checkbox = await table.locator(`tr:nth-of-type(${i + 1}) > .row-check`).textContent()
                const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()
                const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                const _uri = await table.locator(`tr:nth-of-type(${i + 1}) > .col-uri-external-link`).textContent()
                //const _createdby = await table.locator(`tr:nth-of-type(${i + 1}) > [data-testid='sortable-cell-0-3']`).textContent()

                const _updated = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-date-formatter`).textContent()
                //const _action = await table.locator(`tr:nth-of-type(${i + 1}) > .role-link .icon-actions`).textContent()

                expect(typeof _checkbox).toBe('string')
                expect(typeof _status).toBe('string')
                expect(typeof _name).toBe('string')
                expect(typeof _uri).toBe('string')
                //expect(typeof _createdby).toBe('string')
                expect(typeof _updated).toBe('string')
                //expect(typeof _action).toBe('string')
                //await userClickByElem(page, ".role-link .icon-actions")

            }


            //edit and click on first row 3dot menu
            const rowtoedit_checkbox = table.locator(`tr:nth-of-type(1) > .row-check`)
            const rowtoedit_name = await table.locator(`tr:nth-of-type(1) > .col-vex-name-link`).textContent()
            const rowtoedit_status = await table.locator(`tr:nth-of-type(1) > .col-vex-status-cell-badge`).textContent()

            const rowtoedit_action = table.locator("tr:nth-of-type(1) button[role='button'] > .icon.icon-actions")

            const enabled_action_menu = [
                ".v-popper__inner",
                "div[role='menu'] > div:nth-of-type(1)", //disable
                "div[role='menu'] > div:nth-of-type(2)", //Edit Configuration
                "div[role='menu'] > div:nth-of-type(3)", //Edit yaml
                "div[role='menu'] > div:nth-of-type(4)", //clone
                "div[role='menu'] > div:nth-of-type(5)"  //delete
            ]

            const disabled_action_menu = [
                ".v-popper__inner",
                "div[role='menu'] > div:nth-of-type(1)", //enable
                "div[role='menu'] > div:nth-of-type(2)", //clone
            ]



            await rowtoedit_checkbox.click()
            await rowtoedit_action.click()
            await delay(page, 1000)

            /* Action to disable/enable vex management */
            if (rowtoedit_status === "Enabled") {
                await isVisibled(page, enabled_action_menu) //confirm the menu is displayed
                await userClickByElem(page, "div[role='menu'] > div:nth-of-type(1)")  //changed from Enabled to Disable 
                await delay(page, 2000)

                page.reload();

                for (let i = 0; i < rowCount - 1; i++) {
                    const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                    const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()

                    if (_name === rowtoedit_name) {
                        console.log(_status === "Disabled") //verify the status has changed to Disabled
                    }

                }

            }
            else {
                await isVisibled(page, disabled_action_menu) //confirm the menu is displayed
                await userClickByElem(page, "div[role='menu'] > div:nth-of-type(1)")  //changed from Disabled to Enabled
                await delay(page, 2000)

                page.reload();

                for (let i = 0; i < rowCount - 1; i++) {
                    const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                    const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()

                    if (_name === rowtoedit_name) {
                        console.log(_status === "Enabled") //verify the status has changed to Disabled
                    }
                }

            }

        }


    })


    test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > DELETE FROM 3dot MENU ", async ({ page }, testInfo) => {

        console.log("================================================================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("================================================================================")

        await navigateTo(page, "/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub")

        delay(page, 3000)
        console.log("URL: " + page.url())
        delay(page, 1000)

        //assert url matches to image api string
        await expect(page).toHaveURL('https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub')
        console.log("")

        const sbom_vex_menu = page.locator(".accordion.depth-0.expanded.group-highlight.has-children.package")
        ////await expect(sbom_vex_menu).toHaveScreenshot('\sbom_submenu_vex.png', { maxDiffPixels: 300 })

        // Verify the elements are loaded and visibled before proceeding 
        await isVisibled(page, sbom_images)

        // Locate all the rows within the table
        const table = page.locator("table[role='table']");
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

        if (rowCount == 0) {
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
            table.locator(`tr:nth-of-type(1) > .row-check`).click()
            // Loop through each row
            for (let i = 0; i < rowCount - 1; i++) {

                const _checkbox = await table.locator(`tr:nth-of-type(${i + 1}) > .row-check`).textContent()
                const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()
                const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                const _uri = await table.locator(`tr:nth-of-type(${i + 1}) > .col-uri-external-link`).textContent()
                //const _createdby = await table.locator(`tr:nth-of-type(${i + 1}) > [data-testid='sortable-cell-0-3']`).textContent()

                const _updated = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-date-formatter`).textContent()
                //const _action = await table.locator(`tr:nth-of-type(${i + 1}) > .role-link .icon-actions`).textContent()

                expect(typeof _checkbox).toBe('string')
                expect(typeof _status).toBe('string')
                expect(typeof _name).toBe('string')
                expect(typeof _uri).toBe('string')
                //expect(typeof _createdby).toBe('string')
                expect(typeof _updated).toBe('string')
                //expect(typeof _action).toBe('string')
                //await userClickByElem(page, ".role-link .icon-actions")

            }


            //edit and click on first row 3dot menu
            const rowtoDelete_checkbox = table.locator(`tr:nth-of-type(1) > .row-check`)
            const rowtoDelete_name = await table.locator(`tr:nth-of-type(1) > .col-vex-name-link`).textContent()
            const rowtoDelete_status = await table.locator(`tr:nth-of-type(1) > .col-vex-status-cell-badge`).textContent()

            const rowtoDelete_action = table.locator("tr:nth-of-type(1) button[role='button'] > .icon.icon-actions")

            const enabled_action_menu = [
                ".v-popper__inner",
                "div[role='menu'] > div:nth-of-type(1)", //disable
                "div[role='menu'] > div:nth-of-type(2)", //Edit Configuration
                "div[role='menu'] > div:nth-of-type(3)", //Edit yaml
                "div[role='menu'] > div:nth-of-type(4)", //clone
                "div[role='menu'] > div:nth-of-type(5)"  //delete
            ]

            const disabled_action_menu = [
                ".v-popper__inner",
                "div[role='menu'] > div:nth-of-type(1)", //enable
                "div[role='menu'] > div:nth-of-type(2)", //clone
            ]



            await rowtoDelete_checkbox.click() //click on the first row item to be deleted
            await rowtoDelete_action.click()
            await delay(page, 1000)


            /* Action to disable/enable vex management */
            if (rowtoDelete_status === "Enabled") {
                await isVisibled(page, enabled_action_menu) //confirm the menu is displayed
                await userClickByElem(page, "div[role='menu'] > div:nth-of-type(5)")  //delete btn from the menu 
                await delay(page, 2000)

                await expect(page.locator("[role='dialog']")).toBeVisible();
                (await page.locator(".card-body").innerText()).includes("You are attempting to delete the Vex Management ")
                await userClickByElem(page, "div#focus-trap-card-container-element button[role='button'] > span") //confirm delete btn

                page.reload();

                /* Verify after delete 
                */
                // Locate all the rows within the table
                const ntable = page.locator("table[role='table']");
                const nrows = ntable.locator('tr');
                const nrowCount = await nrows.count();

                console.log("")
                console.log("---Table(1)-----------------------------------------------------------------")
                console.log("# Number of rows after delete:" + (nrowCount - 2)) //eliminate 1 for row header
                console.log("-------------------------------------------------------------------------\n")
                console.log("")

                for (let i = 0; i < (nrowCount - 2); i++) {

                    const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                    const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()

                    //confirm the deleted row isn't found

                    console.log(">>>>>>>>>>>>>>>>>>>>>>>>" + _name)
                    console.log("namedeleted>>>>>>>>>>>>>>>>>>>>>>>>" + rowtoDelete_name)

                    if (_name === rowtoDelete_name) { //failed the test if match found
                        throw new Error(" *** Delete from the menu failed!")
                    }
                }
            }
            else {

                await isVisibled(page, disabled_action_menu) //confirm the menu is displayed
                await userClickByElem(page, "div[role='menu'] > div:nth-of-type(1)")  //changed from Disabled to Enabled
                await delay(page, 2000)

                await rowtoDelete_action.click() //click the menu again, ves management is enabled now
                await isVisibled(page, enabled_action_menu) //confirm the menu is displayed
                await userClickByElem(page, "div[role='menu'] > div:nth-of-type(5)")  //delete btn from the menu

                await expect(page.locator("[role='dialog']")).toBeVisible();
                (await page.locator(".card-body").innerText()).includes("You are attempting to delete the Vex Management ")
                await userClickByElem(page, "div#focus-trap-card-container-element button[role='button'] > span") //confirm delete btn

                await delay(page, 2000)

                page.reload();

                // Locate all the rows within the table
                const ntable = page.locator("table[role='table']");
                const nrows = ntable.locator('tr');
                const nrowCount = await nrows.count();

                console.log("")
                console.log("---Table(2)-----------------------------------------------------------------")
                console.log("# Number of rows after delete:" + (nrowCount - 2)) //eliminate 1 for row header
                console.log("-------------------------------------------------------------------------\n")
                console.log("")

                for (let i = 0; i < (nrowCount - 2); i++) {
                    const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                    const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()

                    if (_name === rowtoDelete_name) { //fail the test if a match found
                        throw new Error(" *** Delete from the menu failed! [After changing disabled to enabled]")
                    }
                }
            }
        }
    })


    test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > CLONE FROM 3dot MENU ", async ({ page }, testInfo) => {

        console.log("================================================================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("================================================================================")

        await navigateTo(page, "/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub")

        delay(page, 3000)
        console.log("URL: " + page.url())
        delay(page, 1000)

        //assert url matches to image api string
        await expect(page).toHaveURL('https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub')
        console.log("")

        const sbom_vex_menu = page.locator(".accordion.depth-0.expanded.group-highlight.has-children.package")
        ////await expect(sbom_vex_menu).toHaveScreenshot('\sbom_submenu_vex.png', { maxDiffPixels: 300 })


        // Verify the elements are loaded and visibled before proceeding 
        await isVisibled(page, sbom_images)

        // Locate all the rows within the table
        const table = page.locator("table[role='table']");
        const rows = table.locator('tr');
        const rowCount = await rows.count();

        // Locate all the columns within the table
        const column = table.locator('th');
        const columnCount = await column.count();

        console.log("")
        console.log("--- < Table before cloning >-----------------------------------------------------------------")
        console.log("# Number of rows:" + (rowCount - 1)) //eliminate 1 for row header
        console.log("---------------------------------------------------------------------------------------------")

        //First, if the table has no data, it should return the "There are no rows to show" text string on the first row
        //Fail the test if it does not show or unmatched

        if (rowCount == 0) {
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
            table.locator(`tr:nth-of-type(1) > .row-check`).click()
            // Loop through each row
            for (let i = 0; i < rowCount - 1; i++) {

                const _checkbox = await table.locator(`tr:nth-of-type(${i + 1}) > .row-check`).textContent()
                const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()
                const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                const _uri = await table.locator(`tr:nth-of-type(${i + 1}) > .col-uri-external-link`).textContent()
                const _updated = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-date-formatter`).textContent()
                //const _action = await table.locator(`tr:nth-of-type(${i + 1}) > .role-link .icon-actions`).textContent()

                expect(typeof _checkbox).toBe('string')
                expect(typeof _status).toBe('string')
                expect(typeof _name).toBe('string')
                expect(typeof _uri).toBe('string')
                expect(typeof _updated).toBe('string')
                //expect(typeof _action).toBe('string')
                //await userClickByElem(page, ".role-link .icon-actions")

            }


            //edit and click on first row 3dot menu
            const rowtoClone_checkbox = table.locator(`tr:nth-of-type(1) > .row-check`)
            const rowtoClone_name = await table.locator(`tr:nth-of-type(1) > .col-vex-name-link`).textContent()
            const rowtoClone_status = await table.locator(`tr:nth-of-type(1) > .col-vex-status-cell-badge`).textContent()
            const rowtoClone_uri = await table.locator(`tr:nth-of-type(1) > .col-uri-external-link`).textContent()

            const rowtoClone_action = table.locator("tr:nth-of-type(1) button[role='button'] > .icon.icon-actions")

            const enabled_action_menu = [
                ".v-popper__inner",
                "div[role='menu'] > div:nth-of-type(1)", //disable
                "div[role='menu'] > div:nth-of-type(2)", //Edit Configuration
                "div[role='menu'] > div:nth-of-type(3)", //Edit yaml
                "div[role='menu'] > div:nth-of-type(4)", //clone
                "div[role='menu'] > div:nth-of-type(5)"  //delete
            ]

            const disabled_action_menu = [
                ".v-popper__inner",
                "div[role='menu'] > div:nth-of-type(1)", //enable
                "div[role='menu'] > div:nth-of-type(2)", //clone
            ]

            /* 
                click on the first row item to be cloned
            */
            await rowtoClone_checkbox.click()
            await rowtoClone_action.click()
            await delay(page, 1000)


            //temp array
            let vex_namelist: string[] = []

            /* Action to disable/enable vex management */
            if (rowtoClone_status === "Enabled") {
                await isVisibled(page, enabled_action_menu) //confirm the menu is displayed
                await userClickByElem(page, "div[role='menu'] > div:nth-of-type(4)")  //clone btn from the menu 
                await delay(page, 1000)

                //await expect(page.locator("[role='dialog']")).toBeVisible();
                //(await page.locator(".card-body").innerText()).includes("You are attempting to delete the Vex Management ")
                //await userClickByElem(page, "div#focus-trap-card-container-element button[role='button'] > span") //confirm delete btn

                //https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub/uitestx88pc?mode=clone

                await expect(page).toHaveURL("https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub/" + rowtoClone_name + "?mode=clone")

                await delay(page, 2000)

                await userClickByElem(page, "[data-testid='NameNsDescriptionNameInput']") //clone name
                await userPresskey(page, "[data-testid='NameNsDescriptionNameInput']", "clone" + rowtoClone_name)
                await userClickByElem(page, ".col.span-6 > .create.labeled-input") //clone description
                await userPresskey(page, ".col.span-6 > .create.labeled-input", "this is cloning test")

                //compare the selected uri and in the clone dialog
                const vexhub_uri = await page.locator("[class='col span-9'] [aria-disabled]")
                const vex_uri_value = await vexhub_uri.getAttribute('value');

                //compare the selected uri and in the clone dialog
                console.log("from table: " + rowtoClone_uri)
                console.log("from clone: " + vex_uri_value)

                if ((rowtoClone_uri?.trim() === vex_uri_value?.trim())) {
                    console.log(`Passed: ${rowtoClone_uri} is comparable to ${vex_uri_value}`)
                }
                else {
                    throw new Error(` *** Failed: The clone uri has incomparable string ${rowtoClone_uri} and ${vex_uri_value}`)
                }

                /* Confirm the Create clone button 
                */
                await userClickByElem(page, "button[role='button'] > span")
                await delay(page, 1000)


                /* Verify after cloning
                */
                // Locate all the rows within the table
                page.reload()

                const ntable = page.locator("table[role='table']");
                const nrows = ntable.locator('tr');
                const nrowCount = await nrows.count();

                console.log("")
                console.log("--- < Table after cloning > -----------------------------------------------------------------")
                console.log("# Number of rows after cloning:" + (nrowCount - 2)) //eliminate 1 for row header
                console.log("---------------------------------------------------------------------------------------------")
                console.log("")


                for (let i = 0; i < (nrowCount - 2); i++) {

                    const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                    const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()

                    //confirm the deleted row isn't found

                    console.log(">>>> " + _name)

                    //push the vex name into temp array
                    vex_namelist.push(`${_name}`)

                }
            }
            else { //same action as enabled though...

                await isVisibled(page, disabled_action_menu) //confirm the menu is displayed
                await userClickByElem(page, "div[role='menu'] > div:nth-of-type(2)")  //click clone button
                await delay(page, 2000)

                await expect(page).toHaveURL("https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub/" + rowtoClone_name + "?mode=clone")

                await delay(page, 2000)

                await userClickByElem(page, "[data-testid='NameNsDescriptionNameInput']") //clone name
                await userPresskey(page, "[data-testid='NameNsDescriptionNameInput']", "clone" + rowtoClone_name)
                await userClickByElem(page, ".col.span-6 > .create.labeled-input") //clone description
                await userPresskey(page, ".col.span-6 > .create.labeled-input", "this is cloning test")

                const vexhub_uri = await page.locator("[class='col span-9'] [aria-disabled]")
                const vex_uri_value = await vexhub_uri.getAttribute('value');

                //compare the selected uri and in the clone dialog
                console.log("from table: ---" + rowtoClone_uri + "---")
                console.log("from clone: ---" + vex_uri_value + "---")

                if ((rowtoClone_uri?.trim() === vex_uri_value?.trim())) {
                    console.log(`Passed: ${rowtoClone_uri} is comparable to ${vex_uri_value}`)
                }
                else {
                    throw new Error(` *** Failed: The clone uri has incomparable string ${rowtoClone_uri} and ${vex_uri_value}`)
                }

                /* Confirm the Create clone button 
                */
                await userClickByElem(page, "button[role='button'] > span")
                await delay(page, 1000)


                /* Verify after cloning
                */
                // Locate all the rows within the table
                page.reload()

                const ntable = page.locator("table[role='table']");
                const nrows = ntable.locator('tr');
                const nrowCount = await nrows.count();

                console.log("")
                console.log("--- < Table after cloning > -----------------------------------------------------------------")
                console.log("# Number of rows after cloning:" + (nrowCount - 2)) //eliminate 1 for row header
                console.log("---------------------------------------------------------------------------------------------")
                console.log("")

                //temp array
                ///////////let vex_namelist: string[] = []

                for (let i = 0; i < (nrowCount - 2); i++) {

                    const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                    const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()

                    //confirm the deleted row isn't found

                    console.log(">>>> " + _name)

                    //push the vex name into temp array
                    vex_namelist.push(`${_name}`)

                }


            }

            /* Confirm and validate cloned vex management 
            */
            const foundCloneString = vex_namelist.find(item => item === "clone" + rowtoClone_name);

            if (foundCloneString) {
                console.log(`Array contains the string clone${rowtoClone_name}.`);
                console.log("Cloned Vex management created successfully!")
            }
            else {
                console.log(`Array does not contain the string clone${rowtoClone_name}.`);
                throw new Error("Create new Vex management test failed!")
            }



        }
    })

 
    test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > EDIT CONFIGURATION FROM 3dot MENU ", async ({ page }, testInfo) => {
        const randstr = await generateRandomString(5)
        const tmp = sharedValue + randstr;

        console.log("================================================================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("================================================================================")

        await navigateTo(page, "/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub")

        delay(page, 3000)
        console.log("URL: " + page.url())
        delay(page, 1000)

        //assert url matches to image api string
        await expect(page).toHaveURL('https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub')
        console.log("")

        const sbom_vex_menu = page.locator(".accordion.depth-0.expanded.group-highlight.has-children.package")
        ////await expect(sbom_vex_menu).toHaveScreenshot('\sbom_submenu_vex.png', { maxDiffPixels: 300 })

        // Verify the elements are loaded and visibled before proceeding 
        await isVisibled(page, sbom_images)


        // Locate all the rows within the table
        const table = page.locator("table[role='table']");
        const rows = table.locator('tr');
        const rowCount = await rows.count();

        // Locate all the columns within the table
        const column = table.locator('th');
        const columnCount = await column.count();

        console.log("")
        console.log("--- < Table before editing configuration >---------------------------------------------------")
        console.log("# Number of rows:" + (rowCount - 1)) //eliminate 1 for row header
        console.log("---------------------------------------------------------------------------------------------")

        //First, if the table has no data, it should return the "There are no rows to show" text string on the first row
        //Fail the test if it does not show or unmatched

        if (rowCount == 0) {
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
            table.locator(`tr:nth-of-type(1) > .row-check`).click()
            // Loop through each row
            for (let i = 0; i < rowCount - 1; i++) {

                const _checkbox = await table.locator(`tr:nth-of-type(${i + 1}) > .row-check`).textContent()
                const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()
                const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                const _uri = await table.locator(`tr:nth-of-type(${i + 1}) > .col-uri-external-link`).textContent()
                const _updated = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-date-formatter`).textContent()
                //const _action = await table.locator(`tr:nth-of-type(${i + 1}) > .role-link .icon-actions`).textContent()

                expect(typeof _checkbox).toBe('string')
                expect(typeof _status).toBe('string')
                expect(typeof _name).toBe('string')
                expect(typeof _uri).toBe('string')
                expect(typeof _updated).toBe('string')
                //expect(typeof _action).toBe('string')
                //await userClickByElem(page, ".role-link .icon-actions")

            }

            //edit and click on first row 3dot menu
            const rowtoEditConfig_checkbox = table.locator(`tr:nth-of-type(1) > .row-check`)
            const rowtoEditConfig_name = await table.locator(`tr:nth-of-type(1) > .col-vex-name-link`).textContent()
            const rowtoEditConfig_status = await table.locator(`tr:nth-of-type(1) > .col-vex-status-cell-badge`).textContent()
            const rowtoEditConfig_uri = await table.locator(`tr:nth-of-type(1) > .col-uri-external-link`).textContent()

            const rowtoEditConfig_action = table.locator("tr:nth-of-type(1) button[role='button'] > .icon.icon-actions")

            const enabled_action_menu = [
                ".v-popper__inner",
                "div[role='menu'] > div:nth-of-type(1)", //disable
                "div[role='menu'] > div:nth-of-type(2)", //Edit Configuration
                "div[role='menu'] > div:nth-of-type(3)", //Edit yaml
                "div[role='menu'] > div:nth-of-type(4)", //clone
                "div[role='menu'] > div:nth-of-type(5)"  //delete
            ]

            const disabled_action_menu = [
                ".v-popper__inner",
                "div[role='menu'] > div:nth-of-type(1)", //enable
                "div[role='menu'] > div:nth-of-type(2)", //clone
            ]

            /* 
                click on the first row item to be Edited
            */
            await rowtoEditConfig_checkbox.click()
            await rowtoEditConfig_action.click()
            await delay(page, 1000)

            //temp array
            let vex_namelist: string[] = []

            /* Action to disable/enable vex management */
            if (rowtoEditConfig_status === "Enabled") {
                await isVisibled(page, enabled_action_menu) //confirm the menu is displayed
                await userClickByElem(page, "div[role='menu'] > div:nth-of-type(2)")  //Edit Configuration btn from the menu 
                await delay(page, 1000)

                //Edit the config
                await expect(page).toHaveURL("https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub/" + rowtoEditConfig_name + "?mode=edit")
                await delay(page, 2000)

            
                await userClickByElem(page, "[class='col span-9'] [aria-disabled]") //click the input box
                await page.locator("[class='col span-9'] [aria-disabled]").selectText() //select all text for delete
                await userPresskey(page, "[class='col span-9'] [aria-disabled]", rowtoEditConfig_uri + "_" + tmp + "_edited")

                /* Confirm the Create clone button 
                */
                await userClickByElem(page, "button[role='button'] > span") //Save btn
                await delay(page, 1000)


                /* Verify after cloning
                */
                // Locate all the rows within the table
                page.reload()

                const ntable = page.locator("table[role='table']");
                const nrows = ntable.locator('tr');
                const nrowCount = await nrows.count();

                console.log("")
                console.log("--- < Table after Edit Config > -----------------------------------------------------------------")
                console.log("# Number of rows after editing config:" + (nrowCount - 1)) //eliminate 1 for row header
                console.log("-------------------------------------------------------------------------------------------------")
                console.log("")


                for (let i = 0; i < (nrowCount - 1); i++) {

                    const _nname = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                    const _nstatus = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()
                    const _nuri = await table.locator(`tr:nth-of-type(${i + 1}) > .col-uri-external-link`).textContent()

                    //compare strings after edit
                    if (_nname == `${rowtoEditConfig_name}`) {

                        expect(_nuri).toBe(rowtoEditConfig_uri + "_" + tmp + "_edited ")
                    }
                    else {
                        //do nothing
                    }

                }
            }
            // vex is disabled, enabled it and do the same action as above ...
            else {

                await isVisibled(page, disabled_action_menu) //confirm the menu is displayed
                await userClickByElem(page, "div[role='menu'] > div:nth-of-type(1)")  //click Enable button
                await delay(page, 2000)

                //Same as enabled steps
                await rowtoEditConfig_action.click() //click from for action menu again
                await isVisibled(page, enabled_action_menu) //confirm the menu is displayed
                await userClickByElem(page, "div[role='menu'] > div:nth-of-type(2)")  //Edit Configuration btn from the menu 
                await delay(page, 1000)

                //Edit the config
                await expect(page).toHaveURL("https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub/" + rowtoEditConfig_name + "?mode=edit")
                await delay(page, 2000)

                await userClickByElem(page, "[class='col span-9'] [aria-disabled]") //click the input box
                await page.locator("[class='col span-9'] [aria-disabled]").selectText() //select all text for delete
                await userPresskey(page, "[class='col span-9'] [aria-disabled]", rowtoEditConfig_uri + "_" + tmp + "_edited")

                /* Confirm the Create clone button 
                */
                await userClickByElem(page, "button[role='button'] > span") //Save btn
                await delay(page, 1000)


                /* Verify after cloning
                */
                // Locate all the rows within the table
                page.reload()

                const ntable = page.locator("table[role='table']");
                const nrows = ntable.locator('tr');
                const nrowCount = await nrows.count();

                console.log("")
                console.log("--- < Table after Edit Config > -----------------------------------------------------------------")
                console.log("# Number of rows after editing config:" + (nrowCount - 1)) //eliminate 1 for row header
                console.log("-------------------------------------------------------------------------------------------------")
                console.log("")


                for (let i = 0; i < (nrowCount - 1); i++) {

                    const _nname = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                    const _nstatus = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()
                    const _nuri = await table.locator(`tr:nth-of-type(${i + 1}) > .col-uri-external-link`).textContent()

                    //compare strings after edit
                    if (_nname == `${rowtoEditConfig_name}`) {

                        expect(_nuri).toBe(rowtoEditConfig_uri + "_" + tmp + "_edited ")
                    }
                    else {
                        //do nothing
                    }


                }

            }


        }
    })


    test("SBOMSCANNER > ADVANCES > VEX MANAGEMENT > EDIT YAML FROM 3dot MENU ", async ({ page }, testInfo) => {

        console.log("================================================================================")
        console.log(`Running test: ${testInfo.title}`);
        //console.log(`Test path: ${testInfo.titlePath}`);
        console.log("================================================================================")

        await navigateTo(page, "/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub")

        delay(page, 3000)
        console.log("URL: " + page.url())
        delay(page, 1000)

        //assert url matches to image api string
        await expect(page).toHaveURL('https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub')
        console.log("")

        const sbom_vex_menu = page.locator(".accordion.depth-0.expanded.group-highlight.has-children.package")
        ////await expect(sbom_vex_menu).toHaveScreenshot('\sbom_submenu_vex.png', { maxDiffPixels: 300 })

        // Verify the elements are loaded and visibled before proceeding 
        await isVisibled(page, sbom_images)

        // Locate all the rows within the table
        const table = page.locator("table[role='table']");
        const rows = table.locator('tr');
        const rowCount = await rows.count();

        // Locate all the columns within the table
        const column = table.locator('th');
        const columnCount = await column.count();

        console.log("")
        console.log("--- < Table before editing yaml >------------------------------------------------------------")
        console.log("# Number of rows:" + (rowCount - 1)) //eliminate 1 for row header
        console.log("---------------------------------------------------------------------------------------------")

        //First, if the table has no data, it should return the "There are no rows to show" text string on the first row
        //Fail the test if it does not show or unmatched

        if (rowCount == 0) {
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
            table.locator(`tr:nth-of-type(1) > .row-check`).click()
            // Loop through each row
            for (let i = 0; i < rowCount - 1; i++) {

                const _checkbox = await table.locator(`tr:nth-of-type(${i + 1}) > .row-check`).textContent()
                const _status = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-status-cell-badge`).textContent()
                const _name = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-name-link`).textContent()
                const _uri = await table.locator(`tr:nth-of-type(${i + 1}) > .col-uri-external-link`).textContent()
                const _updated = await table.locator(`tr:nth-of-type(${i + 1}) > .col-vex-date-formatter`).textContent()
                //const _action = await table.locator(`tr:nth-of-type(${i + 1}) > .role-link .icon-actions`).textContent()

                expect(typeof _checkbox).toBe('string')
                expect(typeof _status).toBe('string')
                expect(typeof _name).toBe('string')
                expect(typeof _uri).toBe('string')
                expect(typeof _updated).toBe('string')
                //expect(typeof _action).toBe('string')
                //await userClickByElem(page, ".role-link .icon-actions")

            }


            //edit and click on first row 3dot menu
            const rowtoEditYAML_checkbox = table.locator(`tr:nth-of-type(1) > .row-check`)
            const rowtoEditYAML_name = await table.locator(`tr:nth-of-type(1) > .col-vex-name-link`).textContent()
            const rowtoEditYAML_status = await table.locator(`tr:nth-of-type(1) > .col-vex-status-cell-badge`).textContent()
            const rowtoEditYAML_uri = await table.locator(`tr:nth-of-type(1) > .col-uri-external-link`).textContent()

            const rowtoEditYAML_action = table.locator("tr:nth-of-type(1) button[role='button'] > .icon.icon-actions")

            const enabled_action_menu = [
                ".v-popper__inner",
                "div[role='menu'] > div:nth-of-type(1)", //disable
                "div[role='menu'] > div:nth-of-type(2)", //Edit Configuration
                "div[role='menu'] > div:nth-of-type(3)", //Edit yaml
                "div[role='menu'] > div:nth-of-type(4)", //clone
                "div[role='menu'] > div:nth-of-type(5)"  //delete
            ]

            const disabled_action_menu = [
                ".v-popper__inner",
                "div[role='menu'] > div:nth-of-type(1)", //enable
                "div[role='menu'] > div:nth-of-type(2)", //clone
            ]

            /* 
                click on the first row item to be Edited
            */
            await rowtoEditYAML_checkbox.click()
            await rowtoEditYAML_action.click()
            await delay(page, 1000)

            //temp array
            let vex_namelist: string[] = []

            /* Action to disable/enable vex management */
            if (rowtoEditYAML_status === "Enabled") {
                await isVisibled(page, enabled_action_menu) //confirm the menu is displayed
                await userClickByElem(page, "div[role='menu'] > div:nth-of-type(3)")  //Edit YAML btn from the menu 
                await delay(page, 1000)

                //Edit the config
                await expect(page).toHaveURL("https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub/" + rowtoEditYAML_name + "?mode=edit&as=yaml")
                                             
                await delay(page, 2000)

                //Do nothing... just confirm there's no misbehaviors by editing this page

                //await userClickByElem(page, "[class='col span-9'] [aria-disabled]") //click the input box
                //await userPresskey(page, "[class='col span-9'] [aria-disabled]", rowtoEditYAML_uri + "_edited")

                /* Confirm the Create clone button 
                */
                await userClickByElem(page, ".right > button[role='button'] > span") //Save btn
                await delay(page, 1000)


                /* Verify after cloning
                */
                // Locate all the rows within the table
                page.reload()

                
            }

            // vex is disabled, enabled it and do the same action as above ...
            else {

                await isVisibled(page, disabled_action_menu) //confirm the menu is displayed
                await userClickByElem(page, "div[role='menu'] > div:nth-of-type(1)")  //click Enable button
                await delay(page, 2000)

                //Same as enabled steps
                await rowtoEditYAML_action.click() //click from for action menu again
                await isVisibled(page, enabled_action_menu) //confirm the menu is displayed
                await userClickByElem(page, "div[role='menu'] > div:nth-of-type(3)")  //Edit YAML btn from the menu 
                await delay(page, 1000)

                //Edit the config
                await expect(page).toHaveURL("https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub/" + rowtoEditYAML_name + "?mode=edit&as=yaml")
            
                await delay(page, 2000)

                //do nothing here, just confirm no misbehaviors editing the page

                //await userClickByElem(page, "[class='col span-9'] [aria-disabled]") //click the input box
                //await userPresskey(page, "[class='col span-9'] [aria-disabled]", rowtoEditConfig_uri + "_edited")

                /* Confirm the Create clone button 
                */
                await userClickByElem(page, ".right > button[role='button'] > span") //Save btn
                await delay(page, 1000)


                /* Verify after cloning
                */
                // Locate all the rows within the table
                page.reload()

            }

        }
    })

    /////////// adding more false negative test cases to verify no unexpected behaviours




}) //the end

