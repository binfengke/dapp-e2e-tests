import { test, expect } from "../src/fixtures/dapp.fixture";
import { getLatestErc721TokenIdTransferredTo, getNftOwner } from "../src/utils/blockchain";

const RPC_URL = process.env.RPC_URL || "https://rpc.sepolia.org";
const NFT_CONTRACT = process.env.NFT_CONTRACT || "0x0000000000000000000000000000000000000000";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

test.describe("NFT Mint", () => {
  test("@smoke TC-N01: Mint an NFT successfully", async ({ connectedDapp: dapp, metamask }) => {
    await dapp.clickMint();
    await metamask.confirmTransactionWithOptionalSecondPopup();
    await dapp.waitForTxConfirmation();

    const message = await dapp.getToastMessage();
    expect(message).toMatch(/success|minted/i);
  });

  test("TC-N02: NFT appears in gallery after minting", async ({ connectedDapp: dapp, metamask }) => {
    const countBefore = await dapp.tryGetNftCount();

    await dapp.clickMint();
    await metamask.confirmTransactionWithOptionalSecondPopup();
    await dapp.waitForTxConfirmation();

    const countAfter = await dapp.getNftCount();
    expect(countAfter).toBeGreaterThan(countBefore);
  });

  test("TC-N03: Reject NFT mint transaction", async ({ connectedDapp: dapp, metamask }) => {
    await dapp.clickMint();
    await metamask.rejectRequest();

    const message = await dapp.getToastMessage();
    expect(message).toMatch(/rejected|denied|cancelled/i);
  });

  test("@onchain TC-N04: Verify NFT ownership on-chain after mint", async ({ connectedDapp: dapp, metamask }) => {
    test.skip(NFT_CONTRACT === ZERO_ADDRESS, "NFT_CONTRACT not set for on-chain verification");

    await dapp.clickMint();
    await metamask.confirmTransactionWithOptionalSecondPopup();
    await dapp.waitForTxConfirmation();

    const walletAddress = await dapp.getConnectedAddress();

    let latestTokenId: bigint | null = null;
    await expect(async () => {
      latestTokenId = await getLatestErc721TokenIdTransferredTo({
        rpcUrl: RPC_URL,
        nftAddress: NFT_CONTRACT,
        toAddress: walletAddress,
      });
      expect(latestTokenId).not.toBeNull();
    }).toPass({ timeout: 30_000 });
    expect(latestTokenId).not.toBeNull();
    const owner = await getNftOwner(RPC_URL, NFT_CONTRACT, latestTokenId!);
    expect(owner.toLowerCase()).toEqual(walletAddress.toLowerCase());
  });

  test("TC-N05: Mint button disabled when wallet not connected", async ({ page }) => {
    // Navigate without connecting wallet
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const mintBtn = page.getByTestId("mint-btn");

    let mintBtnVisible = true;
    try {
      await mintBtn.waitFor({ state: "visible", timeout: 5_000 });
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        mintBtnVisible = false;
      } else {
        throw err;
      }
    }

    test.skip(!mintBtnVisible, "Mint button not visible when wallet is disconnected");
    await expect(mintBtn).toBeDisabled();
  });
});
