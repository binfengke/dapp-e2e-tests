import { test, expect } from "@playwright/test";
import { MetaMaskHelper } from "../src/pages/MetaMaskHelper";

class MockLocator {
  constructor(private value?: string) {}

  first() {
    return this;
  }

  async isVisible() {
    return typeof this.value === "string" && this.value.trim().length > 0;
  }

  async textContent() {
    return this.value ?? null;
  }

  async innerText() {
    return this.value ?? "";
  }

  async waitFor() {
    return;
  }
}

class MockPage {
  constructor(
    private values: Record<string, string | undefined>,
    private bodyText = ""
  ) {}

  locator(selector: string) {
    if (selector === "body") {
      return new MockLocator(this.bodyText);
    }
    return new MockLocator(this.values[selector]);
  }

  async waitForLoadState() {
    return;
  }
}

class TestableMetaMaskHelper extends MetaMaskHelper {
  constructor(private popupPage: MockPage) {
    super({} as any, {} as any);
  }

  async getPopup() {
    return this.popupPage as any;
  }
}

test("extracts transaction details from MetaMask selectors", async () => {
  const popup = new MockPage({
    '[data-testid="confirm-page-container-content"] [data-testid="confirm-detail-row-value"]':
      "0.25 ETH",
    '[data-testid="confirm-page-container-content"] [data-testid="transaction-from-value"]':
      "0x1111111111111111111111111111111111111111",
    '[data-testid="confirm-page-container-content"] [data-testid="transaction-to-value"]':
      "0x2222222222222222222222222222222222222222",
    '[data-testid="confirm-page-container-content"] [data-testid="network-display"]':
      "Sepolia",
    '[data-testid="confirm-page-container-content"] [data-testid="transaction-gas-fee"]':
      "0.00042 ETH",
  });

  const helper = new TestableMetaMaskHelper(popup);
  const details = await (helper as any).getTransactionDetails();

  expect(details).toMatchObject({
    amount: "0.25 ETH",
    from: "0x1111111111111111111111111111111111111111",
    to: "0x2222222222222222222222222222222222222222",
    network: "Sepolia",
    gasFee: "0.00042 ETH",
  });
});

test("falls back to parsing body text when selectors are unavailable", async () => {
  const popup = new MockPage(
    {},
    [
      "From 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "To 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "Amount 1.00 USDC",
      "Network Base Sepolia",
      "Gas fee 0.0001 ETH",
      "Nonce 24",
    ].join("\n")
  );

  const helper = new TestableMetaMaskHelper(popup);
  const details = await (helper as any).getTransactionDetails();

  expect(details).toMatchObject({
    from: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    to: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    amount: "1.00 USDC",
    network: "Base Sepolia",
    gasFee: "0.0001 ETH",
    nonce: "24",
  });
});
