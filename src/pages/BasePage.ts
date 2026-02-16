import { Page, Locator, expect } from "@playwright/test";

/**
 * Base page object with common dApp interaction methods.
 */
export class BasePage {
  constructor(protected page: Page) {}

  async navigate(path: string = "/") {
    await this.page.goto(path);
    await this.page.waitForLoadState("networkidle");
  }

  async waitForTxConfirmation(timeout: number = 60_000) {
    await this.page.waitForSelector('[data-testid="tx-success"], .tx-confirmed', {
      state: "visible",
      timeout,
    });
  }

  async getToastMessage(): Promise<string> {
    const toast = this.page.locator(".toast-message, [role='alert']").first();
    await toast.waitFor({ state: "visible", timeout: 10_000 });
    return (await toast.textContent()) ?? "";
  }

  async screenshotOnFailure(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }
}
