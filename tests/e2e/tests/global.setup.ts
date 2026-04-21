//Filename: global.setup.ts
import { chromium, test, expect, Page } from "@playwright/test"
import { test as setup } from '@playwright/test';

//import * as custom from '../utils/commands.ts'
//import { navigateTo, userClickByElem, userPresskey } from "../utils/commands.ts";
//import { wait } from '../utils/commands.ts'
//import { chromium, type FullConfig } from '@playwright/test';

const { wait, delay, navigateTo, userClickByElem, userPresskey } = require('../utils/commands.ts')

import { STORAGE_STATE } from '../playwright.config';

import * as fs from 'fs';
import { Console } from 'console';
const outputFilePath: string = 'uiversion.json';
const output = fs.createWriteStream(outputFilePath);

// Create a new console instance that writes to the file stream
const myConsole = new Console(output);


// # login session data
const authFile = '.auth/login-data.json'

setup('Perform Login Action', async ({ page }) => {


    const username: string | undefined = process.env.TEST_USERNAME;
    const password: string | undefined = process.env.TEST_PASSWORD;

    console.log("")
    console.log("###############################################")
    console.log("############# GLOBAL LOGIN ####################")
    console.log("###############################################")
    console.log("")

    await page.goto("/");
    //navigateTo(page, "https://RANCHERURL")
    await page.waitForTimeout(1000);
    //wait(page, 1000)

    await page.click(".edit.labeled-input"); //click on Username input box
    await page.locator('.edit.labeled-input').pressSequentially(username, { delay: 100 });
    await page.waitForTimeout(2000);
    //userClickByElem(page, ".edit.labeled-input");
    //userPresskey(page, ".edit.labeled-input", username);

    await page.click(".password > .create.labeled-input.suffix"); //click on Password input box
    await page.locator(".password > .create.labeled-input.suffix").pressSequentially(password, { delay: 100 });
    //userClickByElem(page, ".password > .create.labeled-input.suffix")
    //userPresskey(page, ".password > .create.labeled-input.suffix", password)

    await page.click("button#submit") //submit to login
    //userClickByElem(page, "button#submit");

    await page.waitForTimeout(5000);
    //wait(page, 1000)

    // # Save the Login session storage
    await page.context().storageState({ path: authFile });
    //await browser.close(); 


    // To retrieve the UI versions
    await userClickByElem(page, ".cluster-icon-menu.rancher-provider-icon.v-popper--has-tooltip  .cluster-local-logo > g > .rancher-icon-fill");
    await delay(page, 3000)

    await page.click('span:has-text("SBOMScanner")');
    await delay(page, 3000)

    await page.route("**uiplugins*", async route => {

        const json: any = []

        console.log("/Begin--------------------------------------------------------------/")

        console.log('Intercepted:', route.request().url());

        const response = await route.fetch(); // fetch original response
        const body = await response.json();

        console.log('Original response:', JSON.stringify(body, null, 2));

        fs.writeFileSync(outputFilePath, JSON.stringify(body, null, 2))

        myConsole.log(JSON.stringify(body, null, 2))

        console.log("/End--------------------------------------------------------------/")

    })

    await delay(page, 3000)
    await page.goto("https://RANCHERURL/dashboard/c/local/imageScanner/dashboard")
    await delay(page, 3000)


    //------------------------------------------
})
