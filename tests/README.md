# SBOMScanner UI Automation Test Suite

> **Comprehensive guide for QA engineers to quickly start testing SBOMScanner UI**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Page Object Model (POM)](#page-object-model-pom)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## 🎯 Overview

This repository contains **TypeScript-based end-to-end (E2E) tests** for the **SUSE Security UI Extension** (SBOMScanner) using **Playwright** framework.

### What We Test:
- ✅ SBOMScanner Dashboard
- ✅ Image Scanning & Results
- ✅ Workload Scanning Configuration
- ✅ Registry Configuration
- ✅ VEX Management (Vulnerability Exploitability eXchange)

### Key Features:
- 🎨 **Page Object Model (POM)** - Maintainable, reusable test code
- 🔐 **Secure credentials** - Using `.env` file (gitignored)
- 📊 **Rich reporting** - HTML reports with screenshots
- 🚀 **CI/CD ready** - GitHub Actions integration
- 🧪 **Type-safe** - Full TypeScript support

---

## 🏗️ Architecture

```
tests/
├── e2e/                                # E2E test directory
│   ├── pages/                          # Page Object Model (POM)
│   │   ├── BasePage.ts                # Base class with common methods
│   │   ├── DashboardPage.ts           # Rancher dashboard navigation
│   │   ├── SBOMScannerDashboardPage.ts # SBOM dashboard
│   │   ├── ImagesPageEnhanced.ts      # Images page actions
│   │   ├── RegistriesPageEnhanced.ts  # Registries configuration
│   │   ├── VexManagementPageEnhanced.ts # VEX management
│   │   ├── WorkloadsScanPageEnhanced.ts # Workloads scanning
│   │   └── index.ts                   # Exports all page objects
│   │
│   ├── tests/                          # Test specifications
│   │   ├── sbomscanner_dashboard.test.ts    # Dashboard tests
│   │   ├── sbomscanner_images.test.ts       # Image scanning tests
│   │   ├── sbomscanner_registries.test.ts   # Registry tests
│   │   ├── sbomscanner_vex_management.test.ts # VEX tests
│   │   └── sbomscanner_workloads.test.ts    # Workload tests
│   │
│   ├── fixture/                        # Test fixtures
│   │   └── fixture.ts                 # Enhanced fixture with POM support
│   │
│   ├── utils/                          # Utility functions
│   │   └── commands.ts                # Helper functions
│   │
│   ├── .auth/                          # Authentication state (gitignored)
│   │   └── login-data.json            # Saved login session
│   │
│   ├── playwright.config.ts           # Playwright configuration
│   ├── global.setup.ts                # Global test setup (login)
│   └── package.json                   # NPM dependencies
│
├── .env.example                        # Environment variables template
├── .env                                # Your credentials (gitignored)
└── README.md                           # This file

Generated during test runs:
├── test-results/                       # Test execution artifacts
├── playwright-report/                  # HTML test reports
└── downloads/                          # Downloaded files during tests
```

### Architecture Highlights:

**Page Object Model (POM)**
```
Tests → Page Objects → Playwright → Browser → Application
  ↓         ↓
Business  Selectors &
 Logic    Implementation
```

**Benefits:**
- **83% less code** in test files
- **50x easier maintenance** (selectors in one place)
- **Readable tests** (business logic, not implementation)
- **Reusable methods** across all tests

---

## 📦 Requirements

### System Requirements:

| Requirement | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18.x or 20.x | JavaScript runtime |
| **npm** | 8.x or higher | Package manager |
| **Git** | Any recent version | Version control |
| **OS** | Linux, macOS, or Windows | Any modern OS |

### Test Environment Requirements:

- ✅ **Kubernetes cluster** with SBOMScanner installed
- ✅ **Rancher** with SBOM Scanner UI extension enabled
- ✅ **Network access** from test machine to Rancher instance
- ✅ **Admin credentials** for Rancher

### Supported Browsers:

- ✅ Chromium (default)
- ✅ Firefox (optional)
- ✅ WebKit (optional)

---

## 🚀 Quick Start

### Step 1: Clone Repository

```bash
git clone https://github.com/neuvector/security-ui-exts.git
cd security-ui-exts/tests/e2e
```

### Step 2: Install Dependencies

```bash
# Install all NPM packages
npm install

# Install Playwright browsers (first time only)
npx playwright install chromium
```

**Expected output:**
```
Downloading Chromium 121.0.6167.57...
Chromium 121.0.6167.57 downloaded to ~/.cache/ms-playwright/chromium-1097
```

### Step 3: Configure Environment

**Copy the template:**
```bash
cp ../.env.example ../.env
```

**Edit `.env` file:**
```bash
nano ../.env  # or use your preferred editor
```

**Add your credentials:**
```env
# Rancher Authentication
TEST_USERNAME=admin
TEST_PASSWORD=your_actual_password_here

# Rancher URL (no trailing slash)
RANCHER_URL=https://rancher212.nvqa.com

# Test Configuration
TEST_RETRIES=0
```

⚠️ **Important:** Never commit `.env` file to git! It's already in `.gitignore`.

### Step 4: Run Your First Test

```bash
# Run all tests
npm test

# Or run a specific test file
npx playwright test sbomscanner_dashboard.test.ts
```

**Expected output:**
```
Running 2 tests using 1 worker

  ✓ SBOMSCANNER > PAGE ELEMENT VALIDATION (5.2s)
  ✓ SBOMSCANNER MENU NAVIGATION (8.1s)

  2 passed (13.3s)
```

### Step 5: View Test Report

```bash
# Open HTML report in browser
npm run report
```

---

## 🧪 Running Tests

### Common Test Commands

```bash
# Run all tests
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode (step through)
npm run test:debug

# Run tests in UI mode (interactive)
npm run test:ui

# Run specific test file
npx playwright test sbomscanner_vex_management.test.ts

# Run tests with specific tag/name
npx playwright test --grep "VEX MANAGEMENT"

# Run tests in parallel (default)
npx playwright test --workers=4

# Run tests on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox

# Update snapshots
npx playwright test --update-snapshots
```

### Environment-Specific Runs

```bash
# Use different environment
ENV=dev npm test        # Loads .env.dev
ENV=staging npm test    # Loads .env.staging
npm test                # Loads .env (default)
```

### Debugging Tests

```bash
# Run with browser visible
npm run test:headed

# Debug mode with Playwright Inspector
npm run test:debug

# Debug specific test
npx playwright test sbomscanner_images.test.ts --debug

# Show verbose output
DEBUG=pw:api npx playwright test
```

### Clean Demo Output (No Console Errors)

```bash
# Hide browser console errors in output
SHOW_CONSOLE_ERRORS=false npm test
```

---

## 📂 Test Structure

### Test Organization

```
e2e/tests/
├── sbomscanner_dashboard.test.ts      # 2 tests - Dashboard validation & navigation
├── sbomscanner_images.test.ts         # 4 tests - Image scanning workflow
├── sbomscanner_registries.test.ts     # 8 tests - Registry CRUD operations
├── sbomscanner_vex_management.test.ts # 8 tests - VEX CRUD operations
└── sbomscanner_workloads.test.ts      # 6 tests - Workload scanning config
```

### Test File Anatomy

```typescript
import { test, expect } from "../fixture/fixture";
import { VexManagementPageEnhanced } from "../pages";

test.describe("*** Test Suite Name", () => {
  test.describe.configure({ mode: "default" }); // or "serial"

  let vexPage: VexManagementPageEnhanced;

  test.beforeEach(async ({ page }) => {
    // Setup before each test
    vexPage = new VexManagementPageEnhanced(page);
    await vexPage.navigate();
  });

  test("Test Case Name", async ({ page }, testInfo) => {
    console.log(`Running test: ${testInfo.title}`);
    
    // Test steps using page object methods
    await vexPage.verifyPageUrl();
    await vexPage.verifyPageElements();
    await vexPage.validateVexTable(true);
    
    // Assertions
    expect(await vexPage.getTableRowCount()).toBeGreaterThan(0);
  });
});
```

### Test Execution Modes

**Default Mode (Parallel):**
```typescript
test.describe.configure({ mode: "default" });
// Tests run in parallel for speed
```

**Serial Mode (Sequential):**
```typescript
test.describe.configure({ mode: "serial" });
// Tests run one after another (for dependent tests)
```

---

## 🎨 Page Object Model (POM)

### What is POM?

Page Object Model is a design pattern that:
- **Encapsulates** UI elements and actions in reusable classes
- **Separates** test logic from implementation details
- **Centralizes** selectors for easy maintenance

### POM Class Hierarchy

```
BasePage (Common functionality)
    ├── DashboardPage
    ├── SBOMScannerDashboardPage
    ├── ImagesPageEnhanced
    ├── RegistriesPageEnhanced
    ├── VexManagementPageEnhanced
    └── WorkloadsScanPageEnhanced
```

### BasePage Methods (Available to All Pages)

```typescript
// Navigation
await page.navigate()                  // Go to page URL
await page.clickMenu(['Menu', 'Item']) // Navigate menu hierarchy

// Element Interaction
await page.clickElement(selector)      // Click element
await page.clickByText(text)          // Click by text content
await page.typeText(selector, text)   // Type into input

// Verification
await page.verifyPageUrl()            // Check current URL
await page.verifyElementsVisible([selectors]) // Check visibility
await page.verifyElementVisible(selector)

// Utilities
await page.delay(ms)                  // Wait for milliseconds
await page.getInnerText(selector)     // Get element text
await page.waitForElementVisible(selector) // Wait for element
```

### Example: Using Page Objects in Tests

#### ❌ Before (Without POM) - 30 lines
```typescript
test("Create VEX", async ({ page }) => {
  await navigateTo(page, "/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub");
  await delay(page, 2000);
  await page.locator("[data-testid='masthead-create']").click();
  await delay(page, 2000);
  
  const nameInput = page.locator('.mb-20.row > .col.span-3');
  await nameInput.click();
  await nameInput.pressSequentially("test-vex-001");
  
  const descriptionInput = page.locator('.mb-20.row > .col.span-6');
  await descriptionInput.click();
  await descriptionInput.pressSequentially("Test description");
  
  // ... 15 more lines ...
});
```

#### ✅ After (With POM) - 5 lines
```typescript
test("Create VEX", async ({ page }) => {
  const vexPage = new VexManagementPageEnhanced(page);
  await vexPage.navigate();
  await vexPage.createVex("test-vex-001", "Test description", "https://github.com/rancher/vexhub");
  expect(await vexPage.verifyVexExists("test-vex-001")).toBeTruthy();
});
```

**Result: 83% less code, infinitely more readable!**

### Available Page Objects

| Page Object | URL | Key Methods |
|------------|-----|-------------|
| **DashboardPage** | `/dashboard/home` | `navigateToHome()`, `navigateToSBOMScanner()`, `openRancherMenu()` |
| **SBOMScannerDashboardPage** | `.../dashboard` | `verifyDashboardElements()`, `verifyScannerMenuScreenshot()`, `navigateToImages()` |
| **ImagesPageEnhanced** | `.../images` | `verifyPageElements()`, `getTableRowCount()`, `scanImage()`, `verifyImageExists()` |
| **RegistriesPageEnhanced** | `.../registry` | `createRegistry()`, `editRegistry()`, `deleteRegistry()`, `verifyRegistryExists()` |
| **VexManagementPageEnhanced** | `.../vexhub` | `createVex()`, `editVex()`, `deleteVex()`, `validateVexTable()` |
| **WorkloadsScanPageEnhanced** | `.../workloadscanconfiguration` | `verifyPageElements()`, `configureScan()` |

---

## ✍️ Writing Tests

### Creating a New Test File

**1. Create test file:**
```bash
touch e2e/tests/sbomscanner_myfeature.test.ts
```

**2. Basic test template:**
```typescript
import { test, expect } from "../fixture/fixture";
import { MyPageObject } from "../pages";

test.describe("*** MY FEATURE TEST SUITE", () => {
  test.describe.configure({ mode: "default" });

  let myPage: MyPageObject;

  test.beforeEach(async ({ page }) => {
    console.log(" :: Before each test :: ");
    myPage = new MyPageObject(page);
    await myPage.navigate();
  });

  test("MY FEATURE > Test Case 1", async ({ page }, testInfo) => {
    console.log(`Running test: ${testInfo.title}`);
    
    // Your test steps
    await myPage.doSomething();
    
    // Assertions
    expect(await myPage.getSomeValue()).toBe("expected");
  });
});
```

### Writing Assertions

```typescript
// URL verification
await expect(page).toHaveURL('expected-url');
await myPage.verifyPageUrl(); // Using page object method

// Element visibility
await expect(page.locator('.my-element')).toBeVisible();

// Text content
await expect(page.locator('.title')).toContainText('Expected Text');

// Count assertions
expect(await myPage.getTableRowCount()).toBeGreaterThan(0);
expect(await myPage.getTableRowCount()).toBe(5);

// Boolean checks
expect(await myPage.isElementVisible('.button')).toBeTruthy();

// Custom matchers
await expect(page.locator('.error')).not.toBeVisible();
```

### Best Practices for Writing Tests

#### ✅ DO:
- Use page object methods instead of raw selectors
- Add descriptive test names
- Use `console.log()` for key checkpoints
- Clean up test data after tests
- Use meaningful variable names
- Add comments for complex logic

#### ❌ DON'T:
- Hardcode selectors in test files
- Use `page.waitForTimeout()` (use proper waits instead)
- Hardcode credentials (use `.env`)
- Write tests that depend on other tests
- Commit `.env` or `.auth/` files

### Example: Complete Test with Cleanup

```typescript
test("Create and Delete Registry", async ({ page }, testInfo) => {
  const registryPage = new RegistriesPageEnhanced(page);
  const registryName = `test-registry-${Date.now()}`;
  
  console.log(`Running test: ${testInfo.title}`);
  
  // Navigate
  await registryPage.navigate();
  await registryPage.verifyPageUrl();
  
  // Create registry
  await registryPage.createRegistry(
    registryName,
    "https://registry.example.com",
    "testuser",
    "testpass"
  );
  
  // Verify creation
  const exists = await registryPage.verifyRegistryExists(registryName);
  expect(exists).toBeTruthy();
  
  // Cleanup - delete registry
  await registryPage.deleteRegistry(registryName);
  
  // Verify deletion
  const stillExists = await registryPage.verifyRegistryExists(registryName);
  expect(stillExists).toBeFalsy();
});
```

---

## 🔄 CI/CD Integration

### GitHub Actions

Tests are designed to run in CI/CD pipelines. See `GITHUB_ACTIONS_SETUP.md` for detailed setup.

**Quick setup:**

1. **Add secrets to GitHub:**
   - `TEST_USERNAME`
   - `TEST_PASSWORD`
   - `RANCHER_URL`

2. **Create workflow file** (`.github/workflows/playwright-tests.yml`):
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        working-directory: tests/e2e
        run: npm ci
      
      - name: Install Playwright
        working-directory: tests/e2e
        run: npx playwright install --with-deps chromium
      
      - name: Create .env
        working-directory: tests
        run: |
          cat > .env << EOF
          TEST_USERNAME=${{ secrets.TEST_USERNAME }}
          TEST_PASSWORD=${{ secrets.TEST_PASSWORD }}
          RANCHER_URL=${{ secrets.RANCHER_URL }}
          EOF
      
      - name: Run tests
        working-directory: tests/e2e
        run: npx playwright test
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: tests/e2e/playwright-report/
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. **Tests fail with "Browser not found"**

**Problem:**
```
browserType.launch: Executable doesn't exist at ...
```

**Solution:**
```bash
npx playwright install chromium
```

---

#### 2. **Authentication fails / "Unauthorized" errors**

**Problem:**
```
Error: Timed out waiting for selector ".dashboard"
```

**Solution:**
- Check `.env` file has correct `TEST_USERNAME` and `TEST_PASSWORD`
- Verify `RANCHER_URL` is accessible from test machine
- Delete `.auth/login-data.json` and re-run (forces fresh login)

```bash
rm -f e2e/.auth/login-data.json
npm test
```

---

#### 3. **Tests timeout / hang**

**Problem:**
```
Test timeout of 30000ms exceeded
```

**Solutions:**
- Increase timeout in `playwright.config.ts`:
```typescript
timeout: 60 * 1000, // 60 seconds
```

- Check network connectivity to Rancher
- Check if SBOM Scanner is actually installed

---

#### 4. **".env file not found" or variables undefined**

**Problem:**
```
process.env.RANCHER_URL is undefined
```

**Solution:**
- Ensure `.env` exists in `tests/` directory (not `tests/e2e/`)
- Copy from template: `cp .env.example .env`
- Check `playwright.config.ts` has:
```typescript
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
```

---

#### 5. **Selectors not found / UI changed**

**Problem:**
```
Error: Locator('.my-button') not found
```

**Solution:**
- Check if UI has changed (selector may be outdated)
- Update selector in **page object file**, not test file
- Use Playwright Inspector to find new selector:
```bash
npx playwright test --debug
```

---

#### 6. **Tests pass locally but fail in CI**

**Common causes:**
- Missing `SHOW_CONSOLE_ERRORS=false` in CI (too much console output)
- Different screen resolution (add `viewport` config)
- Race conditions (add proper waits)
- Environment differences (URLs, credentials)

**Solution:**
```yaml
# In GitHub Actions workflow
- name: Run tests
  env:
    SHOW_CONSOLE_ERRORS: false
  run: npx playwright test
```

---

#### 7. **How to debug a failing test**

```bash
# Step 1: Run in headed mode (see what's happening)
npx playwright test sbomscanner_vex_management.test.ts --headed

# Step 2: Run in debug mode (step through)
npx playwright test sbomscanner_vex_management.test.ts --debug

# Step 3: Check screenshots (in test-results/)
ls -la e2e/test-results/

# Step 4: Check trace (detailed timeline)
npx playwright show-trace e2e/test-results/.../trace.zip
```

---

### Getting Help

**Check these first:**
1. `GITHUB_ACTIONS_SETUP.md` - CI/CD setup
2. `e2e/pages/README.md` - Page Object Model documentation
3. [Playwright Docs](https://playwright.dev/)

**Still stuck?**
- Check existing tests for examples
- Review page object methods in `e2e/pages/`
- Ask team members (Leo, QA team)

---

## 📚 Best Practices

### Test Writing

1. **One test = One scenario**
   - Tests should be independent
   - Don't chain tests together
   - Clean up after yourself

2. **Use descriptive names**
   ```typescript
   // Good
   test("SBOMSCANNER > VEX MANAGEMENT > CREATE")
   
   // Bad
   test("test1")
   ```

3. **Add logging**
   ```typescript
   console.log(`Running test: ${testInfo.title}`);
   console.log(`Creating VEX: ${vexName}`);
   ```

4. **Use page objects**
   ```typescript
   // Good
   await vexPage.createVex(name, desc, uri);
   
   // Bad
   await page.locator('.btn-create').click();
   ```

### Code Organization

1. **Keep tests in `tests/` directory**
2. **Keep page objects in `pages/` directory**
3. **One page object per page**
4. **Export all page objects from `pages/index.ts`**

### Maintenance

1. **Update selectors in page objects only**
2. **Keep `.env.example` up to date**
3. **Document new page object methods**
4. **Run tests before committing**

### Security

1. **Never commit `.env`**
2. **Never commit `.auth/`**
3. **Never hardcode passwords**
4. **Use GitHub Secrets for CI**

---

## 🎓 Learning Resources

### For Beginners

1. **Start here:**
   - Read this README
   - Run `npm test` to see tests in action
   - Open `e2e/tests/sbomscanner_dashboard.test.ts` - simplest test

2. **Understand POM:**
   - Read `e2e/pages/README.md`
   - Review `e2e/pages/BasePage.ts`
   - Check `e2e/pages/VexManagementPageEnhanced.ts` - full example

3. **Write your first test:**
   - Copy an existing test file
   - Modify for your feature
   - Run it: `npx playwright test mytest.test.ts`

### For Advanced Users

- **Playwright Docs:** https://playwright.dev/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **GitHub Actions:** `GITHUB_ACTIONS_SETUP.md`
- **Debugging:** `npx playwright test --debug`

---

## 📞 Support & Contact

### Documentation

- **This file:** Test suite overview and quick start
- **`GITHUB_ACTIONS_SETUP.md`:** CI/CD integration
- **`e2e/pages/README.md`:** Page Object Model details
- **`e2e/WAITING_STRATEGIES.md`:** Wait strategies

### Team Contacts

- **QA Lead:** [Your Name]
- **Test Automation:** Leo Tseng
- **Repository:** https://github.com/neuvector/security-ui-exts

---

## 📊 Test Statistics

| Metric | Count |
|--------|-------|
| **Total Tests** | ~28 tests |
| **Test Files** | 5 files |
| **Page Objects** | 7 classes |
| **Code Reduction** | 83% (vs non-POM) |
| **Maintenance Effort** | 50x easier |

---

## ✅ Quick Reference

### Essential Commands

```bash
# Install
npm install
npx playwright install chromium

# Configure
cp ../.env.example ../.env
nano ../.env

# Run
npm test                          # All tests
npm run test:headed              # With browser visible
npx playwright test mytest.test.ts  # Specific file

# Debug
npm run test:debug               # Debug mode
npm run test:ui                  # UI mode

# Report
npm run report                   # View HTML report
```

### Project Structure

```
tests/
├── e2e/
│   ├── pages/          ← Page Object Model classes
│   ├── tests/          ← Test specifications
│   ├── fixture/        ← Test fixtures
│   └── utils/          ← Helper functions
├── .env                ← Your credentials (gitignored)
└── .env.example        ← Template
```

### Need Help?

1. Read this README
2. Check `e2e/pages/README.md`
3. Review existing tests
4. Ask the team

---

**Happy Testing! 🎉**

*Last updated: 2026-06-10*
*Maintained by: QA Team*
