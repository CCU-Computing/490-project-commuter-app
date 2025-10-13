import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const dataDir = path.join(__dirname, 'data');
const lotsPath = path.join(dataDir, 'parking_lots.geojson');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(lotsPath)) {
  const empty = { type: 'FeatureCollection', name: 'parking-lots', version: 1, features: [] };
  fs.writeFileSync(lotsPath, JSON.stringify(empty, null, 2));
}

app.get('/api/lots', (_req, res) => {
  try {
    const text = fs.readFileSync(lotsPath, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read lots file.' });
  }
});

app.listen(PORT, () => {
  console.log(`Viewer running at http://localhost:${PORT}`);
});
