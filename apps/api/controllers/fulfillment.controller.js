// controllers/fulfillment.controller.js
import { pool } from "../db.js";

/** GET /fulfillment — latest usage rows (newest first) */
export async function listFulfillment(_req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ccuparkinglot.lot_usage_stats ORDER BY sample_date DESC, usage_id DESC`
    );
    res.json(rows);
  } catch (e) { next(e); }
}

/** POST /fulfillment — create a usage record
 * body: { lot_id:int, sample_date?: 'YYYY-MM-DD', occupied_count:int, notes?:text }
 */
export async function createFulfillment(req, res, next) {
  try {
    const { lot_id, occupied_count, sample_date, notes } = req.body;
    if (!lot_id || occupied_count == null) {
      return res.status(400).json({ error: "lot_id_and_occupied_count_required" });
    }
    const { rows } = await pool.query(
      `INSERT INTO ccuparkinglot.lot_usage_stats (lot_id, sample_date, occupied_count, notes)
       VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4)
       RETURNING *`,
      [lot_id, sample_date ?? null, occupied_count, notes ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
}

/** PUT /fulfillment/:id — update one usage record */
export async function updateFulfillment(req, res, next) {
  try {
    const { id } = req.params;
    const { sample_date, occupied_count, peak_hour, notes } = req.body;

    const parts = [];
    const params = [];
    let i = 1;

    if (sample_date !== undefined) { parts.push(`sample_date = $${i++}`); params.push(sample_date); }
    if (occupied_count !== undefined) { parts.push(`occupied_count = $${i++}`); params.push(occupied_count); }
    if (peak_hour !== undefined) { parts.push(`peak_hour = $${i++}`); params.push(peak_hour); }
    if (notes !== undefined) { parts.push(`notes = $${i++}`); params.push(notes); }

    if (!parts.length) return res.status(400).json({ error: "no_fields" });

    const q = `UPDATE ccuparkinglot.lot_usage_stats SET ${parts.join(", ")} WHERE usage_id = $${i} RETURNING *`;
    params.push(id);

    const { rows } = await pool.query(q, params);
    if (!rows.length) return res.status(404).json({ error: "not_found" });
    res.json(rows[0]);
  } catch (e) { next(e); }
}

/** DELETE /fulfillment/:id */
export async function deleteFulfillment(req, res, next) {
  try {
    const { id } = req.params;
    const r = await pool.query(`DELETE FROM ccuparkinglot.lot_usage_stats WHERE usage_id=$1`, [id]);
    if (!r.rowCount) return res.status(404).json({ error: "not_found" });
    res.status(204).end();
  } catch (e) { next(e); }
}
