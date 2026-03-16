import { test, expect } from "../src/fixtures/dapp.fixture";

test.describe("Token Swap", () => {
  test("@smoke TC-S01: Execute a token swap (ETH → USDC)", async ({ connectedDapp: dapp, metamask }) => {
    await dapp.fillSwapForm("ETH", "USDC", "0.001");

    const impact = await dapp.getPriceImpact();
    expect(impact).toBeTruthy();

    await dapp.submitSwap();
    await metamask.confirmTransactionWithOptionalSecondPopup();
    await dapp.waitForTxConfirmation();

    const message = await dapp.getToastMessage();
    expect(message).toMatch(/success/i);
  });

  test("TC-S02: Reject swap transaction", async ({ connectedDapp: dapp, metamask }) => {
    await dapp.fillSwapForm("ETH", "USDC", "0.001");
    await dapp.submitSwap();
    await metamask.rejectRequest();

    const message = await dapp.getToastMessage();
    expect(message).toMatch(/rejected|denied|cancelled/i);
  });

  test("TC-S03: Show price impact warning for large swap", async ({ connectedDapp: dapp }) => {
    await dapp.fillSwapForm("ETH", "USDC", "1000");

    const impact = await dapp.getPriceImpact();
    const impactValue = parseFloat(impact.replace(/[^0-9.]/g, ""));
    // Large swaps should show noticeable price impact
    expect(impactValue).toBeGreaterThan(0);
  });

  test("TC-S04: Prevent swap with zero amount", async ({ connectedDapp: dapp }) => {
    await dapp.fillSwapForm("ETH", "USDC", "0");
    await dapp.submitSwap();

    await expect(dapp.validationError.first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC-S05: Prevent swap with insufficient balance", async ({ connectedDapp: dapp }) => {
    await dapp.fillSwapForm("ETH", "USDC", "999999999");
    await dapp.submitSwap();

    await expect(dapp.validationError.first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC-S06: ERC-20 token approval flow before swap", async ({ connectedDapp: dapp, metamask }) => {
    // Swap from a token that requires approval (e.g., USDC → ETH)
    await dapp.fillSwapForm("USDC", "ETH", "1");
    await dapp.submitSwap();

    await metamask.confirmTransactionWithOptionalSecondPopup();
    await dapp.waitForTxConfirmation();

    const message = await dapp.getToastMessage();
    expect(message).toMatch(/success/i);
  });
});
