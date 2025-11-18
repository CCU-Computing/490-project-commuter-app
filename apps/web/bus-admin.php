<?php include "commheader.php"; ?>

<main class="container mb-5">
  <section class="mb-4">
    <h2>Bus Routes & Stops – Faculty Admin</h2>
    <p>
      Maintain bus routes and stops here. You can draw/edit route lines,
      create/edit/delete stops, and assign stops to routes.
    </p>
  </section>

  <section class="row mb-4">
    <!-- LEFT COLUMN: ROUTE + STOP FORMS -->
    <div class="col-md-4">

      <!-- ROUTES CARD -->
      <div class="card mb-3">
        <div class="card-body">
          <h5 class="card-title">Routes</h5>

          <table class="table table-sm table-hover mb-2 small">
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody id="routes-body">
              <tr><td colspan="3">Loading routes...</td></tr>
            </tbody>
          </table>

          <form id="route-form" class="small">
            <input type="hidden" id="route-id">

            <div class="mb-2">
              <label for="route-name" class="form-label">Name</label>
              <input type="text" id="route-name" class="form-control form-control-sm">
            </div>

            <div class="mb-2">
              <label for="route-code" class="form-label">Code</label>
              <input type="text" id="route-code" class="form-control form-control-sm">
            </div>

            <div class="mb-2">
              <label for="route-color" class="form-label">Color (hex)</label>
              <input type="text" id="route-color" class="form-control form-control-sm"
                     placeholder="#2980b9">
              <div class="form-text">
                Used to color the route line on the map (e.g. <code>#2980b9</code>).
              </div>
            </div>

            <div class="d-flex gap-2 mb-2">
              <button type="button" id="btn-route-new"
                      class="btn btn-outline-secondary btn-sm">New</button>
              <button type="button" id="btn-route-save"
                      class="btn btn-primary btn-sm">Save</button>
              <button type="button" id="btn-route-delete"
                      class="btn btn-outline-danger btn-sm">Delete</button>
            </div>

            <p class="small text-muted mb-0">
              Draw or edit the route line on the map using the toolbar,
              then click Save to store the geometry.
            </p>

            <div id="route-status" class="small mt-2"></div>
          </form>
        </div>
      </div>

      <!-- STOPS CARD -->
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Stops</h5>
          <p class="small text-muted">
            Click a stop marker to edit it. Click on empty map to set
            coordinates for a new stop, then Save.
          </p>

          <form id="stop-form" class="small">
            <input type="hidden" id="stop-id">

            <div class="mb-2">
              <label for="stop-name" class="form-label">Name</label>
              <input type="text" id="stop-name"
                     class="form-control form-control-sm">
            </div>

            <div class="mb-2">
              <label for="stop-code" class="form-label">Code</label>
              <input type="text" id="stop-code"
                     class="form-control form-control-sm">
            </div>

            <div class="mb-2">
              <label for="stop-direction" class="form-label">Direction</label>
              <input type="text" id="stop-direction"
                     class="form-control form-control-sm"
                     placeholder="Inbound / Outbound / N / S / E / W">
            </div>

            <div class="form-check mb-1">
              <input class="form-check-input" type="checkbox" id="stop-accessible">
              <label class="form-check-label" for="stop-accessible">
                Accessible
              </label>
            </div>

            <div class="form-check mb-2">
              <input class="form-check-input" type="checkbox" id="stop-shelter">
              <label class="form-check-label" for="stop-shelter">
                Shelter
              </label>
            </div>

            <div class="mb-2">
              <label class="form-label">Location</label>
              <input type="text" id="stop-latlng"
                     class="form-control form-control-sm" readonly>
              <div class="form-text">
                Coordinates are set from the map (click to move).
              </div>
            </div>

            <div class="d-flex gap-2 mb-2">
              <button type="button" id="btn-stop-new"
                      class="btn btn-outline-secondary btn-sm">New</button>
              <button type="button" id="btn-stop-save"
                      class="btn btn-primary btn-sm">Save</button>
              <button type="button" id="btn-stop-delete"
                      class="btn btn-outline-danger btn-sm">Delete</button>
            </div>

            <hr>

            <h6>Assign to Route</h6>
            <div class="mb-2">
              <label for="route-select" class="form-label">Route</label>
              <select id="route-select" class="form-select form-select-sm">
                <option value="">(None selected)</option>
              </select>
            </div>

            <div class="mb-2">
              <label for="stop-seq" class="form-label">Sequence #</label>
              <input type="number" id="stop-seq"
                     class="form-control form-control-sm" min="1" step="1">
            </div>

            <div class="d-flex gap-2">
              <button type="button" id="btn-add-to-route"
                      class="btn btn-success btn-sm">Add / Update on Route</button>
              <button type="button" id="btn-remove-from-route"
                      class="btn btn-outline-secondary btn-sm">Remove from Route</button>
            </div>

            <div id="stop-status" class="small mt-2"></div>
          </form>
        </div>
      </div>
    </div>

    <!-- RIGHT COLUMN: MAP -->
    <div class="col-md-8">
      <section class="mb-4">
        <h3>Bus Network Map</h3>
        <p class="small text-muted">
          Routes are colored lines. Use the draw toolbar to create/edit them.
          Stops are teal circles. Click to edit, or click on the map to place a new stop.
        </p>
        <div id="bus-map" class="border rounded" style="height: 540px;"></div>
      </section>
    </div>
  </section>
</main>


<script>
const API_BASE = "http://localhost:3000";

let busMap;
let routesLayer;
let stopsLayer;
let routeStopsLayer;
let currentRouteId = null;
const stopMarkersById = {};

let routesFC = null;

// Leaflet.draw related
let editableRouteGroup;
let drawControl;
let drawnRouteLayer = null;
let currentRouteGeometryGeoJSON = null;

// DOM refs
const routesBody        = document.getElementById("routes-body");
const routeForm         = document.getElementById("route-form");
const routeIdInput      = document.getElementById("route-id");
const routeNameInput    = document.getElementById("route-name");
const routeCodeInput    = document.getElementById("route-code");
const routeColorInput   = document.getElementById("route-color");
const routeStatus       = document.getElementById("route-status");
const btnRouteNew       = document.getElementById("btn-route-new");
const btnRouteSave      = document.getElementById("btn-route-save");
const btnRouteDelete    = document.getElementById("btn-route-delete");

const stopForm          = document.getElementById("stop-form");
const stopIdInput       = document.getElementById("stop-id");
const stopNameInput     = document.getElementById("stop-name");
const stopCodeInput     = document.getElementById("stop-code");
const stopDirInput      = document.getElementById("stop-direction");
const stopAccessible    = document.getElementById("stop-accessible");
const stopShelter       = document.getElementById("stop-shelter");
const stopLatLngInput   = document.getElementById("stop-latlng");
const stopSeqInput      = document.getElementById("stop-seq");
const routeSelect       = document.getElementById("route-select");
const stopStatus        = document.getElementById("stop-status");
const btnStopNew        = document.getElementById("btn-stop-new");
const btnStopSave       = document.getElementById("btn-stop-save");
const btnStopDelete     = document.getElementById("btn-stop-delete");
const btnAddToRoute     = document.getElementById("btn-add-to-route");
const btnRemoveFromRoute= document.getElementById("btn-remove-from-route");

/* ---------- MAP + DRAWING ---------- */

function initMap() {
  if (busMap) return;
  busMap = L.map("bus-map").setView([33.793, -79.012], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(busMap);

  // FeatureGroup that Leaflet.draw will edit
  editableRouteGroup = new L.FeatureGroup();
  busMap.addLayer(editableRouteGroup);

  // Drawing / editing toolbar (only polylines)
  drawControl = new L.Control.Draw({
    edit: {
      featureGroup: editableRouteGroup,
      edit: true,
      remove: true
    },
    draw: {
      polyline: {
        shapeOptions: { weight: 4 }
      },
      polygon: false,
      rectangle: false,
      circle: false,
      marker: false,
      circlemarker: false
    }
  });
  busMap.addControl(drawControl);

  // Map click sets coordinates for stop (new or existing)
  busMap.on("click", e => {
    const { lat, lng } = e.latlng;
    stopLatLngInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  });

  // New line drawn
  busMap.on(L.Draw.Event.CREATED, e => {
    const { layerType, layer } = e;
    if (layerType === "polyline") {
      if (drawnRouteLayer) editableRouteGroup.removeLayer(drawnRouteLayer);
      drawnRouteLayer = layer;
      editableRouteGroup.addLayer(layer);
      updateRouteGeometryFromLayer();
    }
  });

  // Existing line edited
  busMap.on("draw:edited", e => {
    if (!drawnRouteLayer) return;
    updateRouteGeometryFromLayer();
  });

  // Line deleted
  busMap.on("draw:deleted", e => {
    drawnRouteLayer = null;
    currentRouteGeometryGeoJSON = null;
    routeStatus.textContent = "Route geometry cleared. Save to persist.";
    routeStatus.className = "small text-warning";
  });
}

function updateRouteGeometryFromLayer() {
  if (!drawnRouteLayer) return;
  const latlngs = drawnRouteLayer.getLatLngs();
  const coords = latlngs.map(ll => [ll.lng, ll.lat]); // GeoJSON order
  currentRouteGeometryGeoJSON = {
    type: "LineString",
    coordinates: coords
  };
  routeStatus.textContent =
    `Route geometry set with ${coords.length} points. Click Save to store it.`;
  routeStatus.className = "small text-success";
}

/* ---------- LOAD ROUTES ---------- */

async function loadRoutes() {
  try {
    const res = await fetch(`${API_BASE}/routes`);
    if (!res.ok) throw new Error("routes status " + res.status);
    const fc = await res.json();
    routesFC = fc;

    initMap();

    if (routesLayer) busMap.removeLayer(routesLayer);

    routesLayer = L.geoJSON(fc, {
      style: feature => {
        const p = feature.properties || {};
        const color = p.color_hex || "#2980b9";
        return { color, weight: 4, opacity: 0.8 };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const rid = p.route_id || feature.id;
        layer.on("click", () => {
          selectRouteFeature(feature);
        });
        layer.bindPopup(
          `<strong>${p.name || "Route"}</strong><br>Code: ${p.code || ""}`
        );
      }
    }).addTo(busMap);

    // table + dropdown
    const feats = fc.features || [];

    routesBody.innerHTML = feats.length
      ? feats.map(f => {
          const p = f.properties || {};
          const rid = p.route_id || f.id;
          return `
            <tr data-route-id="${rid}">
              <td>${rid}</td>
              <td>${p.code || ""}</td>
              <td>${p.name || ""}</td>
            </tr>`;
        }).join("")
      : '<tr><td colspan="3">No routes yet.</td></tr>';

    routesBody.querySelectorAll("tr[data-route-id]").forEach(tr => {
      tr.addEventListener("click", () => {
        const rid = tr.getAttribute("data-route-id");
        const feat = feats.find(f => {
          const p = f.properties || {};
          return String(p.route_id || f.id) === String(rid);
        });
        if (feat) selectRouteFeature(feat);
      });
    });

    routeSelect.innerHTML =
      '<option value="">(None selected)</option>' +
      feats.map(f => {
        const p = f.properties || {};
        const rid = p.route_id || f.id;
        return `<option value="${rid}">${p.name || p.code || "Route " + rid}</option>`;
      }).join("");

    updateRouteHighlight();
  } catch (err) {
    console.error("loadRoutes error", err);
    routesBody.innerHTML =
      '<tr><td colspan="3" class="text-danger">Error loading routes.</td></tr>';
  }
}

function selectRouteFeature(feature) {
  const p = feature.properties || {};
  const rid = p.route_id || feature.id;

  routeIdInput.value    = rid || "";
  routeNameInput.value  = p.name || "";
  routeCodeInput.value  = p.code || "";
  routeColorInput.value = p.color_hex || "";
  routeStatus.textContent = "";
  routeStatus.className = "small";

  currentRouteId = rid || null;

  // Clear existing editable line
  if (drawnRouteLayer && editableRouteGroup) {
    editableRouteGroup.removeLayer(drawnRouteLayer);
    drawnRouteLayer = null;
  }

  // Load geometry into editable layer (if present)
  if (feature.geometry && feature.geometry.type === "LineString") {
    const latlngs = feature.geometry.coordinates.map(([lng, lat]) =>
      L.latLng(lat, lng)
    );
    drawnRouteLayer = L.polyline(latlngs, { weight: 4 });
    editableRouteGroup.addLayer(drawnRouteLayer);
    currentRouteGeometryGeoJSON = feature.geometry;
  } else {
    currentRouteGeometryGeoJSON = null;
  }

  if (currentRouteId) {
    routeSelect.value = String(currentRouteId);
    loadRouteStops(currentRouteId);
  }
  updateRouteHighlight();
}

function updateRouteHighlight() {
  if (!routesLayer) return;
  routesLayer.eachLayer(layer => {
    const p = layer.feature?.properties || {};
    const rid = p.route_id || layer.feature.id;
    const active = currentRouteId && String(rid) === String(currentRouteId);
    layer.setStyle({
      weight: active ? 6 : 3,
      opacity: active ? 1.0 : 0.3
    });
  });
}

// When dropdown route changes manually, select route as well
routeSelect.addEventListener("change", () => {
  const rid = routeSelect.value || null;
  if (!rid || !routesFC) {
    currentRouteId = null;
    updateRouteHighlight();
    return;
  }
  const feat = (routesFC.features || []).find(f => {
    const p = f.properties || {};
    return String(p.route_id || f.id) === String(rid);
  });
  if (feat) selectRouteFeature(feat);
});

/* ---------- LOAD STOPS ---------- */

async function loadStops() {
  try {
    const res = await fetch(`${API_BASE}/stops`);
    if (!res.ok) throw new Error("stops status " + res.status);
    const fc = await res.json();

    initMap();

    if (stopsLayer) busMap.removeLayer(stopsLayer);
    Object.keys(stopMarkersById).forEach(k => delete stopMarkersById[k]);

    stopsLayer = L.geoJSON(fc, {
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 5,
          color: "#34495e",
          fillColor: "#1abc9c",
          fillOpacity: 0.9,
          weight: 1
        });
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const id = p.stop_id || feature.id;
        if (id != null) stopMarkersById[id] = layer;

        layer.on("click", () => {
          selectStopFromFeature(feature, layer);
        });

        layer.bindPopup(`
          <strong>${p.name || "Stop"}</strong><br>
          Code: ${p.code || ""}<br>
          Direction: ${p.direction || ""}<br>
          Accessible: ${p.accessible ? "Yes" : "No"}<br>
          Shelter: ${p.shelter ? "Yes" : "No"}
        `);
      }
    }).addTo(busMap);
  } catch (err) {
    console.error("loadStops error", err);
  }
}

