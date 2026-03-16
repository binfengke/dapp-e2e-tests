import { BrowserContext, Locator, Page } from "@playwright/test";

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

  private isTimeoutError(err: unknown) {
    return err instanceof Error && err.name === "TimeoutError";
  }

  private async isVisibleOrTimeout(locator: Locator, timeoutMs: number) {
    try {
      return await locator.isVisible({ timeout: timeoutMs });
    } catch (err) {
      if (this.isTimeoutError(err)) return false;
      throw err;
    }
  }

  /**
   * Wait for MetaMask popup window to appear and return its page object.
   */
  async getPopup(): Promise<Page> {
    const popup = await this.context.waitForEvent("page", { timeout: 30_000 });
    await popup.waitForLoadState("domcontentloaded");
    return popup;
  }

  /**
   * Try to get a MetaMask popup window within a short timeout.
   * Returns null when no popup appears (useful for optional flows).
   */
  async tryGetPopup(timeoutMs: number = 3_000): Promise<Page | null> {
    try {
      const popup = await this.context.waitForEvent("page", { timeout: timeoutMs });
      await popup.waitForLoadState("domcontentloaded");
      return popup;
    } catch (err) {
      if (this.isTimeoutError(err)) return null;
      throw err;
    }
  }

  /**
   * Approve a MetaMask connection request (the "Connect" popup).
   */
  async approveConnection() {
    const popup = await this.getPopup();
    // Synpress / MetaMask test popup flow
    const nextBtn = popup.getByRole("button", { name: /^next$/i });
    if (await this.isVisibleOrTimeout(nextBtn, 2_000)) {
      await nextBtn.click();
    }

    const connectBtn = popup
      .getByRole("button", { name: /^connect$/i })
      .or(popup.getByTestId("page-container-footer-next"));
    await connectBtn.click();
    await popup.waitForEvent("close", { timeout: 10_000 }).catch(() => {});
  }

  /**
   * Confirm a transaction in MetaMask popup.
   */
  async confirmTransaction() {
    const popup = await this.getPopup();
    const confirmBtn = popup
      .getByRole("button", { name: /^confirm$/i })
      .or(popup.getByTestId("page-container-footer-next"));
    await confirmBtn.waitFor({ state: "visible", timeout: 15_000 });
    await confirmBtn.click();
    await popup.waitForEvent("close", { timeout: 30_000 }).catch(() => {});
  }

  /**
   * Confirm the next MetaMask popup, and if a second popup appears shortly after,
   * confirm that one as well. Useful for flows like "approval → swap" where the
   * approval step may or may not be required.
   *
   * Returns the number of popups confirmed (1 or 2).
   */
  async confirmTransactionWithOptionalSecondPopup(timeoutMs: number = 3_000): Promise<number> {
    const first = await this.getPopup();
    const firstConfirmBtn = first
      .getByRole("button", { name: /^(approve|confirm)$/i })
      .or(first.getByTestId("page-container-footer-next"));
    await firstConfirmBtn.waitFor({ state: "visible", timeout: 15_000 });
    await firstConfirmBtn.click();
    await first.waitForEvent("close", { timeout: 30_000 }).catch(() => {});

    const second = await this.tryGetPopup(timeoutMs);
    if (!second) return 1;

    const secondConfirmBtn = second
      .getByRole("button", { name: /^confirm$/i })
      .or(second.getByTestId("page-container-footer-next"));
    await secondConfirmBtn.waitFor({ state: "visible", timeout: 15_000 });
    await secondConfirmBtn.click();
    await second.waitForEvent("close", { timeout: 30_000 }).catch(() => {});
    return 2;
  }

  /**
   * Sign a message in MetaMask popup.
   */
  async signMessage() {
    const popup = await this.getPopup();
    const signBtn = popup
      .getByTestId("request-signature__sign")
      .or(popup.getByRole("button", { name: /^sign$/i }));
    await signBtn.waitFor({ state: "visible", timeout: 15_000 });
    await signBtn.click();
    await popup.waitForEvent("close", { timeout: 10_000 }).catch(() => {});
  }

  /**
   * Reject a transaction or signature request in MetaMask popup.
   */
  async rejectRequest() {
    const popup = await this.getPopup();
    const rejectBtn = popup.getByRole("button", { name: /^reject$/i });
    const cancelBtn = popup.getByRole("button", { name: /^cancel$/i });

    if (await this.isVisibleOrTimeout(rejectBtn, 2_000)) {
      await rejectBtn.click();
    } else {
      await cancelBtn.waitFor({ state: "visible", timeout: 10_000 });
      await cancelBtn.click();
    }
    await popup.waitForEvent("close", { timeout: 10_000 }).catch(() => {});
  }

  /**
   * Switch network in MetaMask popup when dApp requests network change.
   */
  async approveNetworkSwitch() {
    const popup = await this.getPopup();
    const switchNetworkBtn = popup.getByRole("button", { name: /switch network/i });
    const approveBtn = popup.getByRole("button", { name: /^approve$/i });

    if (await this.isVisibleOrTimeout(switchNetworkBtn, 2_000)) {
      await switchNetworkBtn.click();
    } else {
      await approveBtn.waitFor({ state: "visible", timeout: 10_000 });
      await approveBtn.click();
    }
    await popup.waitForEvent("close", { timeout: 10_000 }).catch(() => {});
  }

  /**
   * Approve token spending allowance (ERC-20 approve).
   */
  async approveTokenSpending() {
    const popup = await this.getPopup();
    // Some dApps show a "Use default" or custom approval amount
    const approveBtn = popup.getByRole("button", { name: /^approve$/i });
    const confirmBtn = popup.getByRole("button", { name: /^confirm$/i });

    if (!(await this.isVisibleOrTimeout(approveBtn, 2_000))) {
      await confirmBtn.waitFor({ state: "visible", timeout: 15_000 });
      await confirmBtn.click();
      await popup.waitForEvent("close", { timeout: 10_000 }).catch(() => {});
      return;
    }
    await approveBtn.waitFor({ state: "visible", timeout: 15_000 });
    await approveBtn.click();
    await popup.waitForEvent("close", { timeout: 10_000 }).catch(() => {});
  }

  /**
   * Approve token spending when an approval popup is expected but not guaranteed.
   * Returns true when approval happened, false when no popup appeared.
   */
  async maybeApproveTokenSpending(timeoutMs: number = 3_000): Promise<boolean> {
    const popup = await this.tryGetPopup(timeoutMs);
    if (!popup) return false;

    const approveBtn = popup.getByRole("button", { name: /^approve$/i });
    const confirmBtn = popup.getByRole("button", { name: /^confirm$/i });

    if (await this.isVisibleOrTimeout(approveBtn, 2_000)) {
      await approveBtn.click();
    } else {
      await confirmBtn.waitFor({ state: "visible", timeout: 15_000 });
      await confirmBtn.click();
    }
    await popup.waitForEvent("close", { timeout: 10_000 }).catch(() => {});
    return true;
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
      const visible = await this.isVisibleOrTimeout(locator, 1_500);
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
