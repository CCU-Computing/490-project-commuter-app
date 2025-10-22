// seed/seed_geojson.js
import fs from 'fs';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const data = JSON.parse(fs.readFileSync('./data/ParkingLots.geojson', 'utf8'));
  for (const feat of data.features) {
    const id = feat.properties.id;
    const name = feat.properties.name || id;
    const geometry = JSON.stringify(feat.geometry);
    await pool.query(`
      INSERT INTO parking_lots (id, name, geometry)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, geometry = EXCLUDED.geometry;
    `, [id, name, geometry]);
    console.log('Upserted lot', id);
  }
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
