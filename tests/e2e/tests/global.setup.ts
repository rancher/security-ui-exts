//Filename: global.setup.ts
import { chromium, test, expect, Page } from "@playwright/test"
import { test as setup } from '@playwright/test';

// Note: Using Playwright's built-in waiting methods instead of custom delay functions
// Old utility functions (wait, delay, etc.) are no longer needed

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
    const username = process.env.TEST_USERNAME;
    const password = process.env.TEST_PASSWORD;

    if (!username || !password) {
        throw new Error('TEST_USERNAME and TEST_PASSWORD environment variables must be set');
    }

    await setup.step('Login to Rancher', async () => {
        console.log(`→ Logging in as ${username}`);

        // Navigate and wait for login page to load
        await page.goto("/", { waitUntil: 'networkidle' });

        // Wait for username input to be visible and ready
        const usernameInput = page.locator('.edit.labeled-input');
        await usernameInput.waitFor({ state: 'visible' });
        await usernameInput.click();
        await usernameInput.pressSequentially(username, { delay: 100 });

        // Wait for password input and fill it
        const passwordInput = page.locator(".password > .create.labeled-input.suffix");
        await passwordInput.waitFor({ state: 'visible' });
        await passwordInput.click();
        await passwordInput.pressSequentially(password, { delay: 100 });

        // Click submit and wait for navigation
        await page.click("button#submit");

        // Wait for successful login - increased timeout for slow Rancher loading
        await page.waitForURL('**/dashboard/home', { timeout: 60000 });

        console.log('✓ Login successful');
    });

    await setup.step('Save authentication state', async () => {
        await page.context().storageState({ path: authFile });
        console.log(`✓ Auth state saved to ${authFile}`);
    });

    await setup.step('Retrieve UI version information', async () => {
        console.log('→ Setting up UI plugins interception');

        // Set up route interception BEFORE navigation
        await page.route("**uiplugins*", async route => {
            console.log('✓ Intercepted:', route.request().url());

            const response = await route.fetch();
            const body = await response.json();

            console.log('✓ Received UI plugins response');

            fs.writeFileSync(outputFilePath, JSON.stringify(body, null, 2))
            myConsole.log(JSON.stringify(body, null, 2))
        });

        // Navigate to SBOM Scanner dashboard
        await page.getByTestId('menu-cluster-local').click();
        await page.getByText('Vulnerability Scanner', { exact: true }).click();

        console.log(`✓ UI version saved to ${outputFilePath}`);
    });
})
