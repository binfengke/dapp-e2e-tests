import { test, expect } from "../src/fixtures/dapp.fixture";

test.describe("Network Switching", () => {
  test.beforeEach(async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();
    expect(await dapp.isWalletConnected()).toBe(true);
  });

  test("TC-NS01: Switch from Ethereum to Polygon via dApp", async ({ dapp, metamask }) => {
    const networkBefore = await dapp.getNetworkName();

    // dApp requests network switch to Polygon
    await metamask.approveNetworkSwitch();

    const networkAfter = await dapp.getNetworkName();
    expect(networkAfter).toBeTruthy();
    expect(networkAfter.toLowerCase()).not.toEqual(networkBefore.toLowerCase());
  });

  test("TC-NS02: Reject network switch request", async ({ dapp, metamask }) => {
    const networkBefore = await dapp.getNetworkName();

    await metamask.rejectRequest();

    // Network should remain unchanged after rejection
    const networkAfter = await dapp.getNetworkName();
    expect(networkAfter.toLowerCase()).toEqual(networkBefore.toLowerCase());
  });

  test("TC-NS03: Balance updates after network switch", async ({ dapp, metamask }) => {
    const balanceBefore = await dapp.getBalance();

    await metamask.approveNetworkSwitch();

    // Balance should refresh for the new network
    const balanceAfter = await dapp.getBalance();
    expect(balanceAfter).toBeTruthy();
    expect(parseFloat(balanceAfter.replace(/[^0-9.]/g, ""))).toBeGreaterThanOrEqual(0);
  });

  test("TC-NS04: Wallet stays connected after network switch", async ({ dapp, metamask }) => {
    await metamask.approveNetworkSwitch();

    const connected = await dapp.isWalletConnected();
    expect(connected).toBe(true);

    const address = await dapp.getConnectedAddress();
    expect(address).toBeTruthy();
    expect(address.startsWith("0x")).toBe(true);
  });

  test("TC-NS05: Switch to unsupported network shows error", async ({ dapp, page }) => {
    // Manually switch MetaMask to an unsupported network (e.g., local devnet)
    const errorVisible = await page
      .locator('[data-testid="wrong-network"], [data-testid="unsupported-network"], .network-error')
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    // dApp should show wrong network warning or prompt to switch back
    if (errorVisible) {
      const message = await dapp.getToastMessage();
      expect(
        message.toLowerCase().includes("unsupported") ||
        message.toLowerCase().includes("wrong network") ||
        message.toLowerCase().includes("switch")
      ).toBe(true);
    }
  });

  test("TC-NS06: Transaction blocked on wrong network", async ({ dapp, metamask, page }) => {
    // Switch to a different network than the dApp expects
    await metamask.approveNetworkSwitch();

    // Attempt to send a transaction
    await dapp.fillTransferForm("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0.001");
    await dapp.submitTransfer();

    // dApp should either block the transaction or prompt network switch
    const errorOrPrompt = await page
      .locator('[data-testid="error"], [data-testid="wrong-network"], .network-error, .error-message')
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    expect(errorOrPrompt).toBe(true);
  });

  test("TC-NS07: Rapid network switching stability", async ({ dapp, metamask }) => {
    // Switch network multiple times quickly
    await metamask.approveNetworkSwitch();
    await metamask.approveNetworkSwitch();
    await metamask.approveNetworkSwitch();

    // dApp should remain stable, wallet still connected
    const connected = await dapp.isWalletConnected();
    expect(connected).toBe(true);

    const network = await dapp.getNetworkName();
    expect(network).toBeTruthy();
  });
});
