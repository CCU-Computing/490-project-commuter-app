// utils/geo.js
export function geomSqlAndParams(input, startIndex = 1) {
  if (input?.geojson) {
    return {
      sql: `ST_SetSRID(ST_GeomFromGeoJSON($${startIndex}), 4326)`,
      params: [JSON.stringify(input.geojson)],
    };
  }
  if (typeof input?.wkt === "string") {
    return {
      sql: `ST_SetSRID(ST_GeomFromText($${startIndex}), 4326)`,
      params: [input.wkt],
    };
  }
  throw new Error("Geometry required: provide `geojson` or `wkt`");
}
