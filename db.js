// db.js
// Simple flat-file JSON storage. No database server needed - matches the
// same file-storage pattern used in Platinum Bank and the other Render apps.

const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');
const TRANSACTIONS_FILE = path.join(__dirname, 'transactions.json');

function readJSON(file) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    // If the file doesn't exist yet or is empty/corrupt, start fresh.
    return {};
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
  getUsers: () => readJSON(USERS_FILE),
  saveUsers: (data) => writeJSON(USERS_FILE, data),
  getTransactions: () => readJSON(TRANSACTIONS_FILE),
  saveTransactions: (data) => writeJSON(TRANSACTIONS_FILE, data),
};
