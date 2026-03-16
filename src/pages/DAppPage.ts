import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page object for dApp frontend interactions.
 * Covers wallet connection, token operations, and NFT actions.
 */
export class DAppPage extends BasePage {
  // --- Wallet ---
  readonly connectWalletButton: Locator;
  readonly disconnectButton: Locator;
  readonly walletAddress: Locator;
  readonly balanceDisplay: Locator;
  readonly networkBadge: Locator;

  // --- Transfer ---
  readonly recipientInput: Locator;
  readonly amountInput: Locator;
  readonly sendButton: Locator;

  // --- NFT ---
  readonly mintButton: Locator;
  readonly nftGallery: Locator;
  readonly nftItems: Locator;

  // --- Swap ---
  readonly tokenInSelect: Locator;
  readonly tokenOutSelect: Locator;
  readonly swapAmountInput: Locator;
  readonly priceImpact: Locator;
  readonly swapButton: Locator;

  readonly validationError: Locator;
  readonly networkWarning: Locator;
  readonly anyErrorOrWarning: Locator;

  constructor(page: Page) {
    super(page);

    this.connectWalletButton = page
      .getByRole("button", { name: /connect wallet/i })
      .or(page.getByTestId("connect-wallet"));
    this.disconnectButton = page
      .getByRole("button", { name: /disconnect/i })
      .or(page.getByTestId("disconnect"));
    this.walletAddress = page.getByTestId("wallet-address");
    this.balanceDisplay = page.getByTestId("balance");
    this.networkBadge = page.getByTestId("network-name");

    this.recipientInput = page
      .getByLabel(/recipient/i)
      .or(page.getByTestId("recipient-address"))
      .or(page.locator('input[name="recipient"]'));
    this.amountInput = page
      .getByLabel(/amount/i)
      .or(page.getByTestId("amount"))
      .or(page.locator('input[name="amount"]'));
    this.sendButton = page
      .getByRole("button", { name: /^send$/i })
      .or(page.getByTestId("send-btn"));

    this.mintButton = page
      .getByRole("button", { name: /^mint$/i })
      .or(page.getByTestId("mint-btn"));
    this.nftGallery = page.getByTestId("nft-gallery");
    this.nftItems = this.nftGallery
      .getByTestId("nft-item")
      .or(this.nftGallery.locator(".nft-item"));

    this.tokenInSelect = page.getByTestId("token-in");
    this.tokenOutSelect = page.getByTestId("token-out");
    this.swapAmountInput = page.getByTestId("swap-amount");
    this.priceImpact = page.getByTestId("price-impact");
    this.swapButton = page
      .getByRole("button", { name: /^swap$/i })
      .or(page.getByTestId("swap-btn"));

    this.validationError = page
      .getByTestId("error")
      .or(page.getByTestId("insufficient-funds"))
      .or(page.locator(".error-message"));

    this.networkWarning = page
      .getByTestId("wrong-network")
      .or(page.getByTestId("unsupported-network"))
      .or(page.locator(".network-error"));

    this.anyErrorOrWarning = this.validationError.or(this.networkWarning);
  }

  async clickConnectWallet() {
    await this.connectWalletButton.click();
  }

  async isWalletConnected(): Promise<boolean> {
    return this.walletAddress.isVisible();
  }

  async getConnectedAddress(): Promise<string> {
    await expect(this.walletAddress).toBeVisible({ timeout: 15_000 });
    return (await this.walletAddress.textContent())?.trim() ?? "";
  }

  async getBalance(): Promise<string> {
    await expect(this.balanceDisplay).toBeVisible({ timeout: 15_000 });
    return (await this.balanceDisplay.textContent())?.trim() ?? "";
  }

  async getNetworkName(): Promise<string> {
    await expect(this.networkBadge).toBeVisible({ timeout: 10_000 });
    return (await this.networkBadge.textContent())?.trim() ?? "";
  }

  async disconnect() {
    await this.disconnectButton.click();
  }

  // --- Token Transfer ---

  async fillTransferForm(recipient: string, amount: string) {
    await this.recipientInput.fill(recipient);
    await this.amountInput.fill(amount);
  }

  async submitTransfer() {
    await this.sendButton.click();
  }

  // --- NFT Mint ---

  async clickMint() {
    await this.mintButton.click();
  }

  async getNftCount(): Promise<number> {
    await expect(this.nftGallery).toBeVisible({ timeout: 15_000 });
    return this.nftItems.count();
  }

  async tryGetNftCount(timeoutMs = 5_000): Promise<number> {
    try {
      await expect(this.nftGallery).toBeVisible({ timeout: timeoutMs });
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        return 0;
      }
      throw err;
    }
    return this.nftItems.count();
  }

  // --- Swap ---

  async fillSwapForm(tokenIn: string, tokenOut: string, amount: string) {
    await this.tokenInSelect.selectOption(tokenIn);
    await this.tokenOutSelect.selectOption(tokenOut);
    await this.swapAmountInput.fill(amount);
  }

  async getPriceImpact(): Promise<string> {
    await expect(this.priceImpact).toBeVisible({ timeout: 10_000 });
    return (await this.priceImpact.textContent())?.trim() ?? "";
  }

  async submitSwap() {
    await this.swapButton.click();
  }
}
