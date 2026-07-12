// wallet.js
// Wallet balance lookup and withdrawal processing.

const express = require('express');
const router = express.Router();
const db = require('./db');
const { authenticateToken } = require('./middleware');

function isValidBtcAddress(addr) {
  return /^(bc1[a-z0-9]{25,60}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test((addr || '').trim());
}

function round(n, d = 8) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

// GET /api/wallet - balance, address, stats, recent transactions
router.get('/', authenticateToken, (req, res) => {
  const users = db.getUsers();
  const user = users[req.user.username];
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const transactions = db.getTransactions();
  const txns = (transactions[req.user.username] || []).slice().reverse().slice(0, 20);

  res.json({
    balance: user.balance,
    address: user.address,
    correct: user.correct,
    streak: user.streak,
    answered: user.answered,
    transactions: txns,
  });
});

// POST /api/wallet/withdraw - { amount, address }
router.post('/withdraw', authenticateToken, (req, res) => {
  const { amount, address } = req.body;
  const amt = parseFloat(amount);

  if (!isValidBtcAddress(address)) {
    return res.status(400).json({ error: "That doesn't look like a valid BTC address format." });
  }
  if (!amt || amt <= 0) {
    return res.status(400).json({ error: 'Enter an amount greater than zero.' });
  }

  const users = db.getUsers();
  const user = users[req.user.username];
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (amt > user.balance) {
    return res.status(400).json({
      error: `Insufficient balance. Available: ${user.balance.toFixed(8)} BTC.`,
    });
  }

  user.balance = round(user.balance - amt);
  users[req.user.username] = user;
  db.saveUsers(users);

  const transactions = db.getTransactions();
  if (!transactions[req.user.username]) transactions[req.user.username] = [];
  transactions[req.user.username].push({
    type: `Withdrawal -> ${address.trim().slice(0, 10)}...`,
    amount: -amt,
    ts: new Date().toISOString(),
  });
  db.saveTransactions(transactions);

  res.json({
    message: `Withdrawal of ${amt.toFixed(8)} BTC submitted for processing.`,
    balance: user.balance,
  });
});

module.exports = router;