function selectStopFromFeature(feature, layer) {
  const p = feature.properties || {};
  const id = p.stop_id || feature.id;
  stopIdInput.value = id || "";
  stopNameInput.value = p.name || "";
  stopCodeInput.value = p.code || "";
  stopDirInput.value = p.direction || "";
  stopAccessible.checked = !!p.accessible;
  stopShelter.checked = !!p.shelter;

  if (layer && layer.getLatLng) {
    const ll = layer.getLatLng();
    stopLatLngInput.value = `${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`;
  } else {
    stopLatLngInput.value = "";
  }
  stopStatus.textContent = "";
  stopStatus.className = "small";
}

/* ---------- LOAD ROUTE-STOPS FOR SELECTED ROUTE ---------- */

async function loadRouteStops(routeId) {
  try {
    const res = await fetch(`${API_BASE}/routes/${routeId}/stops`);
    if (!res.ok) throw new Error("routeStops status " + res.status);
    const fc = await res.json();

    if (routeStopsLayer) busMap.removeLayer(routeStopsLayer);

    routeStopsLayer = L.geoJSON(fc, {
      pointToLayer: (feature, latlng) => {
        const p = feature.properties || {};
        const seq = p.seq ?? "";
        return L.circleMarker(latlng, {
          radius: 6,
          color: "#e67e22",
          fillColor: "#f1c40f",
          fillOpacity: 0.9,
          weight: 2
        }).bindTooltip(String(seq), { permanent: true, direction: "center" });
      }
    }).addTo(busMap);
  } catch (err) {
    console.error("loadRouteStops error", err);
  }
}

/* ---------- ROUTE CRUD ---------- */

btnRouteNew.addEventListener("click", () => {
  routeForm.reset();
  routeIdInput.value = "";
  currentRouteId = null;
  currentRouteGeometryGeoJSON = null;

  if (drawnRouteLayer && editableRouteGroup) {
    editableRouteGroup.removeLayer(drawnRouteLayer);
    drawnRouteLayer = null;
  }

  routeStatus.textContent = "";
  routeStatus.className = "small";
  updateRouteHighlight();
});

btnRouteSave.addEventListener("click", async () => {
  const id = routeIdInput.value || null;
  const name = routeNameInput.value.trim();
  const code = routeCodeInput.value.trim() || null;
  const color_hex = routeColorInput.value.trim() || null;

  const payload = { name, code, color_hex };
  const geom = currentRouteGeometryGeoJSON;

  if (geom) {
    payload.geometry = geom; // GeoJSON LineString
  }

  try {
    let res;
    if (id) {
      // UPDATE existing route
      res = await fetch(`${API_BASE}/routes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      // CREATE new route – require geometry
      if (!payload.geometry) {
        routeStatus.textContent = "Draw the route line on the map first, then Save.";
        routeStatus.className = "small text-danger";
        return;
      }
      res = await fetch(`${API_BASE}/routes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error("route save error", res.status, errJson);
      throw new Error("bad route save status");
    }

    routeStatus.textContent = "Route saved.";
    routeStatus.className = "small text-success";
    await loadRoutes();
  } catch (err) {
    console.error(err);
    routeStatus.textContent = "Error saving route.";
    routeStatus.className = "small text-danger";
  }
});

btnRouteDelete.addEventListener("click", async () => {
  const id = routeIdInput.value;
  if (!id) return;
  if (!confirm("Delete this route?")) return;

  try {
    const res = await fetch(`${API_BASE}/routes/${id}`, {
      method: "DELETE"
    });
    if (!res.ok && res.status !== 204) throw new Error("bad route delete status");

    routeStatus.textContent = "Route deleted.";
    routeStatus.className = "small text-success";
    routeForm.reset();
    routeIdInput.value = "";
    currentRouteId = null;
    currentRouteGeometryGeoJSON = null;

    if (drawnRouteLayer && editableRouteGroup) {
      editableRouteGroup.removeLayer(drawnRouteLayer);
      drawnRouteLayer = null;
    }
    if (routeStopsLayer) {
      busMap.removeLayer(routeStopsLayer);
      routeStopsLayer = null;
    }

    await loadRoutes();
  } catch (err) {
    console.error(err);
    routeStatus.textContent = "Error deleting route.";
    routeStatus.className = "small text-danger";
  }
});

/* ---------- STOP CRUD ---------- */

btnStopNew.addEventListener("click", () => {
  stopForm.reset();
  stopIdInput.value = "";
  stopLatLngInput.value = "";
  stopStatus.textContent = "";
  stopStatus.className = "small";
});

btnStopSave.addEventListener("click", async () => {
  const id = stopIdInput.value || null;
  const name = stopNameInput.value.trim();
  const code = stopCodeInput.value.trim() || null;
  const direction = stopDirInput.value.trim() || null;
  const accessible = stopAccessible.checked;
  const shelter = stopShelter.checked;

  // parse lat,lng
  let geometry = null;
  if (stopLatLngInput.value) {
    const parts = stopLatLngInput.value.split(",");
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        geometry = { type: "Point", coordinates: [lng, lat] };
      }
    }
  }

  const payload = { name, code, direction, accessible, shelter };
  if (!id && !geometry) {
    stopStatus.textContent = "Click on the map to set coordinates for the new stop.";
    stopStatus.className = "small text-danger";
    return;
  }
  if (geometry) payload.geometry = geometry;

  try {
    let res;
    if (id) {
      res = await fetch(`${API_BASE}/stops/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(`${API_BASE}/stops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) throw new Error("stop save status " + res.status);

    stopStatus.textContent = "Stop saved.";
    stopStatus.className = "small text-success";
    await loadStops();
    if (currentRouteId) await loadRouteStops(currentRouteId);
  } catch (err) {
    console.error(err);
    stopStatus.textContent = "Error saving stop.";
    stopStatus.className = "small text-danger";
  }
});

