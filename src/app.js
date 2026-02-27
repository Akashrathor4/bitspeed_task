const express = require('express');
const cors = require('cors');
const identityRoutes = require('./routes/identityRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: '🚀 Bitespeed Identity Reconciliation API is running!',
    version: '1.0.0',
    endpoints: {
      identify: 'POST /identify',
      health: 'GET /',
    },
  });
});

// Routes
app.use('/', identityRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
