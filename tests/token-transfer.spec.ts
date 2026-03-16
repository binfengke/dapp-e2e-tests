import { test, expect } from "../src/fixtures/dapp.fixture";
import { getOnChainBalance } from "../src/utils/blockchain";

const RECIPIENT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Hardhat account #1
const SEND_AMOUNT = "0.001";
const RPC_URL = process.env.RPC_URL || "https://rpc.sepolia.org";

test.describe("Token Transfer", () => {
  test("@smoke TC-T01: Send ETH to a valid address", async ({ connectedDapp: dapp, metamask }) => {
    await dapp.fillTransferForm(RECIPIENT, SEND_AMOUNT);
    await dapp.submitTransfer();
    await metamask.confirmTransaction();
    await dapp.waitForTxConfirmation();

    const message = await dapp.getToastMessage();
    expect(message).toMatch(/success/i);
  });

  test("TC-T02: Reject transaction in MetaMask", async ({ connectedDapp: dapp, metamask }) => {
    await dapp.fillTransferForm(RECIPIENT, SEND_AMOUNT);
    await dapp.submitTransfer();
    await metamask.rejectRequest();

    const message = await dapp.getToastMessage();
    expect(message).toMatch(/rejected|denied|cancelled/i);
  });

  test("TC-T03: Prevent sending to invalid address", async ({ connectedDapp: dapp }) => {
    await dapp.fillTransferForm("0xinvalid", SEND_AMOUNT);
    await dapp.submitTransfer();

    // Should show validation error, not trigger MetaMask popup
    await expect(dapp.validationError.first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("TC-T04: Prevent sending zero amount", async ({ connectedDapp: dapp }) => {
    await dapp.fillTransferForm(RECIPIENT, "0");
    await dapp.submitTransfer();

    await expect(dapp.validationError.first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("TC-T05: Prevent sending more than balance", async ({ connectedDapp: dapp }) => {
    await dapp.fillTransferForm(RECIPIENT, "999999999");
    await dapp.submitTransfer();

    await expect(
      dapp.validationError.first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("@onchain TC-T06: Verify on-chain balance change after transfer", async ({ connectedDapp: dapp, metamask }) => {
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
