(function () {
  "use strict";

  const DEFAULT_CENTER = [33.790, -79.001];
  const DEFAULT_ZOOM = 16;

  const map = L.map('map').setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const lotsLayer = L.geoJSON(null, {
    style: feature => lotStyle(feature),
    onEachFeature: (feature, layer) => bindLotPopup(layer)
  }).addTo(map);

  function colorFor(fill, capacity) {
    if (!Number.isFinite(capacity) || capacity <= 0) return '#7f8c8d';
    const r = fill / capacity;
    if (r < 0.5) return '#2ecc71';
    if (r < 0.8) return '#f1c40f';
    return '#e74c3c';
  }

  function lotStyle(feature) {
    const p = feature.properties || {};
    const color = colorFor(p.fill ?? 0, p.capacity ?? 0);
    return { color, weight: 2, fillColor: color, fillOpacity: 0.35 };
  }

  function bindLotPopup(layer) {
    const p = layer.feature.properties || {};
    const cap = p.capacity ?? 0;
    const fill = p.fill ?? 0;
    const pct = cap ? Math.round(100 * fill / cap) : 0;
    const name = p.name || layer.feature.id || 'Lot';
    const updated = p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—';
    layer.bindTooltip(`${name} — ${pct}%`, { sticky: true });
    layer.bindPopup(
      `<b>${name}</b><br/>
       Capacity: ${cap}<br/>
       Current fill: ${fill} (${pct}%)<br/>
       Updated: ${updated}`
    );
  }

  async function loadLots() {
    const r = await fetch('/api/lots', { cache: 'no-store' });
    const gj = await r.json();
    lotsLayer.clearLayers();
    lotsLayer.addData(gj);
    try { map.fitBounds(lotsLayer.getBounds()); } catch (e) { }
  }

  async function refreshLots() {
    try {
      const r = await fetch('/api/lots', { cache: 'no-store' });
      const gj = await r.json();
      const byId = new Map(gj.features.map(f => [String(f.id), f]));
      lotsLayer.eachLayer(layer => {
        const id = String(layer.feature.id);
        const f = byId.get(id);
        if (f) {
          layer.feature.properties = f.properties;
          layer.setStyle(lotStyle(f));
          bindLotPopup(layer);
          byId.delete(id);
        }
      });
      byId.forEach(f => lotsLayer.addData(f));
    } catch (e) {
      console.warn('refresh failed', e);
    }
  }

  loadLots();
  setInterval(refreshLots, 15000);

})();