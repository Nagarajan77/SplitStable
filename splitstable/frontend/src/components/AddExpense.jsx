import React, { useState } from "react";
import { motion } from "framer-motion";
import { Receipt } from "lucide-react";
import { useToast } from "../context/ToastContext.jsx";
import { API } from "../config.js";

export default function AddExpense({ group, onExpenseAdded }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(group.members[0]?.id || "");
  const [splitBetween, setSplitBetween] = useState(group.members.map((m) => m.id));
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  function toggleSplit(id) {
    setSplitBetween((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit() {
    if (!description || !amount || !paidBy || splitBetween.length === 0) {
      toast("Fill in description, amount, who paid, and who's splitting it.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/groups/${group.id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount: Number(amount), paidBy, splitBetween }),
      });
      const expense = await res.json();
      if (!res.ok) return toast(expense.error, "error");
      setDescription("");
      setAmount("");
      toast(`Added "${expense.description}" — $${expense.amount}`, "success");
      onExpenseAdded();
    } catch (err) {
      toast("Couldn't reach the backend — is it running on port 4000?", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <p className="card-title">
        <Receipt size={17} style={{ verticalAlign: -3, marginRight: 6 }} />
        Log an expense
      </p>
      <p className="card-subtitle">This stays off-chain until someone actually settles it — free to add as many as you like.</p>

      <label>What was it for?</label>
      <input placeholder="Dinner, cab, groceries…" value={description} onChange={(e) => setDescription(e.target.value)} />

      <label>Amount (USDC)</label>
      <input placeholder="0.00" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />

      <label>Paid by</label>
      <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
        {group.members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <label>Split between</label>
      {group.members.map((m) => (
        <label key={m.id} className="checkbox-row">
          <input type="checkbox" checked={splitBetween.includes(m.id)} onChange={() => toggleSplit(m.id)} />
          {m.name}
        </label>
      ))}

      <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={submit} disabled={submitting}>
        {submitting ? "Adding…" : "Add expense"}
      </button>
    </motion.div>
  );
}
