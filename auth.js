// auth.js
// Handles account registration and login.

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('./db');
const { JWT_SECRET } = require('./middleware');

function generateWalletAddress() {
  const chars = '023456789abcdefghjkmnpqrstuvwxyz';
  let addr = 'bc1q';
  for (let i = 0; i < 38; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  return addr;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  if (username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const users = db.getUsers();
  if (users[username]) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  users[username] = {
    passwordHash,
    address: generateWalletAddress(),
    balance: 0.001, // starter balance
    correct: 0,
    streak: 0,
    answered: 0,
    createdAt: new Date().toISOString(),
  };
  db.saveUsers(users);

  const transactions = db.getTransactions();
  transactions[username] = [
    { type: 'Signup Bonus', amount: 0.001, ts: new Date().toISOString() },
  ];
  db.saveTransactions(transactions);

  res.status(201).json({ message: 'Account created. You can log in now.' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const users = db.getUsers();
  const user = users[username];
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, username });
});

module.exports = router;
