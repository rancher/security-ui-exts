# Page Object Model (POM) Architecture

## Overview

This directory contains Page Objects for the SBOMScanner test suite. The Page Object Model (POM) pattern improves test maintainability by:

- **Centralizing selectors** - Update UI changes in one place
- **Encapsulating actions** - Reusable methods for common operations
- **Improving readability** - Tests read like business workflows
- **Type safety** - TypeScript catches errors at compile time

## Directory Structure

```
e2e/
├── pages/
│   ├── BasePage.ts                    # Base class with common functionality
│   ├── DashboardPage.ts               # Rancher home dashboard
│   ├── SBOMScannerDashboardPage.ts    # SBOMScanner main dashboard
│   ├── ImagesPage.ts                  # Images page
│   ├── RegistriesPage.ts              # Registries configuration
│   ├── VexManagementPage.ts           # VEX Management
│   ├── WorkloadsScanPage.ts           # Workloads Scan
│   ├── index.ts                       # Exports all page objects
│   └── README.md                      # This file
├── fixture/
│   ├── fixture.ts                     # Original fixture
│   └── fixture-with-pom.ts            # Enhanced fixture with page objects
├── tests/
│   ├── sbomscanner.test.ts            # Original test (before POM)
│   ├── sbomscanner_pom.test.ts        # Refactored test (manual POM)
│   └── sbomscanner_pom_fixture.test.ts # Refactored test (fixture-injected POM)
└── utils/
    └── commands.ts                    # Legacy utility functions
```

## Core Components

### BasePage

All page objects extend `BasePage`, which provides common functionality:

- Navigation (`navigateTo`, `clickMenu`)
- Element interaction (`clickElement`, `clickByText`, `typeText`)
- Verification (`verifyElementsVisible`, `verifyUrl`)
- Utilities (`delay`, `getInnerText`, `getTextContent`)

### Page Objects

Each page object represents a specific page in the application:

| Page Object | URL | Purpose |
|------------|-----|---------|
| `DashboardPage` | `/dashboard/home` | Rancher home dashboard navigation |
| `SBOMScannerDashboardPage` | `/dashboard/c/local/imageScanner/dashboard` | Main SBOMScanner dashboard |
| `ImagesPage` | `/dashboard/c/local/imageScanner/images` | Image scanning results |
| `RegistriesPage` | `/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.registry` | Registry configuration |
| `VexManagementPage` | `/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.vexhub` | VEX management |
| `WorkloadsScanPage` | `/dashboard/c/local/imageScanner/sbomscanner.kubewarden.io.workloadscanconfiguration/default?mode=edit` | Workloads scanning config |

## Usage Examples

### Approach 1: Manual Instantiation

```typescript
import { test } from "../fixture/fixture";
import { DashboardPage, SBOMScannerDashboardPage } from "../pages";

test("My test", async ({ page }) => {
  // Create page objects
  const dashboardPage = new DashboardPage(page);
  const sbomDashboard = new SBOMScannerDashboardPage(page);

  // Use page objects
  await dashboardPage.navigateToHome();
  await dashboardPage.navigateToSBOMScanner();
  await sbomDashboard.verifyPageUrl();
});
```

### Approach 2: Fixture Injection (Recommended)

```typescript
import { test } from "../fixture/fixture-with-pom";

test("My test", async ({ dashboardPage, sbomDashboardPage }) => {
  // Page objects are automatically available!
  await dashboardPage.navigateToHome();
  await dashboardPage.navigateToSBOMScanner();
  await sbomDashboardPage.verifyPageUrl();
});
```

## Before & After Comparison

### Before (Original Test)

```typescript
// Lots of low-level implementation details
await navigateTo(page, "/dashboard/home");
delay(page, 3000);
await userClickByElem(page, ".rancher-provider-icon");
await userClickByElem(page, 'span:has-text("SBOMScanner")');
await delay(page, 2000);
console.log("URL: " + page.url());
expect(page).toHaveURL("https://RANCHERURL/dashboard/c/local/imageScanner/dashboard");
```

### After (POM Test)

