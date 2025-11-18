import { pool } from "../db.js";

/**
 * GET /fulfillment
 *
 * Return latest fulfillment rows from OUR student tables:
 *   parking_lot_fulfillment + parking_lots
 *
 * The column names are chosen to be compatible with stats.php:
 * - usage_id        -> id of the record
 * - lot_id          -> parking_lot_id
 * - code            -> lot code like "gg"
 * - display_name    -> lot name
 * - sample_date     -> date portion of timestamp
 * - occupied_count  -> same as fulfillment (0–100)
 * - capacity        -> from parking_lots.capacity
 * - fulfillment_pct -> fulfillment as 0..1
 * - notes           -> notes
 * - special_event   -> bool
 */
export async function listFulfillment(_req, res, next) {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        f.id                         AS usage_id,
        f.parking_lot_id             AS lot_id,
        l.code                       AS code,
        l.name                       AS display_name,
        f.timestamp::date            AS sample_date,
        f.fulfillment                AS occupied_count,
        l.capacity                   AS capacity,
        (f.fulfillment::numeric / 100.0) AS fulfillment_pct,
        f.notes,
        f.special_event
      FROM parking_lot_fulfillment f
      JOIN parking_lots l
        ON l.id = f.parking_lot_id
      ORDER BY f.timestamp DESC, f.id DESC;
      `
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /fulfillment
 *
 * Accepts either:
 *  - { parking_lot_id, fulfillment, special_event?, notes? }
 *  - { lot_code,        fulfillment, special_event?, notes? }
 *
 * lot_code is the "gg"/"aa"/etc string from your PHP <select>.
 * We map lot_code -> parking_lots.id.
 */
export async function createFulfillment(req, res, next) {
  try {
    const {
      parking_lot_id,
      lot_code,          // "gg", "aa", etc from PHP
      occupied_count,    // what stats.php actually sends
      fulfillment,       // optional: in case something else posts this
      special_event = false,
      notes,
    } = req.body;

    // 1) Figure out the numeric percentage from either occupied_count or fulfillment
    let raw = occupied_count ?? fulfillment;

    if (raw == null || raw === "") {
      return res.status(400).json({ error: "missing_fulfillment" });
    }

    const numericFulfillment = Number(raw);
    if (
      !Number.isFinite(numericFulfillment) ||
      numericFulfillment < 0 ||
      numericFulfillment > 100
    ) {
      return res.status(400).json({ error: "invalid_fulfillment" });
    }

    // 2) Resolve parking lot
    let lotId = parking_lot_id || null;
    let code = lot_code;

    if (code && typeof code === "string") {
      code = code.trim().toLowerCase();
    }

    if (!lotId && code) {
      // Try to find an existing lot by code in our student table
      const { rows } = await pool.query(
        `
        SELECT id
        FROM parking_lots
        WHERE lower(trim(code)) = $1
        `,
        [code]
      );

      if (rows.length > 0) {
        lotId = rows[0].id;
      } else {
        // Safety net: auto-create the lot if it somehow isn't seeded
        const autoName = `Lot ${code.toUpperCase()}`;
        const { rows: ins } = await pool.query(
          `
          INSERT INTO parking_lots (code, name, capacity)
          VALUES ($1, $2, 200)
          ON CONFLICT (code) DO UPDATE
            SET name = EXCLUDED.name
          RETURNING id;
          `,
          [code, autoName]
        );
        lotId = ins[0].id;
      }
    }

    if (!lotId) {
      return res.status(400).json({ error: "missing_parking_lot" });
    }

    // 3) Insert into our fulfillment table
    const { rows } = await pool.query(
      `
      INSERT INTO parking_lot_fulfillment
        (parking_lot_id, fulfillment, special_event, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [lotId, numericFulfillment, special_event, notes || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /fulfillment/:id
 * (Optional; stats.php may not even use this, but we keep it simple.)
 */
export async function updateFulfillment(req, res, next) {
  try {
    const { id } = req.params;
    const { fulfillment, special_event, notes } = req.body;

    const { rows } = await pool.query(
      `
      UPDATE parking_lot_fulfillment
         SET fulfillment  = COALESCE($2, fulfillment),
             special_event = COALESCE($3, special_event),
             notes         = COALESCE($4, notes)
       WHERE id = $1
       RETURNING *;
      `,
      [id, fulfillment ?? null, special_event ?? null, notes ?? null]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "not_found" });
    }

    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
}

/** DELETE /fulfillment/:id */
export async function deleteFulfillment(req, res, next) {
  try {
    const { id } = req.params;
    const r = await pool.query(
      `DELETE FROM parking_lot_fulfillment WHERE id = $1`,
      [id]
    );
    if (!r.rowCount) {
      return res.status(404).json({ error: "not_found" });
    }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