btnStopDelete.addEventListener("click", async () => {
  const id = stopIdInput.value;
  if (!id) return;
  if (!confirm("Delete this stop? This will also remove it from all routes.")) return;

  try {
    const res = await fetch(`${API_BASE}/stops/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error("stop delete status " + res.status);

    stopStatus.textContent = "Stop deleted.";
    stopStatus.className = "small text-success";
    stopForm.reset();
    stopLatLngInput.value = "";
    await loadStops();
    if (currentRouteId) await loadRouteStops(currentRouteId);
  } catch (err) {
    console.error(err);
    stopStatus.textContent = "Error deleting stop.";
    stopStatus.className = "small text-danger";
  }
});

/* ---------- ROUTE–STOP LINKING ---------- */

btnAddToRoute.addEventListener("click", async () => {
  const rid = routeSelect.value;
  const sid = stopIdInput.value;
  const seq = Number(stopSeqInput.value);

  if (!rid) {
    stopStatus.textContent = "Select a route first.";
    stopStatus.className = "small text-danger";
    return;
  }
  if (!sid) {
    stopStatus.textContent = "Select a stop first (click on map).";
    stopStatus.className = "small text-danger";
    return;
  }
  if (!seq || Number.isNaN(seq)) {
    stopStatus.textContent = "Enter a sequence number.";
    stopStatus.className = "small text-danger";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/routes/${rid}/stops`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stop_id: Number(sid), seq })
    });
    if (!res.ok) throw new Error("route-stop status " + res.status);

    stopStatus.textContent = "Stop added/updated on route.";
    stopStatus.className = "small text-success";
    currentRouteId = rid;
    await loadRouteStops(rid);
    updateRouteHighlight();
  } catch (err) {
    console.error(err);
    stopStatus.textContent = "Error assigning stop to route.";
    stopStatus.className = "small text-danger";
  }
});

btnRemoveFromRoute.addEventListener("click", async () => {
  const rid = routeSelect.value;
  const sid = stopIdInput.value;
  if (!rid || !sid) {
    stopStatus.textContent = "Select a route and a stop first.";
    stopStatus.className = "small text-danger";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/routes/${rid}/stops/${sid}`, {
      method: "DELETE"
    });
    if (!res.ok && res.status !== 204) throw new Error("remove route-stop status " + res.status);

    stopStatus.textContent = "Stop removed from route.";
    stopStatus.className = "small text-success";
    await loadRouteStops(rid);
  } catch (err) {
    console.error(err);
    stopStatus.textContent = "Error removing stop from route.";
    stopStatus.className = "small text-danger";
  }
});

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  loadRoutes();
  loadStops();
});
</script>


<?php include "commfooter.php"; ?>
