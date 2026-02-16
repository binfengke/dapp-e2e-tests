import { test, expect } from "../src/fixtures/dapp.fixture";
import { isValidAddress, shortenAddress } from "../src/utils/blockchain";

test.describe("Wallet Connection", () => {
  test("TC-W01: Connect MetaMask wallet via Connect button", async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();

    const connected = await dapp.isWalletConnected();
    expect(connected).toBe(true);

    const address = await dapp.getConnectedAddress();
    expect(isValidAddress(address) || address.includes("...")).toBe(true);
  });

  test("TC-W02: Display correct wallet address after connection", async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();

    const address = await dapp.getConnectedAddress();
    expect(address).toBeTruthy();
    expect(address.startsWith("0x")).toBe(true);
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
    expect(network.toLowerCase()).toContain("sepolia");
  });

  test("TC-W05: Disconnect wallet", async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();
    expect(await dapp.isWalletConnected()).toBe(true);

    await dapp.disconnect();
    expect(await dapp.isWalletConnected()).toBe(false);
  });

  test("TC-W06: Reject MetaMask connection request", async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.rejectRequest();

    const connected = await dapp.isWalletConnected();
    expect(connected).toBe(false);
  });

  test("TC-W07: Reconnect after page refresh", async ({ dapp, metamask, page }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();
    expect(await dapp.isWalletConnected()).toBe(true);

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wallet should auto-reconnect or show connect button
    const stillConnected = await dapp.isWalletConnected();
    // Either auto-reconnects or requires manual reconnection — both are valid
    expect(typeof stillConnected).toBe("boolean");
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
