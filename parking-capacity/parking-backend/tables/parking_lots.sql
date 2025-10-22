CREATE TABLE parking_lots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  geometry JSONB NOT NULL,
  capacity INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
