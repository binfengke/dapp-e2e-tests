import { test, expect } from "../src/fixtures/dapp.fixture";
import {
  isValidAddress,
  isValidTxHash,
  getOnChainBalance,
} from "../src/utils/blockchain";

const RECIPIENT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Hardhat account #1
const SEND_AMOUNT = "0.001";
const RPC_URL = process.env.RPC_URL || "https://rpc.sepolia.org";

test.describe("Token Transfer", () => {
  test.beforeEach(async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();
    expect(await dapp.isWalletConnected()).toBe(true);
  });

  test("TC-T01: Send ETH to a valid address", async ({ dapp, metamask }) => {
    await dapp.fillTransferForm(RECIPIENT, SEND_AMOUNT);
    await dapp.submitTransfer();
    await metamask.confirmTransaction();
    await dapp.waitForTxConfirmation();

    const message = await dapp.getToastMessage();
    expect(message.toLowerCase()).toContain("success");
  });

  test("TC-T02: Reject transaction in MetaMask", async ({ dapp, metamask }) => {
    await dapp.fillTransferForm(RECIPIENT, SEND_AMOUNT);
    await dapp.submitTransfer();
    await metamask.rejectRequest();

    const message = await dapp.getToastMessage();
    expect(
      message.toLowerCase().includes("rejected") ||
      message.toLowerCase().includes("denied") ||
      message.toLowerCase().includes("cancelled")
    ).toBe(true);
  });

  test("TC-T03: Prevent sending to invalid address", async ({ dapp, page }) => {
    await dapp.fillTransferForm("0xinvalid", SEND_AMOUNT);
    await dapp.submitTransfer();

    // Should show validation error, not trigger MetaMask popup
    const errorVisible = await page
      .locator('[data-testid="error"], .error-message')
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(errorVisible).toBe(true);
  });

  test("TC-T04: Prevent sending zero amount", async ({ dapp, page }) => {
    await dapp.fillTransferForm(RECIPIENT, "0");
    await dapp.submitTransfer();

    const errorVisible = await page
      .locator('[data-testid="error"], .error-message')
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(errorVisible).toBe(true);
  });

  test("TC-T05: Prevent sending more than balance", async ({ dapp, page }) => {
    await dapp.fillTransferForm(RECIPIENT, "999999999");
    await dapp.submitTransfer();

    const errorVisible = await page
      .locator('[data-testid="error"], .error-message, [data-testid="insufficient-funds"]')
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(errorVisible).toBe(true);
  });

  test("TC-T06: Verify on-chain balance change after transfer", async ({ dapp, metamask }) => {
    const senderAddress = await dapp.getConnectedAddress();
    const balanceBefore = await getOnChainBalance(RPC_URL, senderAddress);

    await dapp.fillTransferForm(RECIPIENT, SEND_AMOUNT);
    await dapp.submitTransfer();
    await metamask.confirmTransaction();
    await dapp.waitForTxConfirmation();

    const balanceAfter = await getOnChainBalance(RPC_URL, senderAddress);
    expect(balanceAfter).toBeLessThan(balanceBefore);
  });
});
