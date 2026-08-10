import React, { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Loader2 } from "lucide-react";
import { connectWallet } from "../arcConfig";
import { useToast } from "../context/ToastContext.jsx";

export default function ConnectWallet({ account, setAccount }) {
  const [connecting, setConnecting] = useState(false);
  const toast = useToast();

  async function handleConnect() {
    setConnecting(true);
    try {
      const addr = await connectWallet();
      setAccount(addr);
      toast("Wallet connected — Arc testnet is ready.", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {account ? (
        <div className="wallet-chip">
          <span className="dot" />
          Connected as <code>{account.slice(0, 6)}…{account.slice(-4)}</code>
        </div>
      ) : (
        <>
          <p className="card-title">Connect your wallet</p>
          <p className="card-subtitle">
            We'll add Arc Testnet to your wallet automatically — one popup, no manual network config.
          </p>
          <button className="btn btn-primary" onClick={handleConnect} disabled={connecting}>
            {connecting ? <Loader2 size={16} className="spin" /> : <Wallet size={16} />}
            {connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        </>
      )}
    </motion.div>
  );
}
