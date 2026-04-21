/* Filename: sbomscanner_images.test.ts 
*/

import { chromium, expect, Page } from "@playwright/test"
import * as custom from '../utils/commands.ts'
import { test } from "../fixture/fixture.ts"

import { test as setup } from '@playwright/test';
const { delay, navigateTo, userClickByElem, userPresskey } = require('../utils/commands.ts');
const { clickMenu, isVisibled, isLoaded, retrInnerText, retrTextContent, userClickByText } = require('../utils/commands.ts');

import * as fs from 'fs';
import { Console } from 'console';
const outputFilePath: string = 'output.log';
const output = fs.createWriteStream(outputFilePath);

// Create a new console instance that writes to the file stream
const myConsole = new Console(output);

import { exec } from "child_process";


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


    test("SBOMSCANNER > PAGE ELEMENT VALIDATION ", async ({ page }, testInfo) => {

        console.log("======================================================================")
        console.log(`Running test: ${testInfo.title}`);
        console.log("======================================================================")

        await navigateTo(page, "/dashboard/home") //rancher home dashboard
        delay(page, 3000)
        console.log("URL: " + page.url())
        delay(page, 1000)


        await userClickByElem(page, ".rancher-provider-icon") //click on rancher icon
        await userClickByElem(page, 'span:has-text("SBOMScanner")') //click on SBOMScanner text link
        await delay(page, 2000)

        //assert url matches to image api string
        console.log("URL: " + page.url())
        expect(page).toHaveURL("https://RANCHERURL/dashboard/c/local/imageScanner/dashboard")

        //assert by screenshot
        const scannermenu = page.locator(".accordion.depth-0.expanded.group-highlight.has-children.package")
        await expect(scannermenu).toHaveScreenshot('\sbom_dashboard_submenu.png', { maxDiffPixels: 300 })

        console.log("")

        const sbom_dashboard_elem = [".header-section .title",
            ".page > .summary-section",
            ".filter-dropdown",
            ".scanning-stats",
            ".scanning-stats .scan-stat:nth-of-type(1)",
            ".scanning-stats > .failed.scan-stat",
            ".scanning-stats > .error.scan-stat"
        ]


        const scan_count = page.locator(".scanning-stats").count;

            const count = await page.locator('.scanning-stats').count();
            if (count > 0) {
                    console.log('Registry scan stat');
                    await isVisibled(page, sbom_dashboard_elem)
            }
            else {
                const reg_no = page.locator("[data-testid='banner-content'] div")

                console.log("Registry scan has not started yet.")
                
                expect(reg_no).toContainText("The registry scan has not been started yet. Please add your registry and start scan.")
            
            }



        // Verify the elements are loaded and visibled before proceeding 
        //await isVisibled(page, sbom_elem)

    })



    test("SBOMSCANNER MENU NAVIGATION ", async ({ page }, testInfo) => {

        console.log("======================================================================")
        console.log(`Running test: ${testInfo.title}`);
        console.log("======================================================================")

        await navigateTo(page, "/dashboard/home") //rancher home dashboard
        delay(page, 3000)
        console.log("URL: " + page.url())
        delay(page, 1000)


        await userClickByElem(page, ".rancher-provider-icon") //click on rancher icon
        await delay(page, 2000)

        //assert url matches to image api string
        //console.log("URL: " + page.url())
        //expect(page).toHaveURL("https://RANCHERURL/dashboard/c/local/imageScanner/dashboard")


        console.log("")

        console.log("-- click SBOMScanner")
        await clickMenu(page, ['SBOMScanner']);
        await delay(page, 2000)
        expect(page).toHaveURL("https://RANCHERURL/dashboard/c/local/imageScanner/dashboard")


        console.log("-- click Images")
        await clickMenu(page, ['SBOMScanner', 'Images']);
        await delay(page, 2000)
        expect(page).toHaveURL("https://RANCHERURL/dashboard/c/local/imageScanner/images")

        //console.log("-- click Advanced")
        //await clickMenu(page, ['SBOMScanner', 'Advanced']);
        //await delay(page, 2000)

        console.log("-- click to Workloads Scan")
        await clickMenu(page, ['Advanced', 'Workloads Scan']);
        expect(page).toHaveURL("https://RANCHERURL/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.workloadscanconfiguration/default?mode=edit")


        console.log("-- click to Reg config")
        await delay(page, 2000)
        await clickMenu(page, ['Advanced', 'Registries configuration']);
        expect(page).toHaveURL("https://RANCHERURL/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.registry")
        


        console.log("-- click to Vex")
        await delay(page, 2000)
        await clickMenu(page, ['Advanced', 'Vex Management']);
        expect(page).toHaveURL("https://RANCHERURL/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub")


    })

}) //the end

