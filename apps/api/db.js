// db.js
import pg from "pg";
const { Pool } = pg;

const {
  DATABASE_URL,
  PGHOST = "localhost",
  PGPORT = "5432",
  PGDATABASE = "transit",
  PGUSER = "postgres",
  PGPASSWORD = "postgres",
  // extras
  PGSSL = "",
  PGSCHEMA = "ccuparkinglot", // primary app schema for parking
} = process.env;

const base = DATABASE_URL
  ? {
      connectionString: DATABASE_URL,
      ...(PGSSL && PGSSL !== "false" ? { ssl: { rejectUnauthorized: false } } : {}),
    }
  : {
      host: PGHOST,
      port: Number.parseInt(PGPORT, 10),
      database: PGDATABASE,
      user: PGUSER,
      password: String(PGPASSWORD),
      ...(PGSSL && PGSSL !== "false" ? { ssl: { rejectUnauthorized: false } } : {}),
    };

export const pool = new Pool({
  ...base,
  max: 10,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
  application_name: "parking-tracker",
});

// Ensure search_path + timeouts per-connection
pool.on("connect", async (client) => {
  // Put both schemas up front so unqualified names work
  await client.query(`SET search_path TO ${PGSCHEMA}, transit, public;`);
  await client.query(`SET statement_timeout = '30s'`);
  await client.query(`SET idle_in_transaction_session_timeout = '30s'`);
});

// Helper
export const query = (text, params) => pool.query(text, params);

// -------- Parking helpers wired to your real tables --------

// Returns lots with latest usage + computed fulfillment (0..1)
export async function listParking(_day, _hour) {
  const sql = `
    WITH latest AS (
      SELECT DISTINCT ON (lus.lot_id)
        lus.lot_id,
        lus.sample_date,
        lus.occupied_count
      FROM ccuparkinglot.lot_usage_stats lus
      ORDER BY lus.lot_id, lus.sample_date DESC
    )
    SELECT
      l.lot_id AS id,
      l.display_name AS name,
      l.capacity,
      COALESCE(lat.occupied_count, 0) AS occupied,
      CASE
        WHEN l.capacity > 0 THEN COALESCE(lat.occupied_count::float / l.capacity, 0)
        ELSE 0
      END AS fulfillment,
      lat.sample_date AS timestamp
    FROM ccuparkinglot.lots l
    LEFT JOIN latest lat ON lat.lot_id = l.lot_id
    ORDER BY fulfillment NULLS LAST, l.lot_id;
  `;
  const { rows } = await pool.query(sql);
  return rows;
}

/** Pick the “best” lot = lowest fulfillment, then highest free spaces */
export async function getBestParking(day, hour) {
  const rows = await listParking(day, hour);
  return rows
    .sort((a, b) => a.fulfillment - b.fulfillment || (b.capacity - b.occupied) - (a.capacity - a.occupied))[0] || null;
}

// Optional graceful shutdown
export async function closePool() {
  await pool.end();
}
