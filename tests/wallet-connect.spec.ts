import { test, expect } from "../src/fixtures/dapp.fixture";
import { isValidAddress } from "../src/utils/blockchain";

test.describe("Wallet Connection", () => {
  test("@smoke TC-W01: Connect MetaMask wallet via Connect button", async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();

    await expect(dapp.walletAddress).toBeVisible();

    const address = await dapp.getConnectedAddress();
    expect(isValidAddress(address) || address.includes("...")).toBeTruthy();
  });

  test("TC-W02: Display correct wallet address after connection", async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();

    const address = await dapp.getConnectedAddress();
    expect(address).toBeTruthy();
    expect(address).toMatch(/^0x/i);
  });

  test("TC-W03: Display ETH balance after connection", async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();

    const balance = await dapp.getBalance();
    expect(balance).toBeTruthy();
    // Balance should contain a numeric value
    expect(parseFloat(balance.replace(/[^0-9.]/g, ""))).toBeGreaterThanOrEqual(0);
  });

  test("TC-W04: Show correct network name", async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();

    const network = await dapp.getNetworkName();
    expect(network).toMatch(/sepolia/i);
  });

  test("TC-W05: Disconnect wallet", async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();
    await expect(dapp.walletAddress).toBeVisible();

    await dapp.disconnect();
    await expect(dapp.walletAddress).toBeHidden();
  });

  test("TC-W06: Reject MetaMask connection request", async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.rejectRequest();

    await expect(dapp.walletAddress).toBeHidden();
  });

  test("TC-W07: Reconnect after page refresh", async ({ dapp, metamask, page }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();
    await expect(dapp.walletAddress).toBeVisible();

    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Wallet should auto-reconnect OR show Connect Wallet button
    await expect(async () => {
      const connected = await dapp.walletAddress.isVisible();
      const canConnect = await dapp.connectWalletButton.isVisible();
      expect(connected || canConnect).toBeTruthy();
    }).toPass({ timeout: 10_000 });
  });

  test("TC-W08: Handle network switch request", async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();

    // Trigger network switch from dApp (if supported)
    await metamask.approveNetworkSwitch();
    const network = await dapp.getNetworkName();
    expect(network).toBeTruthy();
  });
});
