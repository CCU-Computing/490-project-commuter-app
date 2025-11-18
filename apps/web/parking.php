<?php include "commheader.php"; ?>
<main class="container mb-5">

	<section class="mb-4">
		<h2>Parking Statuses</h2>
		<p>
			Below you can see an interactive map showing the status of each
			CCU parking lot. Bus routes are included as well.
		</p>
	</section>

	<section class="mb-4">
		<h2>Select A Parking Lot</h2>
		<p>
			Use the dropdown menu to see a specific parking lot's data.<br>
			To see a map of campus, click here:
			<a href="https://www.coastal.edu/map/" target="_blank">Campus Map</a>
		</p>

		<div class="row g-3 align-items-center mb-3">
			<div class="col-sm-6 col-md-4">
				<label for="lot" class="form-label">Parking Lot</label>
				<?php include "dropdown.php"; ?>
			</div>
			<div class="col-sm-6 col-md-8">
				<div class="card">
					<div class="card-body">
						<h5 class="card-title mb-2">Selected Lot Status</h5>
						<p id="lot-summary" class="mb-1">
							Select a lot to view current status.
						</p>
						<ul id="lot-details" class="mb-0 small">
							<!-- Populated by JS -->
						</ul>
					</div>
				</div>
			</div>
		</div>

		<div class="card mt-3">
			<div class="card-body">
				<h5 class="card-title mb-2">Best Lot for You Right Now</h5>
				<p id="best-lot" class="mb-0">
					Loading best lot suggestion...
				</p>
			</div>
		</div>
	</section>

	<section class="mb-4">
		<h2>Campus Map</h2>
		<p>
			This map will show lots colored by fulfillment and bus routes. 
		</p>
		<div id="map" class="border rounded" style="height: 420px;">
			<!-- Initialize with Leaflet or other lib in a separate JS file if you want -->
		</div>
	</section>

</main>

<script>
const API_BASE   = 'http://localhost:3000';
const lotSelect  = document.getElementById('lot');
const lotSummary = document.getElementById('lot-summary');
const lotDetails = document.getElementById('lot-details');
const bestLotEl  = document.getElementById('best-lot');

let lotsFC   = null; // FeatureCollection from /parking-lots
let map      = null;
let lotsLayer, routesLayer, stopsLayer;
let lotLayersByCode = {};

// ========= Map helpers =========

