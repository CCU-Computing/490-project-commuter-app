CREATE TABLE parking_lot_fulfillment (
  id SERIAL PRIMARY KEY,
  parking_lot_id TEXT REFERENCES parking_lots(id) ON DELETE CASCADE,
  fulfillment FLOAT NOT NULL CHECK (fulfillment >= 0 AND fulfillment <= 1),
  special_event BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW()
);
