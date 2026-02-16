import { BrowserContext, Page } from "@playwright/test";

/**
 * Helper for MetaMask wallet interactions via Synpress.
 * Wraps common MetaMask popup operations for test readability.
 */
export class MetaMaskHelper {
  constructor(
    private context: BrowserContext,
    private page: Page
  ) {}

  /**
   * Wait for MetaMask popup window to appear and return its page object.
   */
  async getPopup(): Promise<Page> {
    const popup = await this.context.waitForEvent("page", { timeout: 30_000 });
    await popup.waitForLoadState("domcontentloaded");
    return popup;
  }

  /**
   * Approve a MetaMask connection request (the "Connect" popup).
   */
  async approveConnection() {
    const popup = await this.getPopup();
    // Synpress / MetaMask test popup flow
    const nextBtn = popup.locator('button:has-text("Next"), [data-testid="page-container-footer-next"]');
    if (await nextBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await nextBtn.click();
    }
    const connectBtn = popup.locator('button:has-text("Connect"), [data-testid="page-container-footer-next"]');
    await connectBtn.click();
    await popup.waitForEvent("close", { timeout: 10_000 }).catch(() => {});
  }

  /**
   * Confirm a transaction in MetaMask popup.
   */
  async confirmTransaction() {
    const popup = await this.getPopup();
    const confirmBtn = popup.locator('button:has-text("Confirm"), [data-testid="page-container-footer-next"]');
    await confirmBtn.waitFor({ state: "visible", timeout: 15_000 });
    await confirmBtn.click();
    await popup.waitForEvent("close", { timeout: 30_000 }).catch(() => {});
  }

  /**
   * Sign a message in MetaMask popup.
   */
  async signMessage() {
    const popup = await this.getPopup();
    const signBtn = popup.locator('button:has-text("Sign"), [data-testid="request-signature__sign"]');
    await signBtn.waitFor({ state: "visible", timeout: 15_000 });
    await signBtn.click();
    await popup.waitForEvent("close", { timeout: 10_000 }).catch(() => {});
  }

  /**
   * Reject a transaction or signature request in MetaMask popup.
   */
  async rejectRequest() {
    const popup = await this.getPopup();
    const rejectBtn = popup.locator('button:has-text("Reject"), button:has-text("Cancel")');
    await rejectBtn.waitFor({ state: "visible", timeout: 10_000 });
    await rejectBtn.click();
    await popup.waitForEvent("close", { timeout: 10_000 }).catch(() => {});
  }

  /**
   * Switch network in MetaMask popup when dApp requests network change.
   */
  async approveNetworkSwitch() {
    const popup = await this.getPopup();
    const switchBtn = popup.locator('button:has-text("Switch network"), button:has-text("Approve")');
    await switchBtn.waitFor({ state: "visible", timeout: 10_000 });
    await switchBtn.click();
    await popup.waitForEvent("close", { timeout: 10_000 }).catch(() => {});
  }

  /**
   * Approve token spending allowance (ERC-20 approve).
   */
  async approveTokenSpending() {
    const popup = await this.getPopup();
    // Some dApps show a "Use default" or custom approval amount
    const approveBtn = popup.locator('button:has-text("Approve"), button:has-text("Confirm")');
    await approveBtn.waitFor({ state: "visible", timeout: 15_000 });
    await approveBtn.click();
    await popup.waitForEvent("close", { timeout: 10_000 }).catch(() => {});
  }
}
