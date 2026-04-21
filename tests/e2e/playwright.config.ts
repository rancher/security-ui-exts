import { defineConfig, devices } from '@playwright/test';
globalSetup: require.resolve('./global-setup');
import dotenv from 'dotenv';
import path from "path";
export const STORAGE_STATE = path.join(__dirname, '/.auth/login-data.json');

dotenv.config();

export default defineConfig({
 //globalSetup: require.resolve('./global-setup'),
 
 testDir: './tests',
 ////fullyParallel: true,
 
  // 
  projects: [
    {
      name: 'setup',
      //testMatch: /global-setup.ts/,
      testMatch: ['**/*.setup.ts',
      ],
      
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'],
              storageState: STORAGE_STATE,
       },
      dependencies: ['setup'],
    },
    
  ],

   testMatch: [ 
                //"tests/myfunctions.test.ts", 
                
                "tests/sbomscanner.test.ts",
                "tests/sbomscanner_images.test.ts",
                "tests/sbomscanner_registries.test.ts",
                "tests/sbomscanner_vex_management.test.ts",
                "tests/sbomscanner_workloads.test.ts",
              ],

  use: {
        baseURL: "https://RANCHERURL",
        
        headless: false,
    	  ignoreHTTPSErrors: true,
        screenshot: "on",
        video: "on",
        launchOptions: {
             slowMo: 500,
             args: ["--start-maximized"]
        },
        viewport: null,
    },

    //timeout: 60 * 1000 * 5,
    timeout: 30000,
    
    retries: 3,
    reporter: [["dot"], ["json", {
        outputFile: "jsonReports/jsonReport.json"
    }], ["html", {
        open: "never"
    }]]

});
