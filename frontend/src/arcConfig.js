// Arc testnet network config.
// USDC is the native gas token on Arc (18 decimals), so a plain native-token
// transfer IS a USDC transfer — no ERC-20 contract needed.

export const ARC_TESTNET = {
  chainId: "0x4cef52", // 5042002 in decimal
  chainName: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.testnet.arc.io"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("No wallet found. Please install MetaMask.");
  }

  // Ask the wallet to add/switch to Arc testnet (no-op if already added+selected)
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [ARC_TESTNET],
    });
  } catch (err) {
    console.warn("wallet_addEthereumChain warning:", err);
  }

  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  return accounts[0];
}

// Send a native USDC transfer. `amount` is a human-readable number, e.g. 12.5
export async function sendUSDC(toAddress, amount) {
  if (!window.ethereum) throw new Error("No wallet found.");

  const { ethers } = await import("ethers");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const tx = await signer.sendTransaction({
    to: toAddress,
    value: ethers.parseUnits(amount.toString(), 18),
  });

  const receipt = await tx.wait();
  return receipt.hash;
}
