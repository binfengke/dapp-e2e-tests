import { test, expect } from "../src/fixtures/dapp.fixture";

test.describe("Token Swap", () => {
  test.beforeEach(async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();
    expect(await dapp.isWalletConnected()).toBe(true);
  });

  test("TC-S01: Execute a token swap (ETH → USDC)", async ({ dapp, metamask }) => {
    await dapp.fillSwapForm("ETH", "USDC", "0.001");

    const impact = await dapp.getPriceImpact();
    expect(impact).toBeTruthy();

    await dapp.submitSwap();
    // First approval tx for ERC-20 allowance (if needed)
    await metamask.approveTokenSpending().catch(() => {});
    // Then the actual swap tx
    await metamask.confirmTransaction();
    await dapp.waitForTxConfirmation();

    const message = await dapp.getToastMessage();
    expect(message.toLowerCase()).toContain("success");
  });

  test("TC-S02: Reject swap transaction", async ({ dapp, metamask }) => {
    await dapp.fillSwapForm("ETH", "USDC", "0.001");
    await dapp.submitSwap();
    await metamask.rejectRequest();

    const message = await dapp.getToastMessage();
    expect(
      message.toLowerCase().includes("rejected") ||
      message.toLowerCase().includes("denied") ||
      message.toLowerCase().includes("cancelled")
    ).toBe(true);
  });

  test("TC-S03: Show price impact warning for large swap", async ({ dapp }) => {
    await dapp.fillSwapForm("ETH", "USDC", "1000");

    const impact = await dapp.getPriceImpact();
    const impactValue = parseFloat(impact.replace(/[^0-9.]/g, ""));
    // Large swaps should show noticeable price impact
    expect(impactValue).toBeGreaterThan(0);
  });

  test("TC-S04: Prevent swap with zero amount", async ({ dapp, page }) => {
    await dapp.fillSwapForm("ETH", "USDC", "0");
    await dapp.submitSwap();

    const errorVisible = await page
      .locator('[data-testid="error"], .error-message')
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(errorVisible).toBe(true);
  });

  test("TC-S05: Prevent swap with insufficient balance", async ({ dapp, page }) => {
    await dapp.fillSwapForm("ETH", "USDC", "999999999");
    await dapp.submitSwap();

    const errorVisible = await page
      .locator('[data-testid="error"], .error-message, [data-testid="insufficient-funds"]')
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(errorVisible).toBe(true);
  });

  test("TC-S06: ERC-20 token approval flow before swap", async ({ dapp, metamask }) => {
    // Swap from a token that requires approval (e.g., USDC → ETH)
    await dapp.fillSwapForm("USDC", "ETH", "1");
    await dapp.submitSwap();

    // Should trigger approval popup first
    await metamask.approveTokenSpending();
    // Then the swap confirmation
    await metamask.confirmTransaction();
    await dapp.waitForTxConfirmation();

    const message = await dapp.getToastMessage();
    expect(message.toLowerCase()).toContain("success");
  });
});
