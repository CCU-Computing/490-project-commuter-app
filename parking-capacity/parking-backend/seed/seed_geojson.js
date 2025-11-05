// seed/seed_geojson.js (Updated Version)
import fs from 'fs';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// **NOTE: You must define the capacities for all your lots here**
const lotCapacities = {
    "AA": 50,
    "QQ": 100,
    "KK": 200,
    "GG": 300,
    "BBB": 150, // Example: Add capacity for other lots
    "CP": 40,   // Example: Add capacity for other lots
    "DDD": 75,  // Example: Add capacity for other lots
    "FFF": 30,  // Example: Add capacity for other lots
    "HHH": 60,  // Example: Add capacity for other lots
    "WW": 35,   // Example: Add capacity for other lots
    "YY": 80,   // Example: Add capacity for other lots
};

async function main() {
  const data = JSON.parse(fs.readFileSync('./data/ParkingLots.geojson', 'utf8'));
  for (const feat of data.features) {
    const id = feat.properties.id;
    const name = feat.properties.name || id;
    const geometry = JSON.stringify(feat.geometry);
    const capacity = lotCapacities[id] || null; // Get capacity from map

    await pool.query(
      `INSERT INTO parking_lots (id, name, geometry, capacity)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        geometry = EXCLUDED.geometry,
        capacity = EXCLUDED.capacity;`,
      [id, name, geometry, capacity]
    );
    console.log('Upserted lot', id);
  }
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });