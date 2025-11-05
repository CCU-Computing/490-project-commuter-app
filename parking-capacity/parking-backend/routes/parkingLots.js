// routes/parkingLots.js (Merged Version)
import express from 'express';
import { pool, listParking, getBestParking } from '../db.js'; // Added listParking, getBestParking
const router = express.Router();

// Helper to get day/hour from request query or default to current time
function getCurrentDayAndHour(req) {
  const now = new Date();
  // Get day string (e.g., 'monday'). This is used for the slots table lookups.
  const dayOfWeek = req.query.day || ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const hour = Number(req.query.hour) || now.getHours();
  return { day: dayOfWeek.toLowerCase(), hour };
}

// GET /api/parking-lots (Your original: Real-time with fulfillment/geo data)
router.get('/', async (req, res) => {
  const sql = `
    SELECT pl.id, pl.name, pl.geometry,
           f.fulfillment, f.special_event, f.timestamp
    FROM parking_lots pl
    LEFT JOIN (
      SELECT DISTINCT ON (parking_lot_id) *
      FROM parking_lot_fulfillment
      ORDER BY parking_lot_id, timestamp DESC
    ) f ON pl.id = f.parking_lot_id
    ORDER BY pl.id;
  `;
  const { rows } = await pool.query(sql);
  res.json(rows);
});

// GET /api/parking-lots/best (UPDATED: Uses predicted occupancy from 'slots' table)
// Accepts optional query params: ?day=monday&hour=9
router.get('/best', async (req, res) => {
  const { day, hour } = getCurrentDayAndHour(req);
  try {
    const bestLot = await getBestParking(day, hour);
    if (bestLot) {
      res.json(bestLot);
    } else {
      res.json({});
    }
  } catch (e) {
    console.error('Error getting best parking lot:', e);
    res.status(500).send({ error: "Failed to retrieve predicted best parking lot." });
  }
});

// GET /api/parking-lots/historical (NEW ROUTE: Shows all predicted slots)
// Accepts optional query params: ?day=monday&hour=9
router.get('/historical', async (req, res) => {
  const { day, hour } = getCurrentDayAndHour(req);
  try {
    const list = await listParking(day, hour);
    res.json(list);
  } catch (e) {
    console.error('Error getting historical parking list:', e);
    res.status(500).send({ error: "Failed to retrieve historical parking data." });
  }
});

// GET /api/parking-lots/geojson (Your original: GeoJSON data)
router.get('/geojson', async (req, res) => {
  const sql = `
    SELECT pl.id, pl.name, pl.geometry,
           f.fulfillment, f.special_event
    FROM parking_lots pl
    LEFT JOIN (
      SELECT DISTINCT ON (parking_lot_id) *
      FROM parking_lot_fulfillment
      ORDER BY parking_lot_id, timestamp DESC
    ) f ON pl.id = f.parking_lot_id;
  `;
  const { rows } = await pool.query(sql);
  const features = rows.map(r => ({
    type: 'Feature',
    geometry: r.geometry,
    properties: {
      id: r.id,
      name: r.name,
      fulfillment: r.fulfillment,
      special_event: r.special_event
    }
  }));
  res.json({ type: 'FeatureCollection', features });
});

export default router;