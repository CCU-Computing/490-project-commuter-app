require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // important for Docker/WSL

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Resolve paths once and log them
const webDir = path.join(__dirname, '..', 'apps', 'web');
const dataDir = path.join(__dirname, '..', 'data');
const apiSrcDir = path.join(__dirname, '..', 'apps', 'api', 'src');

console.log('[startup] __dirname:', __dirname);
console.log('[startup] webDir:', webDir);
console.log('[startup] dataDir:', dataDir);
console.log('[startup] apiSrcDir:', apiSrcDir);

// Validate index.html exists — fail early if not
const indexPath = path.join(webDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`[startup] Missing index.html at: ${indexPath}`);
}

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), uptime: process.uptime() });
});

// Static
app.use(express.static(webDir));
app.use('/data', express.static(dataDir));

// Only expose this if you truly need client-accessible files from api/src
app.use('/src', express.static(apiSrcDir));

// SPA fallback (exclude /api, /data)
app.get(/^\/(?!api|data).*/, (req, res, next) => {
  res.sendFile(indexPath, (err) => {
    if (err) next(err);
  });
});

// Error visibility
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`[startup] Server listening on http://${HOST}:${PORT}`);
});

// Catch unhandled errors so you see them
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));
process.on('uncaughtException', (e) => console.error('[uncaughtException]', e));
