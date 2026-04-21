/* Filename: Commands.ts */

import { Page, expect } from '@playwright/test';
import { resolve } from 'node:dns';


export let sharedValue = 'uitest';

export function updateSharedValue(newValue: string) {
  sharedValue = newValue;
}


export async function navigateTo(page: Page, myurl: string) {
	console.log("=> Navigate to URL " + myurl + " ......")
	await page.goto(myurl)
}

export async function navigateTo_sub(page: Page, subdomain: String) {
	console.log("=> Navigate to subdomain " + subdomain + " ......")
	await page.goto("/" + subdomain);
}

export async function wait(page: Page, seconds: number) {
	for (let i = 1; i <= seconds; i++) {
		console.log(i)
		await page.waitForTimeout(1000)
	}
}

export async function delay(page: Page, ms: number): Promise<void> {
	console.log("=> Delay timeout for " + ms + " milliseconds ......")
	return new Promise(resolve => setTimeout(resolve, ms))
}


export async function isVisibled(page: Page, locs: string[]) {
	/*
	for (const item of items) {
		console.log("=> *Locator \""+item+"\" is loaded and visible.")
		await expect(page.locator(item)).toBeVisible();
	}
		*/

	for (const loc of locs) {

		if (loc !== undefined && loc !== null) {
			console.log("=> Locator \"" + loc + "\" is loaded and visible.")
			await expect(page.locator(loc)).toBeVisible();

		} else {
			console.log(">>> Element \"" + loc + "\" fails to load and visible!")
			throw new Error(">>> Element \"" + loc + "\" fails to load and visible!")
		}
	}
}


export async function isLoaded(page: Page, objs: string[]) {
	for (const obj of objs) {
		if (obj !== undefined && obj !== null) {
			console.log("=> Object \"" + obj + "\" is loaded")
		} else {
			console.log(">>> Object \"" + obj + "\" fails to load!")
			throw new Error(" >>> Object \"" + obj + "\" load failed! ")
		}

	}
}


export async function userClickByElem(page: Page, elem: string) {
	console.log("=> User click element \"" + elem + "\"")
	await page.click(elem);
}


export async function userClickByText(page: Page, mystr: string) {
	console.log("=> User click string \"" + mystr + "\"")
	await page.getByText(mystr).click();
}


export async function userInput(page: Page, loc: string, mystr: string) {
	console.log("=> User type string \"" + mystr + "\"")
	await page.getByLabel(loc).fill(mystr);
}


export async function userPresskey(page: Page, loc: string, mystr: string) {
	console.log("=> User Press key string \"" + mystr + "\"")
	await page.locator(loc).pressSequentially(mystr, { delay: 100 });
}


export async function retrInnerText(page: Page, loc: string) {
	/* #innerText():
	innerText(): This method returns the visible, "human-readable" 
	text content of an element and its descendants. It is aware of 
	styling and will not return the text of hidden elements.
	*/

	const ele_locator = page.locator(loc);
	console.log("=> Retrieve the element visible string")

	const innerText = await ele_locator.innerText();
	//inputValue(): 
	//allTextContents()
	console.log('=> Inner Text: ', innerText);
	return `${innerText}`
}

export async function retrTextContent(page: Page, loc: string) {
	/* #textContent(): 
	This method returns the text content of an element and its 
	descendants, including <script> and <style> elements. It can retrieve 
	hidden text because it is not aware of CSS styling.
	*/

	const ele_locator = page.locator(loc);
	console.log("Retrieve the element Content")

	const textContent = await ele_locator.textContent();

	console.log('=> Text Content: ', textContent);
	return `${textContent}`
}


export async function generateRandomString(num: number) {

	let outString: string = '';
	let inOptions: string = 'abcdefghijklmnopqrstuvwxyz0123456789';

	for (let i = 0; i < num; i++) {
		outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));

	}
	//let output = `${outString}`.toLowerCase()
	return `${outString}`.toLowerCase();
}


export async function clickMenu(page: Page, path: string[]) {
  for (let i = 0; i < path.length; i++) {
    const name = path[i];
    const isLast = i === path.length - 1;

    // Try link first (clickable menu item)
    const link = page.getByRole('link', { name });

    if (await link.count() > 0 && isLast) {
      await link.first().click();
      return;
    }

    // Otherwise treat as expandable header
    const button = page.getByRole('button', { name });

    if (await button.count() === 0) {
      throw new Error(`Menu "${name}" not found`);
    }

    const expanded = await button.first().getAttribute('aria-expanded');

    if (expanded === 'false') {
      await button.first().click();
    }

    // wait to allow DOM to render children
    await page.waitForTimeout(1000);
  }

  // If last item wasn't clicked yet (edge case)
  const last = path[path.length - 1];
  await page.getByRole('link', { name: last }).first().click();
  
}

