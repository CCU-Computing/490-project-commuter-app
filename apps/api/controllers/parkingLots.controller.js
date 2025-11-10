// controllers/parkingLots.controller.js
import { pool, listParking, getBestParking } from "../db.js";

function dayHourFromQuery(req) {
  const now = new Date();
  const day =
    (req.query.day ||
      ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][now.getDay()]
    ).toLowerCase();
  const hour = Number(req.query.hour ?? now.getHours());
  return { day, hour };
}

/** GET /parking-lots — lots + latest usage + fulfillment */
export async function listParkingLots(req, res, next) {
  try {
    const rows = await listParking();
    res.json(rows);
  } catch (e) { next(e); }
}

/** GET /parking-lots/best?day=&hour= */
export async function bestParkingLot(req, res, next) {
  try {
    const { day, hour } = dayHourFromQuery(req);
    const best = await getBestParking(day, hour);
    res.json(best || {});
  } catch (e) { next(e); }
}

/** GET /parking-lots/historical — same as list for now (no history table) */
export async function historicalParking(req, res, next) {
  try {
    const rows = await listParking();
    res.json(rows);
  } catch (e) { next(e); }
}


export async function importParkingLotsGeoJSON(req, res, next) {
  try {
    const fc = req.body;
    if (!fc || fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) {
      return res.status(400).json({ error: "invalid_geojson", message: "Send a FeatureCollection with features[]." });
    }

    // Find or create campus once (by name)
    const campusName = "CCU Conway";
    const campusRow = await pool.query(
      `INSERT INTO ccuparkinglot.campuses(name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING campus_id`,
      [campusName]
    );
    const campus_id = campusRow.rows[0].campus_id;

    // Upsert each feature: properties.id -> code, properties.name -> display_name
    // Use the unique constraint (campus_id, code) for ON CONFLICT
    const inserted = [];
    const updated = [];

    for (const feature of fc.features) {
      const props = feature?.properties ?? {};
      const geom = feature?.geometry;
      if (!geom || geom.type !== "Polygon") {
        // skip non-polygons or missing geometry
        continue;
      }
      const code = String(props.id ?? "").trim();
      const display_name = String((props.name ?? code) || "Unnamed Lot").trim();
      if (!code) continue;

      const geojsonText = JSON.stringify(geom);

      const q = `
        INSERT INTO ccuparkinglot.lots (campus_id, code, display_name, geom)
        VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326))
        ON CONFLICT (campus_id, code)
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          geom = EXCLUDED.geom
        RETURNING lot_id, campus_id, code, display_name;
      `;
      const { rows } = await pool.query(q, [campus_id, code, display_name, geojsonText]);

      // crude way to tell if updated vs inserted: try to detect by checking if it existed before
      // (lightweight extra query avoided; we'll tag everything as "upserted")
      inserted.push(rows[0]); // for simplicity, we just collect results
    }

    res.status(200).json({ ok: true, upserted: inserted.length });
  } catch (e) { next(e); }
}


/** GET /parking-lots/geojson — no geometry in lots table; return props only */
export async function parkingLotsGeoJSON(_req, res, next) {
  try {
    const { rows } = await pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (lus.lot_id)
          lus.lot_id, lus.sample_date, lus.occupied_count
        FROM ccuparkinglot.lot_usage_stats lus
        ORDER BY lus.lot_id, lus.sample_date DESC
      )
      SELECT jsonb_build_object(
        'type','FeatureCollection',
        'features', COALESCE(jsonb_agg(
          jsonb_build_object(
            'type','Feature',
            'geometry', ST_AsGeoJSON(l.geom)::jsonb,
            'properties', jsonb_build_object(
              'lot_id', l.lot_id,
              'code', l.code,
              'name', l.display_name,
              'capacity', l.capacity,
              'occupied', COALESCE(lat.occupied_count,0),
              'fulfillment', CASE WHEN l.capacity>0 THEN COALESCE(lat.occupied_count::float/l.capacity,0) ELSE 0 END
            )
          ) ORDER BY l.code
        ), '[]'::jsonb)
      ) AS fc
      FROM ccuparkinglot.lots l
      LEFT JOIN latest lat ON lat.lot_id = l.lot_id
      WHERE l.geom IS NOT NULL;
    `);
    res.json(rows[0].fc);
  } catch (e) { next(e); }
}
