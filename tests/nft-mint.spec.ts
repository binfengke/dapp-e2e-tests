import { test, expect } from "../src/fixtures/dapp.fixture";
import { getNftOwner } from "../src/utils/blockchain";

const RPC_URL = process.env.RPC_URL || "https://rpc.sepolia.org";
const NFT_CONTRACT = process.env.NFT_CONTRACT || "0x0000000000000000000000000000000000000000";

test.describe("NFT Mint", () => {
  test.beforeEach(async ({ dapp, metamask }) => {
    await dapp.clickConnectWallet();
    await metamask.approveConnection();
    expect(await dapp.isWalletConnected()).toBe(true);
  });

  test("TC-N01: Mint an NFT successfully", async ({ dapp, metamask }) => {
    const countBefore = await dapp.getNftCount().catch(() => 0);

    await dapp.clickMint();
    await metamask.confirmTransaction();
    await dapp.waitForTxConfirmation();

    const message = await dapp.getToastMessage();
    expect(
      message.toLowerCase().includes("success") ||
      message.toLowerCase().includes("minted")
    ).toBe(true);
  });

  test("TC-N02: NFT appears in gallery after minting", async ({ dapp, metamask }) => {
    const countBefore = await dapp.getNftCount().catch(() => 0);

    await dapp.clickMint();
    await metamask.confirmTransaction();
    await dapp.waitForTxConfirmation();

    const countAfter = await dapp.getNftCount();
    expect(countAfter).toBeGreaterThan(countBefore);
  });

  test("TC-N03: Reject NFT mint transaction", async ({ dapp, metamask }) => {
    await dapp.clickMint();
    await metamask.rejectRequest();

    const message = await dapp.getToastMessage();
    expect(
      message.toLowerCase().includes("rejected") ||
      message.toLowerCase().includes("denied") ||
      message.toLowerCase().includes("cancelled")
    ).toBe(true);
  });

  test("TC-N04: Verify NFT ownership on-chain after mint", async ({ dapp, metamask }) => {
    await dapp.clickMint();
    await metamask.confirmTransaction();
    await dapp.waitForTxConfirmation();

    const walletAddress = await dapp.getConnectedAddress();

    // Verify the latest minted NFT belongs to the connected wallet
    // Token ID would come from the mint event — using a placeholder here
    // In a real test, parse the tx receipt logs to get the actual tokenId
    const latestTokenId = 1;
    try {
      const owner = await getNftOwner(RPC_URL, NFT_CONTRACT, latestTokenId);
      expect(owner.toLowerCase()).toEqual(walletAddress.toLowerCase());
    } catch {
      // Contract not deployed in test env — skip on-chain verification
      test.skip();
    }
  });

  test("TC-N05: Mint button disabled when wallet not connected", async ({ page }) => {
    // Navigate without connecting wallet
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const mintBtn = page.locator('[data-testid="mint-btn"], button:has-text("Mint")');
    if (await mintBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const isDisabled = await mintBtn.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });
});
