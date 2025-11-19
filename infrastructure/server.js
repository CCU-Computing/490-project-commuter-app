// server.js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// NEW: Postgres client (optional)
let Pool = null;
try {
  ({ Pool } = require('pg'));
} catch (err) {
  console.warn('[startup] "pg" module not installed; continuing without database support.');
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // important for Docker/WSL

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Resolve primary directories once
const projectRoot = path.join(__dirname, '..');
const apiDir = path.join(projectRoot, 'apps', 'api');
const apiPublicDir = path.join(apiDir, 'src', 'public');
const dataDir = path.join(projectRoot, 'data');
const phpDocRoot = process.env.PHP_DOCROOT || path.join(apiDir, 'models');
const phpHost = process.env.PHP_DEV_HOST || '127.0.0.1';
const phpPort = Number(process.env.PHP_DEV_PORT) || 8081;
const phpPublicHost = process.env.PHP_PUBLIC_HOST || phpHost;
const autoStartPhp = (process.env.START_PHP_FRONTEND ?? 'true').toLowerCase() !== 'false';

console.log('[startup] __dirname:', __dirname);
console.log('[startup] projectRoot:', projectRoot);
console.log('[startup] apiDir:', apiDir);
console.log('[startup] apiPublicDir:', apiPublicDir);
console.log('[startup] phpDocRoot:', phpDocRoot);
console.log('[startup] dataDir:', dataDir);

let phpProcess = null;
let autoPhpOrigin = null;
let frontendOrigin = null;
const disableFrontendValues = new Set(['none', 'disable', 'off']);

function resolveFrontendOrigin() {
  const raw = process.env.FRONTEND_PHP_ORIGIN;
  if (raw) {
    if (disableFrontendValues.has(raw.toLowerCase())) return null;
    return raw;
  }
  return autoPhpOrigin;
}

function refreshFrontendOrigin(reason = 'startup') {
  const next = resolveFrontendOrigin();
  if (next === frontendOrigin) return;
  frontendOrigin = next;
  if (frontendOrigin) {
    console.log(`[frontend] ${reason}: PHP frontend proxy enabled -> ${frontendOrigin}`);
  } else {
    console.log(`[frontend] ${reason}: PHP frontend proxy disabled; serving static fallback if available.`);
  }
}

refreshFrontendOrigin('initial');

function startPhpDevServer() {
  if (!autoStartPhp) {
    console.log('[startup] Automatic PHP dev server disabled via START_PHP_FRONTEND=false');
    return;
  }

  if (!fs.existsSync(phpDocRoot)) {
    console.warn('[startup] Cannot auto-start PHP server; doc root missing:', phpDocRoot);
    autoPhpOrigin = null;
    refreshFrontendOrigin('php-missing-docroot');
    return;
  }

  try {
    console.log(`[startup] Launching built-in PHP server at http://${phpHost}:${phpPort} (doc root: ${phpDocRoot})`);
    phpProcess = spawn('php', ['-S', `${phpHost}:${phpPort}`, '-t', phpDocRoot], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    phpProcess.once('spawn', () => {
      autoPhpOrigin = `http://${phpPublicHost}:${phpPort}`;
      refreshFrontendOrigin('php-start');
    });

    phpProcess.on('error', (err) => {
      console.error('[startup] Failed to launch PHP dev server:', err.message);
      autoPhpOrigin = null;
      refreshFrontendOrigin('php-error');
    });

    phpProcess.on('exit', (code, signal) => {
      console.log(`[startup] PHP dev server exited (code=${code}, signal=${signal})`);
      phpProcess = null;
      autoPhpOrigin = null;
      refreshFrontendOrigin('php-exit');
    });
  } catch (err) {
    console.error('[startup] Error spawning PHP dev server:', err);
    autoPhpOrigin = null;
    refreshFrontendOrigin('php-spawn-exception');
  }
}

startPhpDevServer();

function shutdownPhpServer() {
  if (phpProcess) {
    console.log('[shutdown] Stopping PHP dev server...');
    phpProcess.kill('SIGTERM');
    phpProcess = null;
  }
}

process.on('exit', shutdownPhpServer);
process.on('SIGINT', () => {
  shutdownPhpServer();
  process.exit(0);
});
process.on('SIGTERM', () => {
  shutdownPhpServer();
  process.exit(0);
});

// --- PHP frontend redirect (non-breaking) ---
function redirectToFrontend(req, res, next, includePath = false) {
  if (!frontendOrigin) return next();
  if (includePath) {
    return res.redirect(frontendOrigin + req.originalUrl);
  }
  return res.redirect(frontendOrigin);
}

// Redirect root/index requests when the PHP frontend is active
app.get('/', (req, res, next) => redirectToFrontend(req, res, next, false));
app.get(['/index.php', '/index.html'], (req, res, next) => redirectToFrontend(req, res, next, false));

// Redirect general HTML navigation when proxying to PHP
app.use((req, res, next) => {
  if (!frontendOrigin) return next();
  const acceptsHTML = (req.headers.accept || '').includes('text/html');
  const isApi = req.path.startsWith('/api');
  if (acceptsHTML && !isApi) {
    return redirectToFrontend(req, res, next, true);
  }
  next();
});

// Optional: quiet favicon.ico when using PHP frontend
app.get('/favicon.ico', (req, res, next) => {
  if (!frontendOrigin) return next();
  res.status(204).end();
});

// Optional static index fallback (when not proxied to PHP)
let fallbackIndexPath = null;
if (fs.existsSync(apiPublicDir)) {
  const candidates = ['index.html', 'map.html'];
  for (const filename of candidates) {
    const candidatePath = path.join(apiPublicDir, filename);
    if (fs.existsSync(candidatePath)) {
      fallbackIndexPath = candidatePath;
      break;
    }
  }
  if (!fallbackIndexPath) {
    console.warn('[startup] No fallback HTML (index.html/map.html) found in', apiPublicDir);
  }
} else {
  console.warn('[startup] Public directory missing:', apiPublicDir);
}

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), uptime: process.uptime() });
});

