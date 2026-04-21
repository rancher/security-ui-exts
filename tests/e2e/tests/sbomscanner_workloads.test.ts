/* Filename: sbomscanner_workloads.test.ts 
*/

import { chromium, expect, Page } from "@playwright/test"
import * as custom from '../utils/commands.ts'
import { test } from "../fixture/fixture.ts"

import { test as setup } from '@playwright/test';
const { delay, navigateTo, userClickByElem, userPresskey } = require('../utils/commands.ts');
const { clickMenu, isVisibled, isLoaded, retrInnerText, retrTextContent, userClickByText, clicommand } = require('../utils/commands.ts');

import * as fs from 'fs';
import { Console } from 'console';
const outputFilePath: string = 'output.log';
const output = fs.createWriteStream(outputFilePath);

// Create a new console instance that writes to the file stream
const myConsole = new Console(output);

import { exec } from "child_process";


test.describe("*** SBOMSCANNER UI TEST", () => {

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
        console.log(" ---------------------- ")
        console.log("")

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

        delay(page, 2000)

    })



    for (let m = 1; m < 6; m++) {
        test(`SBOMSCANNER > WORKLOADS SCAN ELEMENT NAVIGATION #${m}`, async ({ page }, testInfo) => {

            console.log("======================================================================")
            console.log(`Running test ${m}: ${testInfo.title}`);
            console.log("======================================================================")

            await navigateTo(page, "/dashboard/home") //rancher home dashboard
            delay(page, 3000)
            console.log("URL: " + page.url())
            delay(page, 1000)

            await userClickByElem(page, ".rancher-provider-icon") //click on rancher icon
            await delay(page, 2000)

            console.log("")

            console.log(" - click to Workloads Scan")
            await clickMenu(page, ['SBOMScanner', 'Advanced', 'Workloads Scan']);
            expect(page).toHaveURL("https://rancher212.nvqa.com/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.workloadscanconfiguration/default?mode=edit")


            /* Check if the Enabled checkbox is checked
            */
            const enabled_checkbox = page.locator(".col.span-12 > .checkbox-outer-container.has-clean-tooltip  span[role='checkbox']")
            const cb_valueAttribute = await enabled_checkbox.getAttribute('aria-checked');

            console.log("enabled checkbox value: " + cb_valueAttribute)
            console.log("")

            // Open the dropdown
            // 0 - artifact namespace
            // 1 - authentication
            // 2 - scan interval
            // 3 - OS
            // 4 - architecture
            // 5 - variant
            // allow insecure connection checkbox - div:nth-of-type(7) > div:nth-of-type(2) > .checkbox-align > .checkbox-outer-container.has-clean-tooltip > .checkbox-container
            // scan on registry change - div:nth-of-type(10) > div:nth-of-type(2) > .checkbox-align > .checkbox-outer-container.has-clean-tooltip  span[role='checkbox']


            const ns_dropdown = page.locator(".cru__content.resource-container > div:nth-of-type(5) > div:nth-of-type(1)") //namespace dropdown toggle
            const ns_valueAttribute = await ns_dropdown.getAttribute('tabindex');

            console.log("ns tabindex value: " + ns_valueAttribute)
            console.log("")


            if (ns_valueAttribute === "-1") {
                //do nothing
                console.log("ns toggle dropdown is disabled ... ...")
                console.log("")

            } else {

                await page.locator('.vs__dropdown-toggle').nth(0).click();
                // Wait for options to appear
                const ns_optionsLocator = page.locator('.vs__dropdown-option');
                const ns_options = await ns_optionsLocator.allTextContents();
                const h = ns_options.length
                // Pick random index
                const randomIndex_h = Math.floor(Math.random() * h);
                // Click random option
                await ns_optionsLocator.nth(randomIndex_h).click();

                console.log("namespace dropdown toggle")
                console.log("-------------------------")
                console.log(" - " + randomIndex_h)
                console.log(ns_options);
                console.log("")

            }




            await page.locator('.vs__dropdown-toggle').nth(1).click();
            // Wait for options to appear
            const auth_optionsLocator = page.locator('.vs__dropdown-option');
            const auth_options = await auth_optionsLocator.allTextContents();
            const i = auth_options.length
            // Pick random index
            const randomIndex_i = Math.floor(Math.random() * i);
            // Click random option
            await auth_optionsLocator.nth(randomIndex_i).click();

            console.log("authentication dropdown toggle")
            console.log("------------------------------")
            console.log(" - " + randomIndex_i)
            console.log(auth_options);
            console.log("")




            await page.locator('.vs__dropdown-toggle').nth(2).click();
            // Wait for options to appear
            const scaninterval_optionsLocator = page.locator('.vs__dropdown-option');
            const scaninterval_options = await scaninterval_optionsLocator.allTextContents();
            const j = scaninterval_options.length
            // Pick random index
            const randomIndex_j = Math.floor(Math.random() * j);
            // Click random option
            await scaninterval_optionsLocator.nth(randomIndex_j).click();

            console.log("scan interval dropdown toggle")
            console.log("-----------------------------")
            console.log(" - " + randomIndex_j)
            console.log(scaninterval_options);
            console.log("")




            await page.locator('.vs__dropdown-toggle').nth(3).click();
            // Wait for options to appear
            const OS_optionsLocator = page.locator('.vs__dropdown-option');
            const OS_options = await OS_optionsLocator.allTextContents();
            const k = OS_options.length
            // Pick random index
            const randomIndex_k = Math.floor(Math.random() * k);
            // Click random option
            await OS_optionsLocator.nth(randomIndex_k).click();

            console.log("OS dropdown toggle")
            console.log("------------------")
            console.log(" - " + randomIndex_k)
            console.log(OS_options);
            console.log("")




            await page.locator('.vs__dropdown-toggle').nth(4).click();
            // Wait for options to appear
            const architecture_optionsLocator = page.locator('.vs__dropdown-option');
            const architecture_options = await architecture_optionsLocator.allTextContents();
            const l = architecture_options.length
            // Pick random index
            const randomIndex_l = Math.floor(Math.random() * l);
            // Click random option
            await architecture_optionsLocator.nth(randomIndex_l).click();

            console.log("architecture dropdown toggle")
            console.log("----------------------------")
            console.log(" - " + randomIndex_l)
            console.log(architecture_options);
            console.log("")




            //const variant_status = page.locator('.vs__dropdown-toggle').nth(5)
            const variant_dropdown = page.locator(".mb-10.row-platforms > div:nth-of-type(3)")
            const v_valueAttribute = await variant_dropdown.getAttribute('tabindex');

            console.log("Variant tabindex value: " + v_valueAttribute)
            console.log("")

            if (v_valueAttribute === "-1") {
                //do nothing
                console.log("variant toggle dropdown is disabled ... ...")
                console.log("")
            } else {

                await page.locator('.vs__dropdown-toggle').nth(5).click();
                // Wait for options to appear
                const variant_optionsLocator = page.locator('.vs__dropdown-option');
                const variant_options = await variant_optionsLocator.allTextContents();
                const m = variant_options.length
                // Pick random index
                const randomIndex_m = Math.floor(Math.random() * m);
                // Click random option
                await variant_optionsLocator.nth(randomIndex_m).click();

                console.log("variant dropdown toggle")
                console.log("-----------------------")
                console.log("-->>" + variant_optionsLocator.nth(randomIndex_m))
                console.log(variant_options);
                console.log("")

            }


            await delay(page, 3000)

            /* lastly
            */
            const savebtn_status = page.locator(".btn.role-primary")

            if (await savebtn_status.isDisabled()) {
                console.log("Save button is disabled, ignore and do nothing");
            } else {
                console.log("Save button is enabled");
                userClickByElem(page, ".btn.role-primary") //click Save button

            }


        })
    }


}) //the end

