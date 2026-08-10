import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, ArrowRight, ExternalLink, PartyPopper } from "lucide-react";
import { sendUSDC } from "../arcConfig";
import { useToast } from "../context/ToastContext.jsx";
import Confetti from "./Confetti.jsx";

const API = "http://localhost:4000/api";
const EXPLORER = "https://testnet.arcscan.app/tx/";

export default function Balances({ group, account, refreshKey }) {
  const [data, setData] = useState(null);
  const [payingIdx, setPayingIdx] = useState(null);
  const [celebrateIdx, setCelebrateIdx] = useState(null);
  const toast = useToast();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, refreshKey]);

  async function load() {
    try {
      const res = await fetch(`${API}/groups/${group.id}/balances`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast("Couldn't reach the backend — is it running on port 4000?", "error");
    }
  }

  async function handlePay(transfer, idx) {
    if (!account) return toast("Connect your wallet first.", "error");
    if (account.toLowerCase() !== transfer.fromWallet.toLowerCase()) {
      toast(`Switch to ${transfer.fromName}'s wallet to send this payment.`, "error");
      return;
    }
    setPayingIdx(idx);
    try {
      const txHash = await sendUSDC(transfer.toWallet, transfer.amount);
      await fetch(`${API}/groups/${group.id}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: transfer.from, to: transfer.to, amount: transfer.amount, txHash }),
      });
      toast(`Paid $${transfer.amount} USDC to ${transfer.toName}.`, "success");
      setCelebrateIdx(idx);
      setTimeout(() => setCelebrateIdx(null), 1000);
      load();
    } catch (err) {
      toast(err.message || "Transaction failed", "error");
    } finally {
      setPayingIdx(null);
    }
  }

  if (!data) {
    return (
      <div className="card">
        <p className="card-subtitle">Loading balances…</p>
      </div>
    );
  }

  const allSettled = data.settlementPlan.length === 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="card">
        <p className="card-title">
          <Scale size={17} style={{ verticalAlign: -3, marginRight: 6 }} />
          Balances
        </p>
        <p className="card-subtitle">Net position after every expense logged so far.</p>

        {data.netBalances.map((b) => {
          const cls = b.netBalance > 0.01 ? "positive" : b.netBalance < -0.01 ? "negative" : "neutral";
          const text =
            cls === "positive"
              ? `+$${b.netBalance.toFixed(2)}`
              : cls === "negative"
              ? `−$${Math.abs(b.netBalance).toFixed(2)}`
              : "settled";
          return (
            <div className="balance-row" key={b.memberId}>
              <span>{b.name}</span>
              <span className={`balance-amount mono ${cls}`}>{text}</span>
            </div>
          );
        })}
      </div>

      <div className="card">
        <p className="card-title">Settlement plan</p>
        <p className="card-subtitle">
          The fewest possible payments to bring everyone to zero — {data.settlementPlan.length} transaction
          {data.settlementPlan.length === 1 ? "" : "s"} needed.
        </p>

        {allSettled ? (
          <div className="empty-state">
            <PartyPopper size={22} color="var(--positive)" style={{ marginBottom: 8 }} />
            <div>Everyone's settled up.</div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {data.settlementPlan.map((t, idx) => (
              <motion.div
                className="settlement-row"
                key={`${t.from}-${t.to}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                style={{ position: "relative" }}
              >
                <div className="settlement-names">
                  {t.fromName} <ArrowRight size={13} color="var(--text-faint)" /> {t.toName}
                  <span className="settlement-amount mono">${t.amount}</span>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={payingIdx === idx}
                  onClick={() => handlePay(t, idx)}
                >
                  {payingIdx === idx ? "Paying…" : "Pay on Arc"}
                </button>
                {celebrateIdx === idx && <Confetti />}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {group.settlements?.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <label>Past settlements</label>
            {group.settlements
              .slice()
              .reverse()
              .map((s) => (
                <a
                  key={s.id}
                  href={`${EXPLORER}${s.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="pill"
                  style={{ marginRight: 8, marginBottom: 8, textDecoration: "none" }}
                >
                  ${s.amount} <ExternalLink size={12} />
                </a>
              ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
