import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Check, ArrowLeftRight } from "lucide-react";
import Hero from "./components/Hero.jsx";
import ConnectWallet from "./components/ConnectWallet.jsx";
import GroupSetup from "./components/GroupSetup.jsx";
import AddExpense from "./components/AddExpense.jsx";
import Balances from "./components/Balances.jsx";
import StepIndicator from "./components/StepIndicator.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

const API = "http://localhost:4000/api";

function GroupHeader({ group, onSwitch }) {
  const [copied, setCopied] = useState(false);

  function copyId() {
    navigator.clipboard.writeText(group.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <p className="card-title" style={{ marginBottom: 6 }}>{group.name}</p>
          <button className="pill copy-btn" onClick={copyId} style={{ border: "1px solid var(--border)" }}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : `Share: ${group.id.slice(0, 8)}…`}
          </button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onSwitch}>
          <ArrowLeftRight size={14} /> Switch group
        </button>
      </div>
    </motion.div>
  );
}

function AppContent() {
  const [account, setAccount] = useState(null);
  const [group, setGroup] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Keep the group object (including settlement history) in sync
  useEffect(() => {
    if (!group) return;
    fetch(`${API}/groups/${group.id}`)
      .then((r) => r.json())
      .then((fresh) => setGroup(fresh))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const step = !account ? 1 : !group ? 2 : 3; // 3 covers both "add expenses" and "settle"

  return (
    <div className="page">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          SplitStable
        </div>
        {account && (
          <div className="wallet-chip">
            <span className="dot" />
            {account.slice(0, 6)}…{account.slice(-4)}
          </div>
        )}
      </div>

      <div className="container">
        {!group && <Hero />}

        <StepIndicator current={step} />

        <ConnectWallet account={account} setAccount={setAccount} />

        <AnimatePresence mode="wait">
          {!group ? (
            <motion.div key="setup" exit={{ opacity: 0 }}>
              <GroupSetup onGroupLoaded={setGroup} />
            </motion.div>
          ) : (
            <motion.div key="group" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GroupHeader group={group} onSwitch={() => setGroup(null)} />
              <AddExpense group={group} onExpenseAdded={() => setRefreshKey((k) => k + 1)} />
              <Balances group={group} account={account} refreshKey={refreshKey} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
