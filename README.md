# Satoshi Trig — Bitcoin Math Quiz & Wallet

A full-stack app: users register/log in, answer sin/cos/tan/log questions to
earn simulated BTC, and withdraw from their wallet. Balances, accounts, and
transaction history are stored server-side in flat JSON files (no external
database needed).

## Files

| File | Purpose |
|---|---|
| `server.js` | Main entry point — starts Express, serves the frontend, mounts API routes |
| `middleware.js` | JWT auth check + shared error handler |
| `auth.js` | `/api/auth/register` and `/api/auth/login` routes |
| `wallet.js` | `/api/wallet` (balance/history) and `/api/wallet/withdraw` routes |
| `quiz.js` | Generates questions and checks answers server-side (so rewards can't be faked from the browser) |
| `db.js` | Reads/writes `users.json` and `transactions.json` |
| `users.json` | Stores accounts, password hashes, wallet address, balance, stats |
| `transactions.json` | Stores each user's transaction history |
| `index.html` | The frontend — Bootstrap + vanilla JS, calls the API with `fetch` |
| `package.json` | Dependencies and start script |
| `.env.example` | Template for your environment variables |

## Run locally

```bash
npm install
cp .env.example .env
# edit .env and set your own JWT_SECRET
npm start
```

Then open `http://localhost:3000` in your browser.

## Deploy to Render (same flow as your other apps)

1. Push this folder to a GitHub repo (or upload directly if Render supports it for your plan).
2. In Render, create a **New Web Service** from that repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add an environment variable `JWT_SECRET` under the service's **Environment** tab — set it to a long random string (don't reuse the example one).
6. Render sets `PORT` automatically, so you don't need to add it.
7. Deploy. First load may be slow on the free tier (cold start) — same as your other Render apps.

## Notes

- Passwords are hashed with bcrypt before being stored — plain-text passwords are never saved.
- Login sessions use a JWT that expires after 12 hours; users just log in again after that.
- `users.json` and `transactions.json` double as your database. On Render's free tier, the filesystem is **not persistent across deploys** — if you redeploy, these reset. For real production use with permanent data, swap `db.js` for a proper database (e.g. MongoDB Atlas, which you've already used for the Math Game project) and keep the rest of the app unchanged, since every route only talks to `db.js`.
- BTC addresses generated here are randomly formatted strings for demo purposes — they are not real, funded Bitcoin wallets. Withdrawals are simulated (they deduct from the in-app balance and log a transaction, no real blockchain transfer happens).
- Rewards scale slightly with streak: base `0.00015 BTC` per correct answer, plus a small streak bonus capped at a 10-streak.
