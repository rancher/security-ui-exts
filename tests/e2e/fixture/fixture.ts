/* Filename: fixture.ts 
*/

import { test as base, expect } from '@playwright/test';

export const test = base.extend({  page: async ({ page }, use) => {    
     
    const consolelogs: string[] = [];   

    // capture errors like failed network calls, etc.
    page.on('console', (msg) => {
        
        //"log" | "debug" | "info" | "error" | "warning" | "dir" | "dirxml" 
        // | "table" | "trace" | "clear" | "startGroup" | "startGroupCollapsed" 
        // | "endGroup" | "assert" | "profile" | "profileEnd" | "count" | "time" | "timeEnd"
        
        if (msg.type() === 'error') {        
            consolelogs.push(`[${msg.type()}] ${msg.text()}`);      
        }

        /*
        if (msg.type() === 'log') {        
            consolelogs.push(`[${msg.type()}] ${msg.text()}`);      
        }
        if (msg.type() === 'info') {        
            consolelogs.push(`[${msg.type()}] ${msg.text()}`);      
        }
        */

    }); 

    // capture uncaught exceptions error      
    page.on('pageerror', (exception) => {
         consolelogs.push(`[${exception.name}] ${exception.message}`);    
        });    
    await use(page);    


    // assertions   
    console.log("")
    console.log(" ------------------------------------------------------------------------- ")
    console.log(" >>> Captured Browser Console Log Errors <<<  ")
    console.log(" ------------------------------------------------------------------------- ")
    console.log(consolelogs)
    console.log("")
    console.log(" ------------------------------------------------------------------------- ")
    console.log("")
    
    /* Failed the test if error is captured in the console log */
    ////expect(consolelogs).toStrictEqual([]);  
    ////expect(consolelogs).toHaveLength(0);
    

  }
});
