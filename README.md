# SplitStable

A group expense splitter that settles debts in USDC on **Arc testnet** — with a real
onboarding page, an animated diagram of what the app actually does, and instant
on-chain settlement.

- Track shared expenses in a group (rent, trip, dinner, whatever).
- The app computes the minimum number of payments needed to settle everyone up.
- Each payment is a real on-chain USDC transfer, sent from the payer's own wallet (MetaMask).
- The landing hero animates the core idea: a tangle of IOUs collapsing into the fewest
  possible payments — because that's the actual value the app provides.

Because Arc uses USDC as its native gas token, a "send USDC" transaction is just a normal
native-token transfer — no ERC-20 contract or special SDK required, just standard
Ethereum tooling (`ethers.js` + MetaMask).

## Design system

- **Theme:** a "financial ledger" look — deep forest-ink surfaces, muted gold for actions,
  soft mint/coral (not harsh red/green) for owed/owe states, faint horizontal rule-lines
  across the page like paper.
- **Type:** Fraunces (serif, headlines) + Inter (body) + IBM Plex Mono (every dollar amount,
  wallet address, and group ID — so money always reads like a ledger entry).
- **Motion:** [Framer Motion](https://www.npmjs.com/package/framer-motion) (the library
  behind the newer "Motion" brand — `framer-motion` is still the npm package name and what
  this project uses) drives page-load reveals, list animations when expenses/members are
  added or removed, a step indicator, toast notifications, and a small confetti burst when
  a payment confirms on-chain.
- All tokens (colors, fonts, radii) live at the top of `src/styles.css` — change them there
  and the whole app updates.

---

## 1. Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- [VS Code](https://code.visualstudio.com/)
- [MetaMask](https://metamask.io/) browser extension
- Some Arc testnet USDC in your wallet (see step 4 — you'll need a faucet)

---

## 2. Open the project in VS Code

1. Unzip the project folder.
2. In VS Code: `File → Open Folder…` → select the `splitstable` folder.
3. Open a terminal in VS Code: `` Ctrl+` `` (or `View → Terminal`).

You should see two folders: `backend/` and `frontend/`.

---

## 3. Run the backend

In the VS Code terminal:

```bash
cd backend
npm install
npm start
```

You should see:

```
SplitStable backend running on http://localhost:4000
```

Leave this terminal running. This server just stores your groups/expenses in a local
`db.json` file and calculates balances — it never touches your wallet or funds.

---

## 4. Run the frontend

Open a **second terminal** in VS Code (click the `+` icon in the terminal panel):

```bash
cd frontend
npm install
npm run dev
```

You should see something like:

```
VITE ready
Local: http://localhost:5173
```

Open that URL in your browser.

---

## 5. Set up your wallet for Arc testnet

1. Click **"Connect Wallet (Arc Testnet)"** in the app. MetaMask will pop up asking to
   add a new network — approve it. This adds:
   - Network name: Arc Testnet
   - Chain ID: 5042002
   - RPC URL: https://rpc.testnet.arc.io
   - Currency: USDC (18 decimals)
   - Explorer: https://testnet.arcscan.app
2. Approve the connection request.
3. You'll need testnet USDC to actually send a settlement transaction. Search for an
   "Arc testnet faucet" (Circle and several RPC providers run one) and request funds
   for your wallet address. Do this for at least two of your test wallets so you can
   try both sides of a payment.

> Tip: for testing, create 2–3 separate accounts in MetaMask (Account 2, Account 3, etc.)
> so you can act as different group members and actually trigger a real payment between them.

---

## 6. Try it end-to-end

1. **Create a group** — give it a name and add 2+ members, each with a real wallet
   address (use your test MetaMask accounts here so you can actually settle later).
2. **Add an expense** — e.g. "Dinner", $40, paid by Member A, split between everyone.
3. Add a couple more expenses with different payers, so balances get interesting.
4. Check the **Balances** section — you'll see each member's net position and a
   simplified settlement plan (minimum number of payments needed).
5. Switch your MetaMask account to whichever member owes money, then click
   **"Pay on Arc"** next to their row. Confirm the transaction in MetaMask.
6. Once confirmed, the balance updates and you can view the transaction on
   `https://testnet.arcscan.app`.

---

## 7. Project structure

```
splitstable/
  backend/
    server.js       # Express API: groups, expenses, balance/settlement calculation
    db.json          # local JSON "database" (auto-created)
    package.json
  frontend/
    src/
      arcConfig.js               # Arc network config + wallet connect/send helpers
      App.jsx                    # top-level app state + step flow
      context/
        ToastContext.jsx         # toast notification system (replaces alert())
      components/
        Hero.jsx                 # landing explanation + animated debt-untangling diagram
        StepIndicator.jsx        # Connect → Group → Expenses → Settle progress bar
        ConnectWallet.jsx
        GroupSetup.jsx
        AddExpense.jsx
        Balances.jsx
        Confetti.jsx             # small burst shown when a payment confirms
      styles.css                 # design tokens + all component styles
    index.html
    vite.config.js
    package.json
  README.md
```

---

## 8. How the settlement math works

Instead of everyone paying everyone else back individually, the backend nets
everything out per person, then greedily matches the biggest debtor with the
biggest creditor until everyone is at zero. This minimizes the number of actual
on-chain transactions your group needs to make. The logic lives in
`backend/server.js` under `computeNetBalances()` and `simplifyDebts()`.

---

## 9. Where to go next

- **Persistence:** swap the JSON file for a real database (SQLite/Postgres) once
  you have more than a handful of groups.
- **Auth:** right now anyone with the group ID can add expenses — fine for a demo,
  but you'll want to gate this (e.g. sign-in with wallet signature) for real use.
- **Multiple currencies:** Arc's App Kits support swaps if you want to let people
  pay in a different token and have it convert automatically.
- **Notifications:** ping members when a new expense is added or a settlement is due.
