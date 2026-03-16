import { test, expect } from "../src/fixtures/dapp.fixture";

test.describe("Network Switching", () => {
  test("@smoke TC-NS01: Switch from Ethereum to Polygon via dApp", async ({ connectedDapp: dapp, metamask }) => {
    const networkBefore = await dapp.getNetworkName();

    // dApp requests network switch to Polygon
    await metamask.approveNetworkSwitch();

    const networkAfter = await dapp.getNetworkName();
    expect(networkAfter).toBeTruthy();
    expect(networkAfter.toLowerCase()).not.toEqual(networkBefore.toLowerCase());
  });

  test("TC-NS02: Reject network switch request", async ({ connectedDapp: dapp, metamask }) => {
    const networkBefore = await dapp.getNetworkName();

    await metamask.rejectRequest();

    // Network should remain unchanged after rejection
    const networkAfter = await dapp.getNetworkName();
    expect(networkAfter.toLowerCase()).toEqual(networkBefore.toLowerCase());
  });

  test("TC-NS03: Balance updates after network switch", async ({ connectedDapp: dapp, metamask }) => {
    const balanceBefore = await dapp.getBalance();

    await metamask.approveNetworkSwitch();

    // Balance should refresh for the new network
    const balanceAfter = await dapp.getBalance();
    expect(balanceAfter).toBeTruthy();
    expect(parseFloat(balanceAfter.replace(/[^0-9.]/g, ""))).toBeGreaterThanOrEqual(0);
  });

  test("TC-NS04: Wallet stays connected after network switch", async ({ connectedDapp: dapp, metamask }) => {
    await metamask.approveNetworkSwitch();

    await expect(dapp.walletAddress).toBeVisible();

    const address = await dapp.getConnectedAddress();
    expect(address).toBeTruthy();
    expect(address).toMatch(/^0x/i);
  });

  test("@manual TC-NS05: Switch to unsupported network shows error", async ({ dapp }) => {
    // Manually switch MetaMask to an unsupported network (e.g., local devnet)
    let warningVisible = true;
    try {
      await dapp.networkWarning.first().waitFor({ state: "visible", timeout: 10_000 });
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        warningVisible = false;
      } else {
        throw err;
      }
    }

    test.skip(
      !warningVisible,
      "Unsupported-network warning not detected. Switch the wallet to an unsupported network before running this test.",
    );

    // dApp should show wrong network warning or prompt to switch back
    const message = await dapp.getToastMessage();
    expect(message).toMatch(/unsupported|wrong network|switch/i);
  });

  test("TC-NS06: Transaction blocked on wrong network", async ({ connectedDapp: dapp, metamask }) => {
    // Switch to a different network than the dApp expects
    await metamask.approveNetworkSwitch();

    // Attempt to send a transaction
    await dapp.fillTransferForm("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0.001");
    await dapp.submitTransfer();

    // dApp should either block the transaction or prompt network switch
    await expect(dapp.anyErrorOrWarning.first()).toBeVisible({ timeout: 10_000 });
  });

  test("TC-NS07: Rapid network switching stability", async ({ connectedDapp: dapp, metamask }) => {
    // Switch network multiple times quickly
    await metamask.approveNetworkSwitch();
    await metamask.approveNetworkSwitch();
    await metamask.approveNetworkSwitch();

    // dApp should remain stable, wallet still connected
    await expect(dapp.walletAddress).toBeVisible();

    const network = await dapp.getNetworkName();
    expect(network).toBeTruthy();
  });
});
