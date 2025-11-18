-- 01_all_schemas.sql
-- One DB ("transit") with all schemas/tables used by your controllers.

CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================================
-- PUBLIC: student parking tables (parkingLots.controller + fulfillment.controller)
-- =====================================================================

CREATE TABLE IF NOT EXISTS parking_lots (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  capacity    INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parking_lot_fulfillment (
  id             SERIAL PRIMARY KEY,
  parking_lot_id INTEGER NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
  fulfillment    INTEGER NOT NULL CHECK (fulfillment >= 0 AND fulfillment <= 100),
  special_event  BOOLEAN NOT NULL DEFAULT FALSE,
  notes          TEXT,
  "timestamp"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_lot_time
  ON parking_lot_fulfillment (parking_lot_id, "timestamp" DESC);

-- =====================================================================
-- CCUPARKINGLOT schema (parkingLots.controller.importParkingLotsGeoJSON / parkingLotsGeoJSON)
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS ccuparkinglot;

CREATE TABLE IF NOT EXISTS ccuparkinglot.campuses (
  campus_id  SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ccuparkinglot.lots (
  lot_id       SERIAL PRIMARY KEY,
  campus_id    INTEGER NOT NULL REFERENCES ccuparkinglot.campuses(campus_id) ON DELETE CASCADE,
  code         TEXT NOT NULL,
  display_name TEXT NOT NULL,
  capacity     INTEGER,
  geom         geometry(Polygon, 4326),
  CONSTRAINT uq_ccu_lots_campus_code UNIQUE (campus_id, code)
);

CREATE TABLE IF NOT EXISTS ccuparkinglot.lot_usage_stats (
  usage_id       SERIAL PRIMARY KEY,
  lot_id         INTEGER NOT NULL REFERENCES ccuparkinglot.lots(lot_id) ON DELETE CASCADE,
  sample_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  occupied_count INTEGER NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccu_lus_lot_date
  ON ccuparkinglot.lot_usage_stats (lot_id, sample_date DESC);

-- =====================================================================
-- TRANSIT schema (routes.controller, stops.controller, routeStops.controller)
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS transit;

CREATE TABLE IF NOT EXISTS transit.routes (
  route_id   SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  code       TEXT,
  color_hex  TEXT,
  geom       geometry(MultiLineString, 4326)
);

CREATE TABLE IF NOT EXISTS transit.stops (
  stop_id     SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT,
  direction   TEXT,
  accessible  BOOLEAN NOT NULL DEFAULT FALSE,
  shelter     BOOLEAN NOT NULL DEFAULT FALSE,
  geom        geometry(Point, 4326) NOT NULL,
  geom_3857   geometry(Point, 3857)
);

CREATE TABLE IF NOT EXISTS transit.route_stops (
  route_id  INTEGER NOT NULL REFERENCES transit.routes(route_id) ON DELETE CASCADE,
  stop_id   INTEGER NOT NULL REFERENCES transit.stops(stop_id) ON DELETE CASCADE,
  seq       INTEGER NOT NULL,
  CONSTRAINT pk_route_stops PRIMARY KEY (route_id, stop_id)
);

CREATE INDEX IF NOT EXISTS idx_route_stops_route_seq
  ON transit.route_stops (route_id, seq);
