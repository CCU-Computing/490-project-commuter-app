// routes/parkingLots.js
import express from 'express';
import { pool } from '../db.js';
const router = express.Router();

// GET /api/parking-lots
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

// GET /api/parking-lots/best
router.get('/best', async (req, res) => {
  const sql = `
    SELECT pl.id, pl.name, f.fulfillment
    FROM parking_lots pl
    JOIN (
      SELECT DISTINCT ON (parking_lot_id) *
      FROM parking_lot_fulfillment
      ORDER BY parking_lot_id, timestamp DESC
    ) f ON pl.id = f.parking_lot_id
    WHERE f.special_event = FALSE
    ORDER BY f.fulfillment ASC
    LIMIT 1;
  `;
  const { rows } = await pool.query(sql);
  res.json(rows[0] || {});
});

// GET /api/parking-lots/geojson
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
