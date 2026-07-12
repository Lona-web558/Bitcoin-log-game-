// server.js
// Main entry point. Serves the frontend and mounts the API routes.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { errorHandler } = require('./middleware');
const authRoutes = require('./auth');
const walletRoutes = require('./wallet');
const quizRoutes = require('./quiz');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serves index.html and any other static files placed in this same folder.
app.use(express.static(__dirname));

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/quiz', quizRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Basic health check - useful for Render / uptime monitors.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'satoshi-trig', time: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Satoshi Trig server running on port ${PORT}`);
});
