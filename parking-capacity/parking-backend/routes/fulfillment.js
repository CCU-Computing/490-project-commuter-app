// routes/fulfillment.js (Unchanged)
import express from 'express';
import { pool } from '../db.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM parking_lot_fulfillment ORDER BY timestamp DESC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { parking_lot_id, fulfillment, special_event = false } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO parking_lot_fulfillment (parking_lot_id, fulfillment, special_event)
     VALUES ($1,$2,$3) RETURNING *`,
    [parking_lot_id, fulfillment, special_event]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { fulfillment, special_event } = req.body;
  const { rows } = await pool.query(
    `UPDATE parking_lot_fulfillment SET fulfillment=$1, special_event=$2, timestamp=NOW() WHERE id=$3 RETURNING *`,
    [fulfillment, special_event, id]
  );
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM parking_lot_fulfillment WHERE id=$1', [req.params.id]);
  res.status(204).send();
});

export default router;