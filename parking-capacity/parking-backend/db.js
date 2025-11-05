// db.js (Merged Version)
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

// Your original pool export
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper to normalize day string (e.g., 'Monday' -> 'monday')
function _normalizeDay(day) {
  return String(day || '').toLowerCase();
}

/**
 * Lists parking lots for a given day and hour, sorted best->worst by occupancy percent (lowest first).
 * Uses the new 'slots' table for predicted capacity data.
 */
export async function listParking(day, hour) {
  day = _normalizeDay(day);
  hour = Number(hour || 0);

  const sql = `
    SELECT
      pl.id,
      pl.name,
      s.capacity,
      s.occupied,
      (CAST(s.occupied AS REAL) / s.capacity) AS occupancy_percent
    FROM parking_lots pl
    JOIN slots s ON s.parking_lot_id = pl.id AND s.day = $1 AND s.hour = $2
    ORDER BY occupancy_percent ASC, pl.id ASC;
  `;
  const { rows } = await pool.query(sql, [day, hour]);

  const list = rows.map(r => ({
    id: r.id,
    name: r.name,
    capacity: Number(r.capacity),
    occupied: Number(r.occupied),
    occupancy_percent: Number(Number(r.occupancy_percent || 0).toFixed(4)),
    probability: Number(Math.max(0, 1 - (r.occupancy_percent || 0)).toFixed(4))
  }));
  return list;
}

/**
 * Gets the best parking lot for a given day and hour (lowest occupancy).
 */
export async function getBestParking(day, hour) {
  const list = await listParking(day, hour);
  return (list && list.length) ? list[0] : null;
}