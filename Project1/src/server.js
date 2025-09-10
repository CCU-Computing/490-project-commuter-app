// src/server.js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

//API route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve static files
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Serve images directly from the img folder
app.use('/img', express.static(path.join(__dirname, '..', 'img')));
// Serve /src for client-side scripts
app.use('/src', express.static(path.join(__dirname, '..', 'src')));


// SPA fallback / default to index.html for any route not found
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
