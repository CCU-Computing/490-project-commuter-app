-- database.sql
-- Combined schema for PostgreSQL

-- Parking Lots Table: Includes capacity column needed for new logic
CREATE TABLE IF NOT EXISTS parking_lots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  geometry JSONB NOT NULL,
  capacity INTEGER, -- Now explicitly confirmed/used for capacity tracking
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fulfillment Table (Your original table: Real-time/Special Event fulfillment)
CREATE TABLE IF NOT EXISTS parking_lot_fulfillment (
  id SERIAL PRIMARY KEY,
  parking_lot_id TEXT REFERENCES parking_lots(id) ON DELETE CASCADE,
  fulfillment FLOAT NOT NULL CHECK (fulfillment >= 0 AND fulfillment <= 1),
  special_event BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Slots Table (New table: Historical/Predicted occupancy)
CREATE TABLE IF NOT EXISTS slots (
    id SERIAL PRIMARY KEY,
    parking_lot_id TEXT NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
    day TEXT NOT NULL, -- e.g., 'monday', 'tuesday'
    hour INTEGER NOT NULL, -- 0-23
    capacity INTEGER NOT NULL,
    occupied INTEGER NOT NULL DEFAULT 0,
    UNIQUE(parking_lot_id, day, hour)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pl_ful_lot ON parking_lot_fulfillment(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_pl_ful_time ON parking_lot_fulfillment(timestamp);
CREATE INDEX IF NOT EXISTS idx_slots_lot_day_hour ON slots(parking_lot_id, day, hour);