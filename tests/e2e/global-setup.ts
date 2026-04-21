//Filename: global-setup.ts
//import { chromium, expect } from "@playwright/test";
import { Page } from '@playwright/test';
import * as fs from 'fs'

import { chromium, type FullConfig } from '@playwright/test';

const authFile = 'playwright/.auth/user.json'

//export default 
async function globalSetup(config: FullConfig) {
    const { baseURL, storageState } = config.projects[0].use;

    const browser = await chromium.launch();
    
    const context = await browser.newContext({
        ignoreHTTPSErrors: true,
    });
    
    const page = await context.newPage();
    
    console.log("***** Global Setup *****")
    await page.goto(baseURL!);

    //await page.goto("https://RANCHERURL")
    //await page.goto("https://suse.com")

    /*
            const elements = [
                ".login-welcome.text-center", // [Welcome to Rancher]
                ".edit.labeled-input", //Username Input box
                ".password > .create.labeled-input.suffix", //Password Input box
                ".create.labeled-input.suffix > .addon", //Show  password
                "button#submit", //Submit button
                "span[role='checkbox']" //Remember username checkbox
            ];
            
            custom.validateEle(page, elements); //validate the page elements
    */
            await page.waitForTimeout(3000);
             
            await page.click(".edit.labeled-input"); //click on Username input box
            await page.locator('.edit.labeled-input').pressSequentially('admin', { delay: 100 });
   
            await page.click(".password > .create.labeled-input.suffix"); //click on Password input box
            await page.locator(".password > .create.labeled-input.suffix").pressSequentially('RANCHERUSERPASSWORD', { delay: 100 });

            await page.click("button#submit") //submit to login

            await page.context().storageState({ path: authFile });
            await browser.close();

}

export default globalSetup;
