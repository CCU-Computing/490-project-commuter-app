import { pool } from "../db.js";
import { geomSqlAndParams } from "../utils/geo.js";

export async function listRoutes(_req, res, next) {
  try {
    const q = `
      SELECT jsonb_build_object(
        'type','FeatureCollection',
        'features', COALESCE(jsonb_agg(
          jsonb_build_object(
            'type','Feature',
            'id', route_id,
            'geometry', ST_AsGeoJSON(geom)::jsonb,
            'properties', to_jsonb(r) - 'geom'
          ) ORDER BY name
        ), '[]'::jsonb)
      ) AS fc
      FROM transit.routes r;
    `;
    const { rows } = await pool.query(q);
    res.json(rows[0].fc);
  } catch (e) { next(e); }
}

export async function getRoute(req, res, next) {
  try {
    const { id } = req.params;
    const q = `
      SELECT jsonb_build_object(
        'type','Feature',
        'id', route_id,
        'geometry', ST_AsGeoJSON(geom)::jsonb,
        'properties', to_jsonb(r) - 'geom'
      ) AS f
      FROM transit.routes r WHERE route_id = $1;
    `;
    const { rows } = await pool.query(q, [id]);
    if (!rows[0]) return res.status(404).json({ error: "not_found" });
    res.json(rows[0].f);
  } catch (e) { next(e); }
}

export async function createRoute(req, res, next) {
  try {
    const { name, code, color_hex, geometry, wkt, coords } = req.body;

    // Accept a few shapes: GeoJSON, WKT, or a coords helper (array of [lon,lat] points)
    let finalGeometry = geometry;
    let finalWkt = wkt;

    if (!finalGeometry && !finalWkt && Array.isArray(coords) && coords.length >= 2) {
      // Build a simple MULTILINESTRING from coords helper
      // coords: [ [lon,lat], [lon,lat], ... ]
      const seg = coords.map(([x, y]) => `${x} ${y}`).join(", ");
      finalWkt = `MULTILINESTRING((${seg}))`;
    }

    if (!finalGeometry && !finalWkt) {
      return res.status(400).json({
        error: "geometry_required",
        message:
          "Provide GeoJSON in `geometry`, WKT in `wkt`, or a coords array like [[lon,lat],[lon,lat]].",
        examples: {
          geojson: { type: "MultiLineString", coordinates: [[[-79, 33.7], [-78.95, 33.71]]] },
          wkt: "MULTILINESTRING((-79 33.7, -78.95 33.71))",
          coords: [[-79, 33.7], [-78.95, 33.71]]
        }
      });
    }

    const safeName = (name ?? "").trim() || `Route ${new Date().toISOString().slice(11,19)}`;
    const baseParams = [safeName, code ?? null, color_hex ?? null];

    const g = geomSqlAndParams(
      { geojson: finalGeometry, wkt: finalWkt },
      baseParams.length + 1
    );

    const q = `
      INSERT INTO transit.routes (name, code, color_hex, geom)
      VALUES ($1, $2, $3, ${g.sql})
      RETURNING route_id;
    `;
    const { rows } = await pool.query(q, [...baseParams, ...g.params]);
    res.status(201).json({ route_id: rows[0].route_id });
  } catch (e) {
    // Turn our util error into a 400
    if (String(e.message).includes("geometry_or_wkt_required")) {
      return res.status(400).json({
        error: "geometry_required",
        message:
          "Provide GeoJSON in `geometry`, WKT in `wkt`, or a coords array like [[lon,lat],[lon,lat]]."
      });
    }
    next(e);
  }
}


export async function updateRoute(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, color_hex, geometry, wkt } = req.body;

    const parts = [];
    const params = [];
    let i = 1;

    if (name !== undefined) { parts.push(`name = $${i++}`); params.push(name); }
    if (code !== undefined) { parts.push(`code = $${i++}`); params.push(code); }
    if (color_hex !== undefined) { parts.push(`color_hex = $${i++}`); params.push(color_hex); }
    if (geometry || wkt) {
      const g = geomSqlAndParams({ geojson: geometry, wkt }, params.length + 1);
      parts.push(`geom = ${g.sql}`);
      params.push(...g.params);
    }
    if (!parts.length) return res.status(400).json({ error: "no_fields" });

    const q = `UPDATE transit.routes SET ${parts.join(", ")} WHERE route_id = $${i} RETURNING route_id;`;
    params.push(id);
    const { rows } = await pool.query(q, params);
    if (!rows.length) return res.status(404).json({ error: "not_found" });
    res.json({ route_id: rows[0].route_id });
  } catch (e) { next(e); }
}

export async function deleteRoute(req, res, next) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(`DELETE FROM transit.routes WHERE route_id = $1`, [id]);
    if (!rowCount) return res.status(404).json({ error: "not_found" });
    res.status(204).end();
  } catch (e) { next(e); }
}

export async function listRouteStops(req, res, next) {
  try {
    const { id } = req.params;
    const q = `
      SELECT jsonb_build_object(
        'type','FeatureCollection',
        'features', COALESCE(jsonb_agg(
          jsonb_build_object(
            'type','Feature',
            'id', s.stop_id,
            'geometry', ST_AsGeoJSON(s.geom)::jsonb,
            'properties', jsonb_build_object(
              'name', s.name,
              'code', s.code,
              'seq', rs.seq
            )
          ) ORDER BY rs.seq
        ), '[]'::jsonb)
      ) AS fc
      FROM transit.route_stops rs
      JOIN transit.stops s ON s.stop_id = rs.stop_id
      WHERE rs.route_id = $1;
    `;
    const { rows } = await pool.query(q, [id]);
    res.json(rows[0].fc);
  } catch (e) { next(e); }
}
