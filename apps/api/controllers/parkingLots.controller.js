// controllers/parkingLots.controller.js
import { pool, listParking, getBestParking } from "../db.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const lotsGeoPath = path.join(__dirname, "lots.geojson");

function dayHourFromQuery(req) {
  const now = new Date();
  const day =
    (
      req.query.day ||
      ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][now.getDay()]
    ).toLowerCase();
  const hour = Number(req.query.hour ?? now.getHours());
  return { day, hour };
}

/**
 * GET /parking-lots/geojson
 *
 * Returns the campus parking lots as a GeoJSON FeatureCollection.
 * Polygons come from lots.geojson on disk.
 * Capacity + fulfillment come from our student tables:
 *   public.parking_lots + public.parking_lot_fulfillment.
 */
export async function listParkingLots(req, res, next) {
  try {
    // 1) Load the raw polygons from lots.geojson
    const raw = await fs.readFile(lotsGeoPath, "utf8");
    const fc = JSON.parse(raw);

    // 2) Get latest fulfillment per lot code from our own tables
    const { rows } = await pool.query(`
      SELECT
        l.code,
        l.capacity,
        latest.fulfillment
      FROM parking_lots l
      LEFT JOIN LATERAL (
        SELECT f.fulfillment
        FROM parking_lot_fulfillment f
        WHERE f.parking_lot_id = l.id
        ORDER BY f.timestamp DESC, f.id DESC
        LIMIT 1
      ) AS latest ON TRUE;
    `);

    const statsByCode = new Map(
      rows.map(r => [String(r.code).toLowerCase(), r])
    );

    // 3) Enrich each GeoJSON feature with capacity / occupied / fulfillment
    fc.features = (fc.features || []).map(feat => {
      const props = feat.properties || {};
      const codeRaw = props.id || props.code || "";
      const code = String(codeRaw).toLowerCase();

      const stat = statsByCode.get(code);
      const capacity = stat?.capacity ?? null;
      const fulfillmentPct = stat?.fulfillment ?? 0; // 0–100
      const fulfillment = fulfillmentPct / 100.0;     // 0–1
      const occupied =
        capacity != null ? Math.round((fulfillmentPct / 100.0) * capacity) : null;

      feat.properties = {
        ...props,
        code: codeRaw,
        name: props.name || props.id || `Lot ${code.toUpperCase()}`,
        capacity,
        occupied,
        fulfillment,
      };

      return feat;
    });

    res.json(fc);
  } catch (e) {
    next(e);
  }
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
        SELECT DISTINCT ON (l.code)
          l.code,
          lus.sample_date,
          lus.occupied_count
        FROM ccuparkinglot.lot_usage_stats lus
        JOIN ccuparkinglot.lots l
          ON l.lot_id = lus.lot_id
        ORDER BY l.code, lus.sample_date DESC, lus.usage_id DESC
      )
      SELECT jsonb_build_object(
        'type','FeatureCollection',
        'features', COALESCE(jsonb_agg(
          jsonb_build_object(
            'type','Feature',
            'geometry', ST_AsGeoJSON(l.geom)::jsonb,
            'properties', jsonb_build_object(
              'lot_id',   l.lot_id,
              'code',     l.code,
              'name',     l.display_name,
              'capacity', l.capacity,
              'occupied',   COALESCE(lat.occupied_count, 0),
              'fulfillment', LEAST(
                  1.0,
                  COALESCE(lat.occupied_count, 0)::float / 100.0
              )
            )
          ) ORDER BY l.code
        ), '[]'::jsonb)
      ) AS fc
      FROM ccuparkinglot.lots l
      LEFT JOIN latest lat
        ON lat.code = l.code
      WHERE l.geom IS NOT NULL;
    `);

    res.json(rows[0].fc);
  } catch (e) { next(e); }
}