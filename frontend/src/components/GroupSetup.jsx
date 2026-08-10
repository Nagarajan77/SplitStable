import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, LogIn } from "lucide-react";
import { useToast } from "../context/ToastContext.jsx";

const API = "http://localhost:4000/api";

export default function GroupSetup({ onGroupLoaded }) {
  const [name, setName] = useState("");
  const [members, setMembers] = useState([
    { name: "", wallet: "" },
    { name: "", wallet: "" },
  ]);
  const [loadId, setLoadId] = useState("");
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  function updateMember(i, field, value) {
    const copy = [...members];
    copy[i][field] = value;
    setMembers(copy);
  }

  function addMemberRow() {
    setMembers([...members, { name: "", wallet: "" }]);
  }

  async function createGroup() {
    if (!name || members.some((m) => !m.name || !m.wallet)) {
      toast("Fill in a group name and every member's name + wallet address.", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, members }),
      });
      const group = await res.json();
      if (!res.ok) return toast(group.error, "error");
      toast(`"${group.name}" created.`, "success");
      onGroupLoaded(group);
    } catch (err) {
      toast("Couldn't reach the backend — is it running on port 4000?", "error");
    } finally {
      setCreating(false);
    }
  }

  async function loadGroup() {
    if (!loadId) return;
    try {
      const res = await fetch(`${API}/groups/${loadId}`);
      const group = await res.json();
      if (!res.ok) return toast(group.error, "error");
      onGroupLoaded(group);
    } catch (err) {
      toast("Couldn't reach the backend — is it running on port 4000?", "error");
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="card">
        <p className="card-title">
          <Users size={17} style={{ verticalAlign: -3, marginRight: 6 }} />
          Start a group
        </p>
        <p className="card-subtitle">Add everyone splitting this expense, with the wallet each person will pay from.</p>

        <label>Group name</label>
        <input placeholder="e.g. Goa Trip, Flat 4B Rent" value={name} onChange={(e) => setName(e.target.value)} />

        <label>Members</label>
        <AnimatePresence initial={false}>
          {members.map((m, i) => (
            <motion.div
              className="row"
              key={i}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{ marginBottom: 4 }}
            >
              <input placeholder="Name" value={m.name} onChange={(e) => updateMember(i, "name", e.target.value)} />
              <input
                placeholder="Wallet address (0x…)"
                value={m.wallet}
                onChange={(e) => updateMember(i, "wallet", e.target.value)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button className="btn btn-ghost btn-sm" onClick={addMemberRow}>
            <Plus size={14} /> Add member
          </button>
        </div>

        <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={createGroup} disabled={creating}>
          {creating ? "Creating…" : "Create group"}
        </button>
      </div>

      <div className="card">
        <p className="card-title">
          <LogIn size={17} style={{ verticalAlign: -3, marginRight: 6 }} />
          Already have a group?
        </p>
        <p className="card-subtitle">Paste the group ID a friend shared with you.</p>
        <div className="row">
          <input placeholder="Group ID" value={loadId} onChange={(e) => setLoadId(e.target.value)} />
          <button className="btn btn-ghost" onClick={loadGroup} style={{ flex: "0 0 auto" }}>
            Load
          </button>
        </div>
      </div>
    </motion.div>
  );
}
