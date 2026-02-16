import { Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page object for dApp frontend interactions.
 * Covers wallet connection, token operations, and NFT actions.
 */
export class DAppPage extends BasePage {
  // --- Selectors ---
  private connectWalletBtn = '[data-testid="connect-wallet"], button:has-text("Connect Wallet")';
  private walletAddress = '[data-testid="wallet-address"]';
  private balanceDisplay = '[data-testid="balance"]';
  private networkBadge = '[data-testid="network-name"]';
  private disconnectBtn = '[data-testid="disconnect"], button:has-text("Disconnect")';

  // Transfer
  private recipientInput = '[data-testid="recipient-address"], input[name="recipient"]';
  private amountInput = '[data-testid="amount"], input[name="amount"]';
  private sendBtn = '[data-testid="send-btn"], button:has-text("Send")';

  // NFT
  private mintBtn = '[data-testid="mint-btn"], button:has-text("Mint")';
  private nftGallery = '[data-testid="nft-gallery"]';

  // Swap
  private tokenInSelect = '[data-testid="token-in"]';
  private tokenOutSelect = '[data-testid="token-out"]';
  private swapAmountInput = '[data-testid="swap-amount"]';
  private swapBtn = '[data-testid="swap-btn"], button:has-text("Swap")';
  private priceImpact = '[data-testid="price-impact"]';

  constructor(page: Page) {
    super(page);
  }

  // --- Wallet Connection ---

  async clickConnectWallet() {
    await this.page.click(this.connectWalletBtn);
  }

  async isWalletConnected(): Promise<boolean> {
    return this.page.locator(this.walletAddress).isVisible();
  }

  async getConnectedAddress(): Promise<string> {
    const el = this.page.locator(this.walletAddress);
    await el.waitFor({ state: "visible", timeout: 15_000 });
    return (await el.textContent()) ?? "";
  }

  async getBalance(): Promise<string> {
    const el = this.page.locator(this.balanceDisplay);
    await el.waitFor({ state: "visible", timeout: 15_000 });
    return (await el.textContent()) ?? "";
  }

  async getNetworkName(): Promise<string> {
    const el = this.page.locator(this.networkBadge);
    await el.waitFor({ state: "visible", timeout: 10_000 });
    return (await el.textContent()) ?? "";
  }

  async disconnect() {
    await this.page.click(this.disconnectBtn);
  }

  // --- Token Transfer ---

  async fillTransferForm(recipient: string, amount: string) {
    await this.page.fill(this.recipientInput, recipient);
    await this.page.fill(this.amountInput, amount);
  }

  async submitTransfer() {
    await this.page.click(this.sendBtn);
  }

  // --- NFT Mint ---

  async clickMint() {
    await this.page.click(this.mintBtn);
  }

  async getNftCount(): Promise<number> {
    const gallery = this.page.locator(this.nftGallery);
    await gallery.waitFor({ state: "visible", timeout: 15_000 });
    return gallery.locator(".nft-item, [data-testid='nft-item']").count();
  }

  // --- Swap ---

  async fillSwapForm(tokenIn: string, tokenOut: string, amount: string) {
    await this.page.selectOption(this.tokenInSelect, tokenIn);
    await this.page.selectOption(this.tokenOutSelect, tokenOut);
    await this.page.fill(this.swapAmountInput, amount);
  }

  async getPriceImpact(): Promise<string> {
    const el = this.page.locator(this.priceImpact);
    await el.waitFor({ state: "visible", timeout: 10_000 });
    return (await el.textContent()) ?? "";
  }

  async submitSwap() {
    await this.page.click(this.swapBtn);
  }
}
