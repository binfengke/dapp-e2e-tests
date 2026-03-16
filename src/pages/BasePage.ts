import { expect, Locator, Page } from "@playwright/test";

/**
 * Base page object with common dApp interaction methods.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(path: string = "/") {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
  }

  async waitForTxConfirmation(timeout: number = 60_000) {
    const confirmation = this.page
      .getByTestId("tx-success")
      .or(this.page.locator(".tx-confirmed"))
      .first();
    await expect(confirmation).toBeVisible({ timeout });
  }

  async getToastMessage(): Promise<string> {
    const toast = this.page
      .getByRole("alert")
      .or(this.page.locator(".toast-message"))
      .first();
    await expect(toast).toBeVisible({ timeout: 10_000 });
    return (await toast.textContent())?.trim() ?? "";
  }

  async screenshotOnFailure(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }
}
