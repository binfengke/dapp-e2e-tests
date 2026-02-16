import { ethers } from "ethers";

/**
 * Blockchain utility helpers for test assertions.
 */

/** Shorten address to 0x1234...abcd format */
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Validate Ethereum address format */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/** Validate transaction hash format */
export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/** Convert wei string to ETH number */
export function weiToEth(wei: string): number {
  return parseFloat(ethers.formatEther(wei));
}

/** Parse token amount with decimals */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return ethers.parseUnits(amount, decimals);
}

/** Get on-chain ETH balance for an address */
export async function getOnChainBalance(
  rpcUrl: string,
  address: string
): Promise<bigint> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return provider.getBalance(address);
}

/** Get on-chain transaction receipt */
export async function getTxReceipt(
  rpcUrl: string,
  txHash: string
): Promise<ethers.TransactionReceipt | null> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return provider.getTransactionReceipt(txHash);
}

/** Wait for transaction to be mined */
export async function waitForTx(
  rpcUrl: string,
  txHash: string,
  confirmations: number = 1
): Promise<ethers.TransactionReceipt | null> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return provider.waitForTransaction(txHash, confirmations, 60_000);
}

/** Get ERC-20 token balance */
export async function getTokenBalance(
  rpcUrl: string,
  tokenAddress: string,
  walletAddress: string
): Promise<bigint> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const abi = ["function balanceOf(address) view returns (uint256)"];
  const contract = new ethers.Contract(tokenAddress, abi, provider);
  return contract.balanceOf(walletAddress);
}

/** Get ERC-721 NFT owner */
export async function getNftOwner(
  rpcUrl: string,
  nftAddress: string,
  tokenId: number
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const abi = ["function ownerOf(uint256) view returns (address)"];
  const contract = new ethers.Contract(nftAddress, abi, provider);
  return contract.ownerOf(tokenId);
}
