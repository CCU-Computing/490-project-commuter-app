# Parking Lots Viewer (Node + Leaflet, no admin)

Viewer-only app that renders parking lot polygons on an OpenStreetMap basemap and colors them by occupancy (fill/capacity). No drawing, editing, or admin UI.

## Run
```bash
npm install
npm run dev   # or: npm start
```
Visit http://localhost:3000

## Endpoints
- `GET /api/lots` → returns `data/parking_lots.geojson`

## Data format
`data/parking_lots.geojson` (GeoJSON FeatureCollection)
Each feature:
```json
{
  "type": "Feature",
  "id": "lot_A",
  "properties": {
    "name": "Lot A",
    "capacity": 120,
    "fill": 72,
    "updatedAt": "2025-10-12T15:12:00Z"
  },
  "geometry": { "type": "Polygon", "coordinates": [ [ [lon,lat], ... ] ] }
}
```

## Updating fills
Since this is a viewer-only build, you can update `fill` values by editing the GeoJSON file on the server (or via your own separate process/API). The client auto-refreshes every 15 seconds and will update colors and tooltips.
