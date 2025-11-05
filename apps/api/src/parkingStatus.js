/* parkingStatus file used for creating and updating the web page showing parking lot status.
  Desc: This will take the map and given data from SQL and change the parking lot color based on the 
  current fill of the parking lot at the given time.
  
  User Story: As a student I want to be able to see a visual reference of the current capacity 
  of the parking lot to easily judge the parking across campus. An example would be a map with 
  green, yellow, or red overlayed over the parking lots on campus.
*/

// Map configuration + state
const MAP_CENTER = [33.7935, -79.0106]; // Approximate CCU campus center
const MAP_ZOOM = 15;
const REFRESH_INTERVAL_MS = 600000; // 10 minutes

const API_BASE = (typeof window !== 'undefined' && window.ccuParkingApiBase)
  ? String(window.ccuParkingApiBase).replace(/\/+$/, '')
  : '';

const DEFAULT_STYLE = {
  color: '#8593a3',
  weight: 1,
  fillOpacity: 0.25,
  opacity: 1
};

const lotLayerById = new Map();
let lotGeoJsonLayer = null;
let mapInstance = null;

function buildApiUrl(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

function ensureMap() {
  if (mapInstance) return mapInstance;

  if (typeof L === 'undefined') {
    console.error('Leaflet not available; cannot render parking map.');
    return null;
  }

  const container = document.getElementById('map');
  if (!container) {
    console.warn('Map container "#map" not found; parking map skipped.');
    return null;
  }

  mapInstance = L.map(container, {
    preferCanvas: true // faster for many polygons
  }).setView(MAP_CENTER, MAP_ZOOM);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap & friends'
  }).addTo(mapInstance);

  return mapInstance;
}


//Helper functions
function clamp255(n) { return Math.max(0, Math.min(255, Math.round(n))); }

function fillToColor(fill, isEvent) {
  const red = clamp255(255 * fill);
  const green = clamp255(255 * (1 - fill));
  return isEvent ? 'rgb(255,0,0)' : `rgb(${red},0,${green})`;
}


/*Lot
  Desc: Class that will be used to store the needed information after being pulled from database
  Variables:
    _id(int) : the private lot ID 
    name (string) : the name of the parking lot
    capacity(int) : the capacity of the lot
    fill(float) : the percent filled of lot (between 0-1)
    location(geojson) : stores the polygon location information
    color(array) : the color based on the current fill of the parking lot
  
  Helpers:
    setColor() : sets the color based on the fill of the parking lot
  
*/
class Lot {
  constructor(lotId, lotName, lotCapacity, lotGeom, lotfill) {
    this._id = lotId;
    this.name = lotName;
    this.capacity = lotCapacity;
    this.fill = lotfill;
    this.geom = lotGeom
    //set color automatically
    this.color = this.setColor();
    this.event = false;
  }

  setColor() {
    // Assuming fill will be a number between 0 and 1
    //Red and green will be inversely proportional
    var red = 255 * this.fill;
    var green = 255 * (1 - this.fill);
    //set color of polygon for lot
    if (this.event == false){
      this.color = (red, 0, green);
    }
    if (this.event == true){
      this.color = (255, 0, 0);
    }
    return this.color
  }

  setEvent(bool){
    if (bool){
      this.event = bool;
      this.setColor();
    }
  }
}

/*getLots()
Desc: This will collect the information that is needed from the SQL database and return the lots 
        in and array.
Params: none
Returns: lots(array) - will return the array of the lots with the needed information
*/
async function getLots() {
  const resp = await fetch(buildApiUrl('/api/lots'), { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

function lotsToFeatureCollection(lots) {
  return {
    type: 'FeatureCollection',
    features: (lots ?? []).filter(d => d && d.geom).map(d => ({
      type: 'Feature',
      geometry: d.geom, // <- your DB-provided GeoJSON geometry
      properties: {
        lotId: String(d.id),
        name: d.name ?? `Lot ${d.id}`,
        capacity: d.capacity ?? null,
        fill: Number(d.fill ?? 0),
        event: Boolean(d.event)
      }
    }))
  };
}

function paintLayerFromProps(layer, props) {
  const color = fillToColor(props.fill, props.event);
  layer.setStyle({ fillColor: color, color: color, weight: 1, fillOpacity: 0.7, opacity: 1 });

  const pct = isFinite(props.fill) ? Math.round(props.fill * 100) : 0;
  const cap = props.capacity ?? '?';
  const badge = props.event ? ' • Event' : '';
  layer.bindTooltip(`${props.name}${badge}\n${pct}% full (${cap} cap)`, { sticky: true });
}

// First-time build of the layer and the id->layer map
function buildGeoJsonLayer(featureCollection) {
  const map = ensureMap();
  if (!map) return;

  lotLayerById.clear();
  lotGeoJsonLayer = L.geoJSON(featureCollection, {
    style: DEFAULT_STYLE,
    onEachFeature: (feature, layer) => {
      const id = feature.properties.lotId;
      lotLayerById.set(id, layer);

      // hover highlight (optional)
      layer.on('mouseover', () => layer.setStyle({ weight: 2 }));
      layer.on('mouseout', () => layer.setStyle({ weight: 1 }));

      paintLayerFromProps(layer, feature.properties);
    }
  }).addTo(map);

  const bounds = lotGeoJsonLayer.getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [20, 20] });
  }
}

// If a new lot appears, add it; if one disappears, gray it out.
function refreshStyles(featureCollection) {
  const map = ensureMap();
  if (!map) return;

  const seen = new Set();

  const features = featureCollection?.features ?? [];

  for (const feature of features) {
    const id = feature.properties.lotId;
    let layer = lotLayerById.get(id);

    if (layer) {
      // update existing
      paintLayerFromProps(layer, feature.properties);
    } else {
      // brand new lot—add it and track
      const group = L.geoJSON(feature, { style: DEFAULT_STYLE }).addTo(map);
      const newLayer = group.getLayers()[0] ?? group;
      lotLayerById.set(id, newLayer);
      paintLayerFromProps(newLayer, feature.properties);
    }
    seen.add(id);
  }

  // Any polygon we didn’t see this cycle gets greyed out
  for (const [id, layer] of lotLayerById.entries()) {
    if (!seen.has(id)) layer.setStyle(DEFAULT_STYLE);
  }
}
async function main() {
  try {
    if (!ensureMap()) return;

    const lots = await getLots();
    const fc = lotsToFeatureCollection(lots);

    if (!lotGeoJsonLayer) {
      buildGeoJsonLayer(fc);     // first run
    } else {
      refreshStyles(fc);         // subsequent runs
    }
  } catch (e) {
    console.error('Failed to load/paint lots:', e);
  }
}

//Set to refresh ever N seconds
function boot() {
  if (!ensureMap()) return;

  main();
  setInterval(main, REFRESH_INTERVAL_MS);
}
document.addEventListener('DOMContentLoaded', boot);
