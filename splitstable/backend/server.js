// SplitStable backend
// A tiny Express API that stores groups/expenses in a local JSON file
// and computes a simplified settlement plan (who should pay whom, and how much).
// Actual USDC transfers happen on the frontend (user's own wallet signs them) —
// this server never touches private keys or funds.

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, "db.json");

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ groups: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ---------- Groups ----------

// Create a group
// body: { name, members: [{ name, wallet }] }
app.post("/api/groups", (req, res) => {
  const { name, members } = req.body;
  if (!name || !Array.isArray(members) || members.length < 2) {
    return res.status(400).json({ error: "name and at least 2 members are required" });
  }

  const db = loadDB();
  const id = randomUUID();
  const groupMembers = members.map((m) => ({
    id: randomUUID(),
    name: m.name,
    wallet: m.wallet.toLowerCase(),
  }));

  db.groups[id] = {
    id,
    name,
    members: groupMembers,
    expenses: [],
    settlements: [],
    createdAt: new Date().toISOString(),
  };

  saveDB(db);
  res.json(db.groups[id]);
});

// Get a group
app.get("/api/groups/:id", (req, res) => {
  const db = loadDB();
  const group = db.groups[req.params.id];
  if (!group) return res.status(404).json({ error: "group not found" });
  res.json(group);
});

// List all groups (id + name only, for a simple picker)
app.get("/api/groups", (req, res) => {
  const db = loadDB();
  const list = Object.values(db.groups).map((g) => ({ id: g.id, name: g.name }));
  res.json(list);
});

// ---------- Expenses ----------

// Add an expense
// body: { description, amount, paidBy (memberId), splitBetween: [memberId, ...] }
app.post("/api/groups/:id/expenses", (req, res) => {
  const db = loadDB();
  const group = db.groups[req.params.id];
  if (!group) return res.status(404).json({ error: "group not found" });

  const { description, amount, paidBy, splitBetween } = req.body;
  if (!description || !amount || !paidBy || !Array.isArray(splitBetween) || splitBetween.length === 0) {
    return res.status(400).json({ error: "description, amount, paidBy, splitBetween are required" });
  }

  const memberIds = group.members.map((m) => m.id);
  if (!memberIds.includes(paidBy) || !splitBetween.every((id) => memberIds.includes(id))) {
    return res.status(400).json({ error: "paidBy/splitBetween must reference valid member ids" });
  }

  const expense = {
    id: randomUUID(),
    description,
    amount: Number(amount),
    paidBy,
    splitBetween,
    createdAt: new Date().toISOString(),
  };

  group.expenses.push(expense);
  saveDB(db);
  res.json(expense);
});

// ---------- Balances & settlement plan ----------

// Compute each member's net balance (positive = is owed money, negative = owes money)
function computeNetBalances(group) {
  const net = {};
  group.members.forEach((m) => (net[m.id] = 0));

  for (const exp of group.expenses) {
    const share = exp.amount / exp.splitBetween.length;
    net[exp.paidBy] += exp.amount; // payer fronted the full amount
    for (const memberId of exp.splitBetween) {
      net[memberId] -= share; // each participant owes their share
    }
  }

  // Subtract settlements that have already been paid on-chain
  for (const s of group.settlements) {
    net[s.from] += s.amount; // debtor's debt reduced
    net[s.to] -= s.amount; // creditor already received it
  }

  return net; // { memberId: amount }
}

// Greedy debt simplification: match biggest creditor with biggest debtor
// repeatedly, so the number of actual transfers is minimized.
function simplifyDebts(net) {
  const creditors = [];
  const debtors = [];

  for (const [id, amount] of Object.entries(net)) {
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0.01) creditors.push({ id, amount: rounded });
    else if (rounded < -0.01) debtors.push({ id, amount: -rounded });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    transfers.push({
      from: debtor.id,
      to: creditor.id,
      amount: Math.round(amount * 100) / 100,
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transfers;
}

app.get("/api/groups/:id/balances", (req, res) => {
  const db = loadDB();
  const group = db.groups[req.params.id];
  if (!group) return res.status(404).json({ error: "group not found" });

  const net = computeNetBalances(group);
  const transfers = simplifyDebts(net);

  const byId = Object.fromEntries(group.members.map((m) => [m.id, m]));
  const netWithNames = Object.entries(net).map(([id, amount]) => ({
    memberId: id,
    name: byId[id].name,
    netBalance: Math.round(amount * 100) / 100,
  }));

  const transfersWithNames = transfers.map((t) => ({
    ...t,
    fromName: byId[t.from].name,
    fromWallet: byId[t.from].wallet,
    toName: byId[t.to].name,
    toWallet: byId[t.to].wallet,
  }));

  res.json({ netBalances: netWithNames, settlementPlan: transfersWithNames });
});

// ---------- Recording an on-chain settlement ----------

// Call this AFTER the frontend has sent the USDC transfer and it's confirmed.
// body: { from (memberId), to (memberId), amount, txHash }
app.post("/api/groups/:id/settlements", (req, res) => {
  const db = loadDB();
  const group = db.groups[req.params.id];
  if (!group) return res.status(404).json({ error: "group not found" });

  const { from, to, amount, txHash } = req.body;
  if (!from || !to || !amount || !txHash) {
    return res.status(400).json({ error: "from, to, amount, txHash are required" });
  }

  const settlement = {
    id: randomUUID(),
    from,
    to,
    amount: Number(amount),
    txHash,
    createdAt: new Date().toISOString(),
  };

  group.settlements.push(settlement);
  saveDB(db);
  res.json(settlement);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SplitStable backend running on http://localhost:${PORT}`);
});
