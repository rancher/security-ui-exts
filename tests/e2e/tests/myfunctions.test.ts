/* Filename: sbomscanner.test.ts 
*/

import { chromium, expect, Page } from "@playwright/test"
import * as custom from '../utils/commands.ts'
import { test } from "../fixture/fixture.ts"

//import data from '../uiversion.json' assert { type: "json" }

import { test as setup } from '@playwright/test';
const { wait, delay, navigateTo, userClickByElem, userPresskey } = require('../utils/commands.ts');
const { clickMenu, isVisibled, isLoaded, retrInnerText, retrTextContent, userClickByText } = require('../utils/commands.ts');


import * as fs from 'fs';
import { Console } from 'console';
const outputLogFilePath: string = 'output.log';
const mylog = fs.createWriteStream(outputLogFilePath);


// Create a new console instance that writes to the file stream
const myConsole = new Console(mylog);

import { exec } from "child_process";

//setup('create new page', async ({ }) => {
//        console.log('# Initializing new browser ...');
/*
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
*/
//    });


test.describe("*** Interception UI TEST", () => {

    //inner function
    /*
    async function testTimeout(page: Page, milliseconds: number) {
      await page.waitForTimeout(milliseconds);
    }
    */

    /*



        test.beforeEach(async ({ page }) => {
    
            console.log("------------------------")
            console.log("# Logging into Rancher #")
            console.log("------------------------")
            await page.goto('/');
           
            custom.wait(page, 2000)
    
            const elements = [
                ".login-welcome.text-center", // [Welcome to Rancher]
                ".edit.labeled-input", //Username Input box
                ".password > .create.labeled-input.suffix", //Password Input box
                ".create.labeled-input.suffix > .addon", //Show  password
                "button#submit", //Submit button
                "span[role='checkbox']" //Remember username checkbox
            ];
            
            custom.isVisibled(page, elements); //validate the page elements
    
            await page.waitForTimeout(3000);
             
            await page.click(".edit.labeled-input"); //click on Username input box
            await page.locator('.edit.labeled-input').pressSequentially('admin', { delay: 100 });
    
    
            //custom.user_click(page, ".edit.labeled-input");
            //custom.wait(page, 1000)
            //custom.user_type(page, ".edit.labeled-input", "admin");
    
            await page.click(".password > .create.labeled-input.suffix"); //click on Password input box
            await page.locator(".password > .create.labeled-input.suffix").pressSequentially('RANCHERUSERPASSWORD', { delay: 100 });
    
            //custom.user_click(page, ".password > .create.labeled-input.suffix");
            //custom.wait(page, 1000)
            //custom.user_type(page, ".password > .create.labeled-input.suffix", "RANCHERUSERPASSWORD");
    
    
            await page.click("button#submit") //submit to login
           
            await page.waitForTimeout(5000);
            
            //check url after login
            await expect(page).toHaveURL("https://RANCHERURL/dashboard/home");
        });
    */


    //--------------------------



    //--------------------------
    //verify image
    function verifyImageLoad(url: string): Promise<boolean> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true); //image is loaded successfully
            img.onerror = () => resolve(false); //image returns 404, corrupted, etc.
            img.src = url;
        })
    }

    function testdropdown() {

        //const selectElement = document.getElementById("vs__dropdown-toggle") as HTMLSelectElement
        //const selectElement = document.getElementsByClassName("vs__dropdown-toggle") as HTMLSelectElement

        //if(selectElement){
        //    console.log(" <== the value =====> " + selectElement.value)
        //}
        //else {
        //    console.error("dropdown element not found")
        //}

    }


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

        console.log("------------------------")
        console.log("# Prior Testing starts #")
        console.log("------------------------")

        //custom.wait(page, 2000)


    });


    test("001_INTERCEPTION  ***", async ({ page }) => {

        await navigateTo(page, "/dashboard/home")

        //click on rancher icon logo
        await userClickByElem(page, ".cluster-icon-menu.rancher-provider-icon.v-popper--has-tooltip  .cluster-local-logo > g > .rancher-icon-fill");
        //click on SBOMScanner menu
        await userClickByElem(page, "[class='accordion depth-0 expanded has-children group-highlight package'] > .accordion-item:nth-of-type(1) div"); //submenu SBOMScanner


        //Validate dashboard elements
        const sbom_dashboard_elems = [".header-section .title", //SBOMScanner dashboard title
            ".vs--unsearchable span", //All registries dropdown
            ".scanning-stats", //scanning stats
            ".scanning-stats .scan-stat:nth-of-type(1) .scan-value", //passed scan value
            ".failed.scan-stat > .scan-value", //failed scan value
            ".error.scan-stat > .scan-value" //error scan value
        ]

        //await userClickByElem(page, ".icon-user");

    })

    test("002_INTERCEPTION  ***", async ({ page }) => {

        await navigateTo(page, "/dashboard/home")
        await delay(page, 3000)

        //click on rancher icon logo
        await userClickByElem(page, ".cluster-icon-menu.rancher-provider-icon.v-popper--has-tooltip  .cluster-local-logo > g > .rancher-icon-fill");
        await delay(page, 3000)

        //click on SBOMScanner menu
        await userClickByElem(page, "div:nth-of-type(8)  div[role='button'] > a  span"); //submenu SBOMScanner
        await delay(page, 3000)

        await userClickByElem(page, "a[role='link'] > .label.no-icon"); //submenu Images
        await delay(page, 3000)

        // await retrInnerText(page, ".search-filters > div > div:nth-of-type(1) > label").then(mytext =>{
        //     console.log("==========>>>> "+ mytext)
        // })

        //await navigateTo(page, "/dashboard/c/local/imageScanner/images")

        const value = await retrInnerText(page, ".search-filters > div > div:nth-of-type(1) > label")
        console.log("=======================>" + value)

        //Validate dashboard elements
        const sbom_images_elems = []

        /*
         "a[role='link'] > .label.no-icon", //submenu Image 
         .outlet.page  .title //Image title
         div:nth-of-type(2) > .btn.role-primary //Download full report button
         .search-filters //search filter

         div:nth-of-type(1) > .filter-input-wrapper > .filter-input //search input field
         div:nth-of-type(2) > div[role='combobox'] > .inline.no-label.v-select.vs--single.vs--unsearchable //Severity dropdown
         div:nth-of-type(3) > div[role='combobox'] > .inline.no-label.v-select.vs--single.vs--unsearchable //Repository dropdown
         div:nth-of-type(4) > div[role='combobox'] > .inline.no-label.v-select.vs--single.vs--unsearchable  //Registry
         div:nth-of-type(5) > .filter-input-wrapper > .filter-input //Platform search input field

         .main-layout > div > div:nth-of-type(3) //table layout
         .table-top-left .role-primary // Download custom report button

         thead > tr //table menu

         tr > th:nth-of-type(2) // Image Reference
         tr > th:nth-of-type(3) //CVEs
         tr > th:nth-of-type(4) //Image ID
         tr > th:nth-of-type(5) //Registry
         tr > th:nth-of-type(6) //Repository
         tr > th:nth-of-type(7) //Platforms

         tr:nth-of-type(1)  .checkbox-outer-container.selection-checkbox  span[role='checkbox'] //first checkbox
         tr:nth-of-type(1) > .col-image-name-cell > a[value^='ghcr.io/kubewarden/sbomscanner/test-assets/golang:1.12-alpin']
         
         */


        //await userClickByElem(page, ".icon-user");

    })


    test("003_INTERCEPTION  ***", async ({ page }) => {

        /*
        await navigateTo(page, "/dashboard/home")
        await delay(page, 3000)
    
        //click on rancher icon logo
        await userClickByElem(page, ".cluster-icon-menu.rancher-provider-icon.v-popper--has-tooltip  .cluster-local-logo > g > .rancher-icon-fill");
        await delay(page, 3000)
    
        //click on SBOMScanner menu
        await userClickByElem(page, "div:nth-of-type(8)  div[role='button'] > a  span"); //submenu SBOMScanner
        await delay(page, 3000)
    
        await userClickByElem(page, "a[role='link'] > .label.no-icon"); //submenu Images
        await delay(page, 3000)
    
        */

        await page.route("***en_US***", async route => {

            const json = []
            console.log("/Begin--------------------------------------------------------------/")
            //console.log(route)
            //fs.writeFileSync(outputFilePath, route.toString(), 'utf-8');
            myConsole.log(route)
            console.log("/End--------------------------------------------------------------/")
            //await route.fulfill({json})
        })

        await delay(page, 3000)
        await page.goto("https://www.adobe.com")
        await delay(page, 3000)

    })


    test("004_MANUAL LOGIN  ***", async ({ page }) => {

        await page.goto("https://ui-auto.nvqa.com/dashboard/auth/login")
        await delay(page, 3000)

        await page.click(".edit.labeled-input"); //click on Username input box
        await page.locator('.edit.labeled-input').pressSequentially("admin", { delay: 100 });
        await page.waitForTimeout(2000);
        await page.click(".password > .create.labeled-input.suffix"); //click on Password input box
        await page.locator(".password > .create.labeled-input.suffix").pressSequentially("RANCHERUSERPASSWORD", { delay: 100 });
        await page.click("button#submit") //submit to login

        //click on rancher icon logo
        await userClickByElem(page, ".cluster-icon-menu.rancher-provider-icon.v-popper--has-tooltip  .cluster-local-logo > g > .rancher-icon-fill");
        await delay(page, 3000)

        //click on SBOMScanner menu
        ////await userClickByElem(page, "div:nth-of-type(8)  div[role='button'] > a  span"); //submenu SBOMScanner
        ////await delay(page, 3000)

        ////await userClickByElem(page, "a[role='link'] > .label.no-icon"); //submenu Images
        ////await delay(page, 3000)

        page.goto("https://ui-auto.nvqa.com/dashboard/c/local/explorer/limitrange")
        //check for the table here

        console.log("< Table data===========================")

        // await page.getByText('There are no rows to show.').dblclick()

        // Retrieve the text content using textContent()
        //const textContent = await norow.textContent();
        //console.log(`====Text Content:> ${textContent}`)

        //const t = await retrInnerText(page, "td > span") 
        const t = await retrTextContent(page, "td > span")

        let compareText: boolean = t === 'There are no rows to show.';

        if (!compareText) {
            throw new Error("Test failed in String ...")

        }
        else {
            console.log("==> Same string")
        }

    })


    test("005_drop down list  ***", async ({ page }) => {

        await page.goto("https://ui-auto.nvqa.com/dashboard/auth/login")
        await delay(page, 3000)

        await page.click(".edit.labeled-input"); //click on Username input box
        await page.locator('.edit.labeled-input').pressSequentially("admin", { delay: 100 });
        await page.waitForTimeout(2000);
        await page.click(".password > .create.labeled-input.suffix"); //click on Password input box
        await page.locator(".password > .create.labeled-input.suffix").pressSequentially("RANCHERUSERPASSWORD", { delay: 100 });
        await page.click("button#submit") //submit to login

        //click on rancher icon logo
        await userClickByElem(page, ".cluster-icon-menu.rancher-provider-icon.v-popper--has-tooltip  .cluster-local-logo > g > .rancher-icon-fill");
        await delay(page, 3000)


        //example in the role creation page
        await page.goto("https://ui-auto.nvqa.com/dashboard/c/local/explorer/rbac.authorization.k8s.io.role")
        //check for the drop down link here

        console.log("< Dropdown values ===========================")
        await userClickByElem(page, "[data-testid='masthead-create']");

        //nav[role='navigation']

        //combo box
        //div#vsls-uid-mytlbwckkmey__combobox
        //await userClickByElem(page, "div#vsls-uid-ocddmgqqcheo__combobox > .vs__selected-options");
        await delay(page, 5000)
        //await page.locator('div:nth-of-type(2) > .create.labeled-input').pressSequentially("abc", { delay: 100 });

        await userClickByText(page, "default")
        await delay(page, 5000)

        const k = await retrInnerText(page, ".vs__dropdown-menu")
        //const m = await retrInnerText(page, ".vs__dropdown-option") 

        console.log("=======================>>>>> " + k)
        //console.log(">=======================>>>>> " + m)


        //const data: string = "apple,banana,orange";

        const result: string[] = k.split("\n");

        console.log(result.slice(1));




        //ul#vsls-uid-mytlbwckkmey__listbox
        //.vs__selected
        //const t = await retrTextContent(page, "vsls-uid-fohqsszujtya__combobox") 
        //console.log("==> " + t)
        //const dropdownlocator = page.locator("div#vsls-uid-fgmgyujzkryd__combobox")
        //const ddvalues = await dropdownlocator.inputValue();
        //console.log("=======================>>>>> " + ddvalues)



    })


    test("006_CONSOLE COMMAND  ***", async ({ page }) => {


        //check for the table here

        console.log("<===========================")

        exec("sh whatever.sh", (error, stdout, stderr) => {
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


        delay(page, 10000)
        console.log("===========================>")


    })

    test("007_loop through the table list  ***", async ({ page }, testInfo) => {
        /*
                await page.goto("https://ui-auto.nvqa.com/dashboard/auth/login")
                await delay(page, 3000)
        
                await page.click(".edit.labeled-input"); //click on Username input box
                await page.locator('.edit.labeled-input').pressSequentially("admin", { delay: 100 });
                await page.waitForTimeout(2000);
                await page.click(".password > .create.labeled-input.suffix"); //click on Password input box
                await page.locator(".password > .create.labeled-input.suffix").pressSequentially("RANCHERUSERPASSWORD", { delay: 100 });
                await page.click("button#submit") //submit to login
        
                //click on rancher icon logo
                await userClickByElem(page, ".cluster-icon-menu.rancher-provider-icon.v-popper--has-tooltip  .cluster-local-logo > g > .rancher-icon-fill");
                await delay(page, 3000)
                */

        //example in the role creation page
        //https://RANCHERURL/dashboard/c/local/imageScanner/images
        await navigateTo(page, "/dashboard/c/local/imageScanner/images")
        console.log("+++++++>>>" + page.url())
        delay(page, 5000)

        console.log("< Loop thru table for the values here ===========================")

        const t = ["table[role='table']", "table[role='table'] > thead", "table[role='table'] > tbody"]
        //await isLoaded(page, t)

        console.log("HELLO===================HELLO")
        console.log(`Running test: ${testInfo.title}`);
        console.log(`Test path: ${testInfo.titlePath}`);
        console.log("HELLO===================HELLO")

        myConsole.log("HELLO===================HELLO")
        await isVisibled(page, t)



        /*  Locate the table 
        */
        //table[role='table']
        //table[role='table'] > thead
        //table[role='table'] > tbody
        const table = page.locator("table[role='table']");

        // Locate all the rows within the table
        const rows = table.locator('tr');
        const rowCount = await rows.count();

        const column = table.locator('th');
        const columnCount = await column.count();

        console.log("---Table-----------------------")
        console.log("# Number of rows:" + (rowCount-1)) //eliminate 1 for row header
        console.log("# Number of columns:" + columnCount)
        console.log("-------------------------------\n")


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
        for (let i = 0; i < rowCount; i++) {
            const row = rows.nth(i);
            // Locate all the cells within the current row
            const cells = row.locator('td');            
            const cellCount = await cells.count();
            //console.log("# Number of columns:" + cellCount)
            
            // Loop through each cell in the current row
            for (let j = 0; j < cellCount; j++) {
                const cell = cells.nth(j);
                const cellText = await cell.innerText();
                console.log(`Row ${i}, Cell ${j} - Value: '${cellText}'`);
                // Perform assertions or actions on the cell if needed
            }
        }
    }

        //console.log("## Number of columns:" + cellCount)

        //tr:nth-of-type(1)  .checkbox-outer-container.selection-checkbox //Checkbox
        //tr:nth-of-type(1) > .col-image-name-cell //Image Reference
        //tr:nth-of-type(1) > .col-identified-cves-cell > div //CVEs
        const imagevalue = await table.locator("tr:nth-of-type(1) > .col-image-id-cell > span").textContent() //Image ID
        //tr:nth-of-type(1) > .col-registry-cell-link //Registry
        //tr:nth-of-type(1) > td:nth-of-type(6) //Repository
        //tr:nth-of-type(1) > td:nth-of-type(7) //Platform
        //tr:nth-of-type(1) button[role='button'] //three dots action

        //>> div[role='menu'] > div:nth-of-type(1) //download sbom
        //>> div[role='menu'] > div:nth-of-type(1) //Image detail report csv
        //>> div[role='menu'] > div:nth-of-type(1) //vulnerability report json

        console.log(imagevalue)


        /* test download

        await table.locator("tr:nth-of-type(1) button[role='button']").click() //three dots action

        await delay(page, 5000)

        const downloadPromise = page.waitForEvent('download');
        await table.locator("div[role='menu'] > div:nth-of-type(1)").click() //sbom

        const download = await downloadPromise;
        const filePath = 'downloads/' + download.suggestedFilename();

        await download.saveAs(filePath);
        expect(fs.existsSync(filePath)).toBeTruthy();

        const stats = await fs.promises.stat(filePath);
        expect(stats.size).toBeGreaterThan(0);
        
        */



    })

    test("008_loop through the table list part-2 ***", async ({ page }, testInfo) => {

        //https://RANCHERURL/dashboard/c/local/imageScanner/images
        await navigateTo(page, "/dashboard/c/local/imageScanner/images")
        console.log("+++++++>>>" + page.url())
        delay(page, 5000)

        console.log("< Loop thru table for the values here ===========================")

        const t = ["table[role='table']", "table[role='table'] > thead", "table[role='table'] > tbody"]
        //await isLoaded(page, t)

        console.log("===================HELLO")
        console.log(`Running test: ${testInfo.title}`);
        console.log(`Test path: ${testInfo.titlePath}`);

        myConsole.log("===================HELLO")
        await isVisibled(page, t)


        /*  Locate the table 
        */
        //table[role='table']
        //table[role='table'] > thead
        //table[role='table'] > tbody
        const table = await page.locator("table[role='table']");

        // Locate all the rows within the table
        //Total row and column unhidden 

        //const rows = table.locator("table[role='table'] > tbody > tr")
        //const columns = table.locator("table[role='table'] > tbody > thead")

        const rows = table.locator("tbody .main-row").count().then(r_num => {
            return console.log("Num of rows" + `${r_num}`);
        })
        const columns = table.locator("tr > th").count().then(col_num => {
            return console.log("Num of columns: " + `${col_num}`);
        })

        const nonhiddenrow = table.locator("tbody .main-row:not([class*='main-row'])").count().then(fil_num => {
            return console.log("After filtered: " + `${fil_num}`);
        })

        await delay(page, 3000)
        //tr:nth-of-type(1) > .col-image-id-cell > span
        const testvalue = await table.locator("tr:nth-of-type(1) > .col-image-id-cell > span").textContent()
        console.log(testvalue)
        expect(testvalue).toEqual("1782cafde433... ")

        if (testvalue?.includes("1782")) {
            console.log("-> Good")
        } else {
            console.log("--> Bad")
        }

        //await delay(page, 3)

        //const count = await page.locator('tr').count();it page.l

        //console.log("====>>> " + columns)
        //console.log("====>>> " + nonhiddenrow)

        //expect(await rows.count()).toEqual(7)
        //expect(await columns.count()).toEqual(6)

        //.filter-row .filter-item:nth-of-type(1) .filter-input
        //not([class*="main-row"])
        //[class*="no-row"]

        await page.locator(".filter-row .filter-item:nth-of-type(1) .filter-input").fill("ghcr.io/kubewarden/sbomscanner/test-assets/golang:1.12-alpine")
        //expect(await rows.count()).toEqual(0)

        table.locator("tbody .main-row").count().then(fr_num => {
            return console.log("Num of rows after filtering: " + `${fr_num}`);
        })


    })


    test("009_test delay", async ({ page }, testInfo) => {

        //https://RANCHERURL/dashboard/c/local/imageScanner/images
        await navigateTo(page, "/dashboard/c/local/imageScanner/images")
        console.log("+++++++>>>" + page.url())

        console.log("< Loop thru table for the values here ===========================")

        const t = ["table[role='table']", "table[role='table'] > thead", "table[role='table'] > tbody"]
        //await isLoaded(page, t)

        console.log("===================HELLO")
        console.log(`Running test: ${testInfo.title}`);
        console.log(`Test path: ${testInfo.titlePath}`);

        myConsole.log("===================HELLO")
        await isVisibled(page, t)

        //await wait(page, 11)
        myConsole.log("<<<===================>>>")
        await delay(page, 10000)








    })


    test("010_INTERCEPTION  ***", async ({ page }) => {

        
        await navigateTo(page, "/dashboard/home")
        await delay(page, 3000)
    
        //click on rancher icon logo
        await userClickByElem(page, ".cluster-icon-menu.rancher-provider-icon.v-popper--has-tooltip  .cluster-local-logo > g > .rancher-icon-fill");
        await delay(page, 3000)
    
        //click on SBOMScanner menu
        //await userClickByElem(page, ".router-link-active.router-link-exact-active  span"); //submenu SBOMScanner
        await page.click('span:has-text("SBOMScanner")');
        await delay(page, 3000)
    
        //await userClickByElem(page, "a[role='link'] > .label.no-icon"); //submenu Images
        //await delay(page, 3000)
    
        
        //await page.reload()

        await page.route("**uiplugins*", async route => {

            const json: any = []
            console.log("/Begin--------------------------------------------------------------/")
            
            console.log('Intercepted:', route.request().url());
            
            const response = await route.fetch(); // fetch original response
            const body = await response.json();

            console.log('Original response:', JSON.stringify(body, null, 2));

            //await route.fulfill({ response }); // continue with original response
            
            //route.continue();
            
            //console.log(body)
            fs.writeFileSync(outputLogFilePath, JSON.stringify(body, null, 2))
            

            //route.fulfill({
            //     body: JSON.stringify([{ title: 'Mocked Post' }]),
            //    });
            
            myConsole.log(JSON.stringify(body, null, 2))
            
            console.log("/End--------------------------------------------------------------/")
            //await route.fulfill({json})
        })

        await delay(page, 3000)
        await page.goto("https://RANCHERURL/dashboard/c/local/imageScanner/dashboard")
        //await page.click('span:has-text("SBOMScanner")');
        await delay(page, 3000)
        

    })




    test.only("011_menulist  ***", async ({ page }) => {

        
        await navigateTo(page, "/dashboard/home")
        await delay(page, 3000)
    

        //click on rancher icon logo
        await userClickByElem(page, ".cluster-icon-menu.rancher-provider-icon.v-popper--has-tooltip  .cluster-local-logo > g > .rancher-icon-fill");
        await delay(page, 3000)

        //click on SBOMScanner link
        //await page.locator('nav.side-nav').getByText('SBOMScanner').click();


        //const menuItem = await page.locator("nav.side-nav .child .label").allTextContents();

        console.log("")
        console.log("=========================================")

        //const labels = await page.locator('.accordion[aria-expanded="true"], .accordion:has(.header[aria-expanded="true"])')
        //                .locator('.   child .label')
        //                .allTextContents();

        //console.log(labels);

        console.log("-- click SBOMScanner")
        await clickMenu(page, ['SBOMScanner']);
        await delay(page, 2000)


        console.log("-- click Images")
        await clickMenu(page, ['SBOMScanner', 'Images']);
        await delay(page, 2000)

        //console.log("-- click Advanced")
        //await clickMenu(page, ['SBOMScanner', 'Advanced']);
        //await delay(page, 2000)

        console.log("-- click to Workloads Scan")
        await clickMenu(page, ['Advanced', 'Workloads Scan']);

        console.log("-- click to Reg config")
        await delay(page, 2000)
        await clickMenu(page, ['Advanced', 'Registries configuration']);


        console.log("-- click to Vex")
        await delay(page, 2000)
        await clickMenu(page, ['Advanced', 'Vex Management']);
                               
    
      })
    


}) //the end

