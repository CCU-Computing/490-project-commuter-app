CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS transit;
SET search_path = transit, public;

CREATE TABLE IF NOT EXISTS routes (
  route_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  geom       geometry(MultiLineString,4326) NOT NULL
);

CREATE TABLE IF NOT EXISTS stops (
  stop_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  geom       geometry(Point,4326) NOT NULL
);

CREATE TABLE IF NOT EXISTS route_stops (
  route_id UUID REFERENCES routes(route_id) ON DELETE CASCADE,
  stop_id  UUID REFERENCES stops(stop_id)   ON DELETE CASCADE,
  seq      INTEGER NOT NULL,
  PRIMARY KEY(route_id, stop_id)
);
