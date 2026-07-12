// quiz.js
// Generates sin/cos/tan/log questions and validates answers server-side
// (so the correct answer and reward amount can't be tampered with client-side).

const express = require('express');
const router = express.Router();
const db = require('./db');
const { authenticateToken } = require('./middleware');

// Holds the correct answer for each user's current in-flight question.
// In-memory is fine here since a question is only "live" for a few seconds.
const pendingQuestions = {};

function round(n, d = 4) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

function generateNumericOptions(correctVal, wholeNumberPool) {
  const opts = new Set();
  opts.add(correctVal);

  while (opts.size < 4) {
    let fake;
    if (wholeNumberPool) {
      fake = wholeNumberPool[Math.floor(Math.random() * wholeNumberPool.length)];
    } else if (correctVal === 'undefined') {
      const common = [0, 0.5, 1, -1, 0.87, -0.87, 0.71];
      fake = common[Math.floor(Math.random() * common.length)];
    } else {
      const jitter = Math.random() * 1.4 - 0.7;
      fake = round(correctVal + (jitter === 0 ? 0.3 : jitter), 2);
      if (fake > 1.2) fake = round(fake - 1, 2);
      if (fake < -1.2) fake = round(fake + 1, 2);
    }
    opts.add(fake);
  }

  const arr = Array.from(opts);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateQuestion() {
  const types = ['sin', 'cos', 'tan', 'log'];
  const type = types[Math.floor(Math.random() * types.length)];
  let questionText, correctVal, options;

  if (type === 'log') {
    const bases = [
      { val: 0, arg: 1 },
      { val: 1, arg: 10 },
      { val: 2, arg: 100 },
      { val: 3, arg: 1000 },
      { val: 4, arg: 10000 },
    ];
    const pick = bases[Math.floor(Math.random() * bases.length)];
    questionText = `log(${pick.arg}) = ?`;
    correctVal = pick.val;
    options = generateNumericOptions(correctVal, [0, 1, 2, 3, 4]);
  } else {
    const anglesDeg = [0, 30, 45, 60, 90, 120, 135, 150, 180];
    const angle = anglesDeg[Math.floor(Math.random() * anglesDeg.length)];
    const rad = (angle * Math.PI) / 180;
    let raw;
    if (type === 'sin') raw = Math.sin(rad);
    if (type === 'cos') raw = Math.cos(rad);
    if (type === 'tan') raw = Math.tan(rad);

    correctVal = round(raw, 2);
    if (Math.abs(correctVal) > 50) correctVal = 'undefined'; // e.g. tan(90deg)

    questionText = `${type}(${angle}°) = ?`;
    options = generateNumericOptions(correctVal, null);
  }

  return { type, questionText, correctVal, options };
}

// GET /api/quiz/question - fetch a new question
router.get('/question', authenticateToken, (req, res) => {
  const q = generateQuestion();
  pendingQuestions[req.user.username] = { type: q.type, correctVal: q.correctVal };
  res.json({ type: q.type, questionText: q.questionText, options: q.options });
});

// POST /api/quiz/answer - { selected }
router.post('/answer', authenticateToken, (req, res) => {
  const { selected } = req.body;
  const pending = pendingQuestions[req.user.username];

  if (!pending) {
    return res.status(400).json({ error: 'No active question. Request a new one.' });
  }

  const users = db.getUsers();
  const user = users[req.user.username];
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const correctVal = pending.correctVal;
  let isCorrect;
  if (correctVal === 'undefined') {
    isCorrect = selected === 'undefined';
  } else {
    isCorrect = typeof selected === 'number' && Math.abs(selected - correctVal) < 0.001;
  }

  user.answered += 1;
  let reward = 0;

  const transactions = db.getTransactions();
  if (!transactions[req.user.username]) transactions[req.user.username] = [];

  if (isCorrect) {
    user.correct += 1;
    user.streak += 1;
    reward = round(0.00015 + Math.min(user.streak, 10) * 0.00001, 8);
    user.balance = round(user.balance + reward, 8);
    transactions[req.user.username].push({
      type: `Quiz Reward (${pending.type})`,
      amount: reward,
      ts: new Date().toISOString(),
    });
  } else {
    user.streak = 0;
  }

  users[req.user.username] = user;
  db.saveUsers(users);
  db.saveTransactions(transactions);
  delete pendingQuestions[req.user.username];

  res.json({
    correct: isCorrect,
    correctVal,
    reward,
    balance: user.balance,
    streak: user.streak,
    correctCount: user.correct,
    answered: user.answered,
  });
});

module.exports = router;
