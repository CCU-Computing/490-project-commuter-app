import { pool } from "../db.js";

export async function upsertRouteStop(req, res, next) {
  try {
    const { routeId } = req.params;
    const { stop_id, seq } = req.body;
    if (!stop_id || typeof seq !== "number")
      return res.status(400).json({ error: "stop_id_and_seq_required" });

    const q = `
      INSERT INTO transit.route_stops(route_id, stop_id, seq)
      VALUES ($1,$2,$3)
      ON CONFLICT (route_id, stop_id)
      DO UPDATE SET seq = EXCLUDED.seq
      RETURNING route_id, stop_id, seq;
    `;
    const { rows } = await pool.query(q, [routeId, stop_id, seq]);
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
}

export async function deleteRouteStop(req, res, next) {
  try {
    const { routeId, stopId } = req.params;
    const { rowCount } = await pool.query(
      `DELETE FROM transit.route_stops WHERE route_id = $1 AND stop_id = $2`,
      [routeId, stopId]
    );
    if (!rowCount) return res.status(404).json({ error: "not_found" });
    res.status(204).end();
  } catch (e) { next(e); }
}