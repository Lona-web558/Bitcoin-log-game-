// middleware.js
// Auth middleware (verifies the login token) and a shared error handler.

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'satoshi-trig-dev-secret-change-me';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in again.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid. Please log in again.' });
    }
    req.user = decoded; // { username }
    next();
  });
}

function errorHandler(err, req, res, next) {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
}

module.exports = { authenticateToken, errorHandler, JWT_SECRET };
