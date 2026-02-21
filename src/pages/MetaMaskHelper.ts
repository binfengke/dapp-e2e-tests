import { BrowserContext, Page } from "@playwright/test";

export interface TransactionDetails {
  from?: string;
  to?: string;
  amount?: string;
  network?: string;
  gasFee?: string;
  nonce?: string;
}

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

  /**
   * Extract transaction details shown in MetaMask confirm popup.
   * Useful for asserting expected recipient, value, network, and fee before signing.
   */
  async getTransactionDetails(): Promise<TransactionDetails> {
    const popup = await this.getPopup();
    await popup.waitForLoadState("domcontentloaded");

    const bodyText = await popup
      .locator("body")
      .innerText()
      .catch(() => "");

    return {
      amount:
        (await this.readFirstVisibleText(popup, [
          '[data-testid="confirm-page-container-content"] [data-testid="confirm-detail-row-value"]',
          '[data-testid="confirm-page-container-content"] [data-testid="confirm-page-container-summary-value"]',
          '[data-testid="confirm-page-container-content"] [data-testid="confirm-page-container-content__amount"]',
        ])) ?? this.extractFromBody(bodyText, [/Amount[:\s]+([^\n]+)/i]),
      from:
        (await this.readFirstVisibleText(popup, [
          '[data-testid="confirm-page-container-content"] [data-testid="transaction-from-value"]',
          '[data-testid="confirm-page-container-content"] [data-testid="sender-to-recipient__from"]',
        ])) ??
        this.extractFromBody(bodyText, [/From[:\s]+(0x[a-fA-F0-9]{40})/i]),
      to:
        (await this.readFirstVisibleText(popup, [
          '[data-testid="confirm-page-container-content"] [data-testid="transaction-to-value"]',
          '[data-testid="confirm-page-container-content"] [data-testid="sender-to-recipient__name"]',
        ])) ??
        this.extractFromBody(bodyText, [/To[:\s]+(0x[a-fA-F0-9]{40})/i]),
      network:
        (await this.readFirstVisibleText(popup, [
          '[data-testid="confirm-page-container-content"] [data-testid="network-display"]',
          '[data-testid="network-display"]',
        ])) ?? this.extractFromBody(bodyText, [/Network[:\s]+([^\n]+)/i]),
      gasFee:
        (await this.readFirstVisibleText(popup, [
          '[data-testid="confirm-page-container-content"] [data-testid="transaction-gas-fee"]',
          '[data-testid="confirm-page-container-content"] [data-testid="confirm-detail-row__secondary-value"]',
        ])) ?? this.extractFromBody(bodyText, [/Gas(?:\s*fee)?[:\s]+([^\n]+)/i]),
      nonce:
        (await this.readFirstVisibleText(popup, [
          '[data-testid="confirm-page-container-content"] [data-testid="transaction-nonce"]',
        ])) ?? this.extractFromBody(bodyText, [/Nonce[:\s]+([^\n]+)/i]),
    };
  }

  private async readFirstVisibleText(
    popup: Page,
    selectors: string[]
  ): Promise<string | undefined> {
    for (const selector of selectors) {
      const locator = popup.locator(selector).first();
      const visible = await locator
        .isVisible({ timeout: 1_500 })
        .catch(() => false);
      if (!visible) continue;

      const text = (await locator.textContent().catch(() => null))?.trim();
      if (text) return text;
    }
    return undefined;
  }

  private extractFromBody(
    bodyText: string,
    patterns: RegExp[]
  ): string | undefined {
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    return undefined;
  }
}