function initMap() {
  if (map) return;
  // Rough center on CCU campus, adjust if needed
  map = L.map('map').setView([33.793, -79.012], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

function fulfillmentColor(f) {
  // f is 0..1 from DB
  if (f == null) return '#999999';
  if (f < 0.5)   return '#2ecc71';
  if (f < 0.8)   return '#f1c40f';
  return '#e74c3c';
}

// ========= Lots (parking-lots controller) =========

async function loadLots() {
  try {
    const res = await fetch(`${API_BASE}/parking-lots/geojson`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    lotsFC = await res.json();

    initMap();

    if (lotsLayer) {
      map.removeLayer(lotsLayer);
      lotLayersByCode = {};
    }

// ...existing code...
    lotsLayer = L.geoJSON(lotsFC, {
      style: feature => {
        const p = feature.properties || {};
        // prefer occupied/capacity; fall back to fulfillment field
        const f = (p.capacity && p.capacity > 0)
          ? ((Number(p.occupied) || 0) / Number(p.capacity))
          : (p.fulfillment ?? 0);

        return {
          color: '#333333',
          weight: 1,
          fillColor: fulfillmentColor(f),
          fillOpacity: 0.7
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const f = (p.capacity && p.capacity > 0)
          ? ((Number(p.occupied) || 0) / Number(p.capacity))
          : (p.fulfillment ?? 0);
        const fulfillmentPct = Math.round(f * 100);

        const popupHtml = `
          <strong>${p.name || 'Lot'}</strong><br/>
          Code: ${p.code || ''}<br/>
          Capacity: ${p.capacity ?? 'n/a'}<br/>
          Occupied: ${p.occupied ?? 0}<br/>
          Fulfillment: ${fulfillmentPct}%
        `;
        layer.bindPopup(popupHtml);
        if (p.code) {
          lotLayersByCode[String(p.code).toLowerCase()] = layer;
        }
      }
    }).addTo(map);
// ...existing code...

    // Fit map to all lots
    const b = lotsLayer.getBounds();
    if (b.isValid()) {
      map.fitBounds(b.pad(0.1));
    }

    // ✅ compute and show best lot *after* lots are loaded
    updateBestLot();

  } catch (err) {
    console.error('Error loading /parking-lots:', err);
    lotSummary.textContent = 'Error loading lot data.';
    lotDetails.innerHTML   = '<li class="text-danger">Please try again in a moment.</li>';
  }
}

function updateBestLot() {
  if (!bestLotEl || !lotsFC || !Array.isArray(lotsFC.features)) return;

  let best = null;

  for (const feat of lotsFC.features) {
    const p = feat.properties || {};
    if (!p.capacity || p.capacity <= 0) continue;

    const f = (p.fulfillment ?? 0); // 0..1
    if (!best || f < best.f) {
      best = { f, p };
    }
  }

  if (!best) {
    bestLotEl.textContent = 'No lot data available.';
    return;
  }

  const pct = Math.round(best.f * 100);
  bestLotEl.textContent =
    `Best lot right now: ${best.p.name} (code ${best.p.code}) • ${pct}% full`;
}

// When user chooses a lot, pull it from lotsFC + highlight on map
lotSelect.addEventListener('change', () => {
  const code = lotSelect.value;
  if (!code || code === 'Select a parking lot' || !lotsFC) {
    lotSummary.textContent = 'Select a lot to view current status.';
    lotDetails.innerHTML = '';
    return;
  }

  const feat = lotsFC.features.find(
    f => f.properties && String(f.properties.code).toLowerCase() === code.toLowerCase()
  );

  if (!feat) {
    lotSummary.textContent = 'No data for this lot.';
    lotDetails.innerHTML = '';
    return;
  }

  const p = feat.properties;
  const fulfillmentPct = Math.round((p.fulfillment ?? 0) * 100);

  lotSummary.textContent = `${p.name} • ${fulfillmentPct}% full`;

  lotDetails.innerHTML = `
    <li>Code: ${p.code}</li>
    <li>Capacity: ${p.capacity ?? 'n/a'}</li>
    <li>Occupied (latest): ${p.occupied ?? 0}</li>
    <li>Fulfillment: ${fulfillmentPct}%</li>
  `;

  const layer = lotLayersByCode[code.toLowerCase()];
  if (layer && map) {
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }
    layer.openPopup();
  }
});

// ========= Routes (routes.controller.js) and Stops (stops.controller.js) stay as you had them =========
async function loadRoutes() {
  try {
    const res = await fetch(`${API_BASE}/routes`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const routesFC = await res.json();

    initMap();

    if (routesLayer) {
      map.removeLayer(routesLayer);
    }

    routesLayer = L.geoJSON(routesFC, {
      style: feature => {
        const p = feature.properties || {};
        const color = p.color_hex || '#2980b9';
        return {
          color,
          weight: 4,
          opacity: 0.8
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const name = p.name || 'Route';
        const code = p.code || '';
        layer.bindPopup(`<strong>${name}</strong><br/>Code: ${code}`);
      }
    }).addTo(map);
  } catch (err) {
    console.error('Error loading /routes:', err);
  }
}

// ========= Stops (stops.controller.js) =========
async function loadStops() {
  try {
    const res = await fetch(`${API_BASE}/stops`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const stopsFC = await res.json();

    initMap();

    if (stopsLayer) {
      map.removeLayer(stopsLayer);
    }

    stopsLayer = L.geoJSON(stopsFC, {
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 4,
          color: '#34495e',
          fillColor: '#1abc9c',
          fillOpacity: 0.9,
          weight: 1
        });
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const name = p.name || 'Stop';
        const code = p.code || '';
        const direction = p.direction || '';
        const accessible = p.accessible ? 'Yes' : 'No';
        const shelter = p.shelter ? 'Yes' : 'No';

        layer.bindPopup(`
          <strong>${name}</strong><br/>
          Code: ${code}<br/>
          Direction: ${direction}<br/>
          Accessible: ${accessible}<br/>
          Shelter: ${shelter}
        `);
      }
    }).addTo(map);

  } catch (err) {
    console.error('Error loading /stops:', err);
  }
}
// Init everything on page load
document.addEventListener('DOMContentLoaded', () => {
  loadLots();   // parking-lot polygons + dropdown data + best lot
  loadRoutes(); // bus routes
  loadStops();  // bus stops
});
</script>


<?php include "commfooter.php"; ?>