```typescript
// Business-focused, readable workflow
await dashboardPage.navigateToHome();
await dashboardPage.navigateToSBOMScanner();
await sbomDashboardPage.verifyPageUrl();
```

## Creating New Page Objects

1. **Create a new file** in `pages/` directory
2. **Extend BasePage**:

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyNewPage extends BasePage {
  // Define URL
  readonly url = 'https://RANCHERURL/path/to/page';

  // Define selectors
  private readonly myButton = '.my-button';
  private readonly myInput = '#my-input';

  constructor(page: Page) {
    super(page);
  }

  // Add page-specific methods
  async clickMyButton() {
    await this.clickElement(this.myButton);
  }

  async fillInput(text: string) {
    await this.typeText(this.myInput, text);
  }

  async verifyPageUrl() {
    await this.verifyUrl(this.url);
  }
}
```

3. **Export from index.ts**:

```typescript
export { MyNewPage } from './MyNewPage';
```

4. **Add to fixture** (optional, for fixture injection):

```typescript
// In fixture-with-pom.ts
import { MyNewPage } from '../pages';

type PageObjects = {
  // ... existing page objects
  myNewPage: MyNewPage;
};

export const test = base.extend<PageObjects>({
  // ... existing fixtures
  myNewPage: async ({ page }, use) => {
    await use(new MyNewPage(page));
  },
});
```

## Best Practices

### 1. Keep Selectors Private

```typescript
// Good
private readonly submitButton = '.btn-submit';

async clickSubmit() {
  await this.clickElement(this.submitButton);
}

// Bad - exposes implementation details
public readonly submitButton = '.btn-submit';
```

### 2. Return Promises for Actions

```typescript
// Good
async fillForm(name: string, email: string): Promise<void> {
  await this.typeText(this.nameInput, name);
  await this.typeText(this.emailInput, email);
}
```

### 3. Use Descriptive Method Names

```typescript
// Good
async navigateToSBOMScanner() { ... }
async verifyDashboardElements() { ... }

// Bad
async go() { ... }
async check() { ... }
```

### 4. Group Related Selectors

```typescript
// Group as arrays when needed for batch operations
private readonly formElements = [
  this.nameInput,
  this.emailInput,
  this.submitButton
];

async verifyFormVisible() {
  await this.verifyElementsVisible(this.formElements);
}
```

### 5. Add Logging

```typescript
async performImportantAction() {
  console.log("=> Performing important action");
  await this.clickElement(this.importantButton);
}
```

## Migration Guide

To migrate existing tests to POM:

1. **Identify the pages** used in the test
2. **Replace low-level actions** with page object methods
3. **Remove direct selector usage** from tests
4. **Use fixture injection** for cleaner code

### Example Migration

```typescript
// Before
test("My test", async ({ page }) => {
  await navigateTo(page, "/dashboard/home");
  await userClickByElem(page, ".some-button");
  const text = await retrInnerText(page, ".some-text");
  expect(page).toHaveURL("expected-url");
});

// After
test("My test", async ({ dashboardPage }) => {
  await dashboardPage.navigateToHome();
  await dashboardPage.clickSomeButton();
  const text = await dashboardPage.getSomeText();
  await dashboardPage.verifyPageUrl();
});
```

## Benefits Achieved

✅ **Maintainability** - Selector changes only need updates in one place  
✅ **Readability** - Tests are easier to understand and review  
✅ **Reusability** - Common actions are shared across tests  
✅ **Type Safety** - TypeScript catches errors before runtime  
✅ **Testability** - Easier to write and maintain tests  
✅ **Documentation** - Page objects serve as living documentation

## Next Steps

1. **Review example tests**: Check [sbomscanner_pom_fixture.test.ts](../tests/sbomscanner_pom_fixture.test.ts)
2. **Migrate existing tests**: Convert one test at a time to POM
3. **Add new page objects**: As you test new pages, create corresponding page objects
4. **Extend functionality**: Add methods to page objects as needed

## Questions?

- Check [BasePage.ts](./BasePage.ts) for available common methods
- Look at existing page objects for patterns and examples
- Review test examples for usage patterns
