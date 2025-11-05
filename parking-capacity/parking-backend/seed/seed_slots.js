// seed/seed_slots.js (New Script)
import fs from 'fs';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// Adjust path to your slots.json location
const SLOTS_JSON = path.resolve('./data/slots.json'); 

async function seedSlots() {
  const data = JSON.parse(fs.readFileSync(SLOTS_JSON, 'utf8'));
  const client = await pool.connect();
  try {
    console.log('Starting slots seed...');
    
    for (const lotCode of Object.keys(data)) {
      const lotData = data[lotCode];
      const lotCapacity = Number(lotData.capacity);
      const slots = lotData.slots || {};
      
      for (const day of Object.keys(slots)) {
        const hours = slots[day] || {};
        
        for (const hourStr of Object.keys(hours)) {
          const slotEntry = hours[hourStr];
          const hour = Number(hourStr);
          const occupied = Number(slotEntry.occupied);

          await client.query(
            `INSERT INTO slots (parking_lot_id, day, hour, capacity, occupied)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (parking_lot_id, day, hour) DO UPDATE SET
               capacity = EXCLUDED.capacity,
               occupied = EXCLUDED.occupied;`,
            [lotCode, day, hour, lotCapacity, occupied]
          );
        }
      }
      console.log(`Seeded slots for lot: ${lotCode}`);
    }
    console.log('Slots seeding complete.');

  } catch (e) {
    console.error('Error seeding slots:', e);
  } finally {
    client.release();
    pool.end();
  }
}

seedSlots();