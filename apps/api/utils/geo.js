// utils/geo.js
// Build a parameterized SQL snippet for either GeoJSON or WKT input.
// Usage: const g = geomSqlAndParams({ geojson, wkt }, indexStart);
// Then use: ... VALUES (..., ${g.sql}) with params [..., ...g.params]
export function geomSqlAndParams({ geojson, wkt }, indexStart = 1) {
  if (geojson) {
    // Accept JS object or string; store as SRID 4326
    const payload = typeof geojson === "string" ? geojson : JSON.stringify(geojson);
    return {
      sql: `ST_SetSRID(ST_GeomFromGeoJSON($${indexStart}), 4326)`,
      params: [payload],
    };
  }
  if (wkt) {
    return {
      sql: `ST_SetSRID(ST_GeomFromText($${indexStart}), 4326)`,
      params: [wkt],
    };
  }
  throw new Error("geometry_or_wkt_required");
}
