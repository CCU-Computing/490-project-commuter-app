import { pool } from "../db.js";
import { geomSqlAndParams } from "../utils/geo.js";

export async function listStops(_req, res, next) {
  try {
    const q = `
      SELECT jsonb_build_object(
        'type','FeatureCollection',
        'features', COALESCE(jsonb_agg(
          jsonb_build_object(
            'type','Feature',
            'id', stop_id,
            'geometry', ST_AsGeoJSON(geom)::jsonb,
            'properties', to_jsonb(s) - 'geom' - 'geom_3857'
          ) ORDER BY name
        ), '[]'::jsonb)
      ) AS fc
      FROM transit.stops s;
    `;
    const { rows } = await pool.query(q);
    res.json(rows[0].fc);
  } catch (e) { next(e); }
}

export async function getStop(req, res, next) {
  try {
    const { id } = req.params;
    const q = `
      SELECT jsonb_build_object(
        'type','Feature',
        'id', stop_id,
        'geometry', ST_AsGeoJSON(geom)::jsonb,
        'properties', to_jsonb(s) - 'geom' - 'geom_3857'
      ) AS f
      FROM transit.stops s WHERE stop_id = $1;
    `;
    const { rows } = await pool.query(q, [id]);
    if (!rows[0]) return res.status(404).json({ error: "not_found" });
    res.json(rows[0].f);
  } catch (e) { next(e); }
}

export async function createStop(req, res, next) {
  try {
    const { name, code, direction, accessible, shelter, geometry, wkt } = req.body;
    const safeName = (name ?? "").trim() || `Stop ${new Date().toISOString().slice(11,19)}`;

    const baseParams = [safeName, code ?? null, direction ?? null, !!accessible, !!shelter];
    const g = geomSqlAndParams({ geojson: geometry, wkt }, baseParams.length + 1);

    const q = `
      INSERT INTO transit.stops (name, code, direction, accessible, shelter, geom)
      VALUES ($1, $2, $3, $4, $5, ${g.sql})
      RETURNING stop_id;
    `;
    const { rows } = await pool.query(q, [...baseParams, ...g.params]);
    res.status(201).json({ stop_id: rows[0].stop_id });
  } catch (e) { next(e); }
}

export async function updateStop(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, direction, accessible, shelter, geometry, wkt } = req.body;

    const parts = [];
    const params = [];
    let i = 1;

    if (name !== undefined) { parts.push(`name = $${i++}`); params.push(name); }
    if (code !== undefined) { parts.push(`code = $${i++}`); params.push(code); }
    if (direction !== undefined) { parts.push(`direction = $${i++}`); params.push(direction); }
    if (accessible !== undefined) { parts.push(`accessible = $${i++}`); params.push(!!accessible); }
    if (shelter !== undefined) { parts.push(`shelter = $${i++}`); params.push(!!shelter); }
    if (geometry || wkt) {
      const g = geomSqlAndParams({ geojson: geometry, wkt }, params.length + 1);
      parts.push(`geom = ${g.sql}`);
      params.push(...g.params);
    }
    if (!parts.length) return res.status(400).json({ error: "no_fields" });

    const q = `UPDATE transit.stops SET ${parts.join(", ")} WHERE stop_id = $${i} RETURNING stop_id;`;
    params.push(id);
    const { rows } = await pool.query(q, params);
    if (!rows.length) return res.status(404).json({ error: "not_found" });
    res.json({ stop_id: rows[0].stop_id });
  } catch (e) { next(e); }
}

export async function deleteStop(req, res, next) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(`DELETE FROM transit.stops WHERE stop_id = $1`, [id]);
    if (!rowCount) return res.status(404).json({ error: "not_found" });
    res.status(204).end();
  } catch (e) { next(e); }
}
