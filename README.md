# dApp E2E Tests

End-to-end test framework for decentralized application (dApp) interactions using **Playwright** and **Synpress** (MetaMask automation).

[![dApp E2E Tests](https://github.com/binfengke/dapp-e2e-tests/actions/workflows/e2e.yml/badge.svg)](https://github.com/binfengke/dapp-e2e-tests/actions/workflows/e2e.yml)

## Test Coverage

| Suite | Tests | What It Covers |
|-------|-------|---------------|
| Wallet Connection | 8 | Connect, disconnect, reject, network switch, page refresh persistence |
| Network Switching | 7 | Switch networks, reject switch, balance update, wrong network, rapid switching |
| Token Transfer | 6 | Send ETH, reject tx, invalid address, zero amount, insufficient balance, on-chain verification |
| NFT Mint | 5 | Mint, gallery update, reject, on-chain ownership, disabled state |
| Token Swap | 6 | Swap execution, reject, price impact, zero amount, insufficient balance, ERC-20 approval flow |

**E2E: 32 test cases** (+ **2 unit tests** for `MetaMaskHelper` parsing) — **34 total**

## Architecture

```
dapp-e2e-tests/
├── src/
│   ├── pages/
│   │   ├── BasePage.ts           # Base page object with shared methods
│   │   ├── DAppPage.ts           # dApp UI interactions (POM pattern)
│   │   └── MetaMaskHelper.ts     # MetaMask popup automation + transaction detail extraction
│   ├── fixtures/
│   │   └── dapp.fixture.ts       # Custom Playwright fixtures
│   └── utils/
│       └── blockchain.ts         # On-chain verification helpers (ethers.js)
├── tests/
│   ├── metamask-helper.spec.ts   # MetaMask helper unit tests (transaction detail parsing)
│   ├── wallet-connect.spec.ts    # Wallet connection tests
│   ├── network-switch.spec.ts    # Network switching tests
│   ├── token-transfer.spec.ts    # ETH transfer tests
│   ├── nft-mint.spec.ts          # NFT minting tests
│   └── swap.spec.ts              # Token swap tests
├── playwright.config.ts          # Playwright configuration
└── .github/workflows/e2e.yml    # CI pipeline
```

## Design Patterns

- **Page Object Model (POM)** — UI interactions encapsulated in reusable page classes
- **Custom Fixtures** — Playwright fixtures for DAppPage and MetaMaskHelper injection
- **On-Chain Verification** — Tests verify blockchain state using ethers.js, not just UI assertions
- **Separation of Concerns** — UI testing, wallet automation, and chain queries are isolated

## Tech Stack

| Tool | Purpose |
|------|---------|
| Playwright | Browser automation and test runner |
| Synpress | MetaMask wallet automation |
| ethers.js | On-chain state verification |
| TypeScript | Type-safe test code |
| GitHub Actions | CI/CD pipeline |

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps chromium

# Copy environment config
cp .env.example .env
# Edit .env with your test wallet and contract addresses
```

## Run Tests

```bash
# Run all tests
npm test

# Run with browser visible
npm run test:headed

# Run specific suite
npm run test:wallet
npm run test:transfer
npm run test:nft
npm run test:swap

# View HTML report
npm run report
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DAPP_URL` | dApp frontend URL |
| `RPC_URL` | Ethereum RPC endpoint (Sepolia) |
| `SEED_PHRASE` | Test wallet seed phrase (never use real funds) |
| `WALLET_PASSWORD` | MetaMask password for test wallet |
| `CHAIN_ID` | Target chain ID (11155111 = Sepolia) |
| `TOKEN_CONTRACT` | ERC-20 token contract address |
| `NFT_CONTRACT` | ERC-721 NFT contract address |

## CI/CD

On every push / PR to `main`, GitHub Actions runs lightweight checks that are safe for public CI:

1. **Type Check & Unit Tests** — `tsc --noEmit` + MetaMask helper unit tests (no secrets required)
2. **Structure Check** — Ensures critical framework files exist

The workflow badge reflects these push/PR checks. The **full Playwright E2E** suite (wallet + on-chain flows) is available via **workflow_dispatch** once you configure repository secrets `SEED_PHRASE` and `WALLET_PASSWORD`, and provide a reachable `DAPP_URL`.

## License

MIT
