import { test as base, BrowserContext, Page } from "@playwright/test";
import { DAppPage } from "../pages/DAppPage";
import { MetaMaskHelper } from "../pages/MetaMaskHelper";

/**
 * Custom test fixtures providing DAppPage and MetaMaskHelper instances.
 */
type DAppFixtures = {
  dapp: DAppPage;
  metamask: MetaMaskHelper;
};

export const test = base.extend<DAppFixtures>({
  dapp: async ({ page }, use) => {
    const dapp = new DAppPage(page);
    await dapp.navigate("/");
    await use(dapp);
  },
  metamask: async ({ context, page }, use) => {
    const metamask = new MetaMaskHelper(context, page);
    await use(metamask);
  },
});

export { expect } from "@playwright/test";