/* ===========================
   NEW: Postgres connection
   =========================== */
const hasDbConfig = Boolean(
  process.env.DATABASE_URL ||
  process.env.PGHOST ||
  process.env.PGUSER ||
  process.env.PGDATABASE
);

let pool = null;
if (hasDbConfig && Pool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  pool.on('error', (err) => {
    console.error('[postgres] Unexpected client error', err);
  });
} else {
  console.warn('[startup] No Postgres configuration detected; falling back to static data.');
}

// Lazy-load fallback data file
let cachedLots = null;
async function loadLotsFromFile() {
  if (cachedLots) return cachedLots;
  const geojsonPath = path.join(dataDir, 'ParkingLots.geojson');
  try {
    const text = await fs.promises.readFile(geojsonPath, 'utf8');
    const parsed = JSON.parse(text);
    cachedLots = Array.isArray(parsed?.features)
      ? parsed.features.map((feature, idx) => ({
          id: feature?.properties?.id ?? idx + 1,
          name: feature?.properties?.name ?? `Lot ${idx + 1}`,
          capacity: feature?.properties?.capacity ?? null,
          fill: feature?.properties?.fill ?? 0,
          event: feature?.properties?.event ?? false,
          geom: feature?.geometry ?? null,
        })).filter(d => d.geom)
      : [];
  } catch (err) {
    console.error('[fallback] Failed to read ParkingLots.geojson:', err.message);
    cachedLots = [];
  }
  return cachedLots;
}

/* ===========================================================
   NEW: API endpoints consumed by parkingStatus.js / Leaflet
   - Assumes your DB defines:
       get_parking_lots() -> json/jsonb (array of objects)
       get_parking_lots_at(timestamptz) -> json/jsonb  (optional)
   - Each object should include:
       { id, name, capacity, fill, event, geom: GeoJSON }
   =========================================================== */

// Return the current lots as JSON array (already JSON from Postgres)
app.get('/api/lots', async (req, res) => {
  try {
    if (pool) {
      const { rows } = await pool.query('SELECT get_parking_lots() AS data;');
      const payload = rows?.[0]?.data;
      if (Array.isArray(payload)) return res.json(payload);
      if (payload && payload.features) return res.json(payload.features);
      if (payload) return res.json(payload);
    }

    const fallbackLots = await loadLotsFromFile();
    return res.json(fallbackLots);
  } catch (err) {
    console.error('[api/lots] DB error:', err);
    if (pool) {
      return res.status(500).json({ error: 'DB failure' });
    }
    const fallbackLots = await loadLotsFromFile();
    res.json(fallbackLots);
  }
});

// Optional time-sliced endpoint: /api/lots_at?at=2025-10-31T12:00:00Z
app.get('/api/lots_at', async (req, res) => {
  try {
    const at = req.query.at;
    if (!at) return res.status(400).json({ error: 'Missing ?at=ISO8601 timestamp' });
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    const { rows } = await pool.query('SELECT get_parking_lots_at($1) AS data;', [at]);
    const payload = rows?.[0]?.data;
    if (!payload) return res.json([]);
    res.json(payload);
  } catch (err) {
    console.error('[api/lots_at] DB error:', err);
    res.status(500).json({ error: 'DB failure' });
  }
});

// Static
if (fs.existsSync(apiPublicDir)) {
  app.use(express.static(apiPublicDir));
} else {
  console.warn('[startup] Static public directory unavailable; skipping express.static for app assets.');
}

if (fs.existsSync(dataDir)) {
  app.use('/data', express.static(dataDir));
} else {
  console.warn('[startup] /data directory missing; /data routes disabled.');
}

if (fallbackIndexPath) {
  app.get(/^\/(?!api|data).*/, (req, res, next) => {
    if (frontendOrigin) return next();
    res.sendFile(fallbackIndexPath, (err) => {
      if (err) next(err);
    });
  });
}

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
