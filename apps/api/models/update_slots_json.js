#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SLOTS_PATH = path.join(__dirname, '..', '..', 'data', 'slots.json');

function usage() {
  console.log('update_slots_json.js - safely update a single slot in apps/data/slots.json');
  console.log('Usage: node update_slots_json.js <LOT_CODE> <day> <hour> <occupied> [--db]');
  console.log('  LOT_CODE  e.g. AA');
  console.log('  day       monday|tuesday|wednesday|thursday|friday');
  console.log('  hour      hour number e.g. 7 or 07 (07..17 expected)');
  console.log('  occupied  integer (will be clamped between 0 and capacity if --db is used)');
  console.log('  --db      optional: also update the SQLite slots table using ParkingDB.setSlotOccupied (requires sqlite3)');
}

function backupFile(filePath) {
  const when = new Date().toISOString().replace(/[:.]/g, '-');
  const bak = `${filePath}.bak.${when}`;
  fs.copyFileSync(filePath, bak);
  return bak;
}

function padHour(h) {
  const n = Number(h);
  if (Number.isNaN(n)) return null;
  return String(n).padStart(2, '0');
}

async function maybeUpdateDB(lot, day, hourNum, occupied) {
  try {
    const ParkingDB = require('./parking_db');
    const pdb = new ParkingDB();
    // setSlotOccupied will clamp to capacity by default
    const updated = await pdb.setSlotOccupied(lot, day, hourNum, occupied, { clamp: true });
    return { ok: true, updated };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === 'help' || argv[0] === '--help' || argv[0] === '-h') {
    usage();
    return;
  }

  const lot = argv[0];
  const day = String(argv[1] || '').toLowerCase();
  const hourRaw = argv[2];
  const occupiedRaw = argv[3];
  const useDb = argv.includes('--db');

  if (!lot || !day || hourRaw === undefined || occupiedRaw === undefined) {
    console.error('Missing args'); usage(); process.exit(1);
  }

  const hourKey = padHour(hourRaw);
  if (!hourKey) { console.error('Invalid hour'); process.exit(1); }
  const hourNum = Number(hourRaw);
  let occupied = Number(occupiedRaw);
  if (!Number.isFinite(occupied)) { console.error('Invalid occupied'); process.exit(1); }

  if (!fs.existsSync(SLOTS_PATH)) {
    console.error('slots.json not found at', SLOTS_PATH); process.exit(1);
  }

  const raw = fs.readFileSync(SLOTS_PATH, 'utf8');
  let obj;
  try { obj = JSON.parse(raw); } catch (e) { console.error('Error parsing slots.json:', e.message || e); process.exit(1); }

  const lotObj = obj[lot];
  if (!lotObj) { console.error('Lot code not found in JSON:', lot); process.exit(1); }
  const capacity = Number(lotObj.capacity || 0);
  const slots = lotObj.slots || {};
  const daySlots = slots[day];
  if (!daySlots) { console.error('Day not found in JSON for this lot:', day); process.exit(1); }
  const slotEntry = daySlots[hourKey];
  if (!slotEntry) { console.error('Hour key not found in JSON for this day:', hourKey); process.exit(1); }

  // backup first
  const bak = backupFile(SLOTS_PATH);

  // clamp occupied to [0, capacity]
  if (occupied < 0) occupied = 0;
  if (capacity > 0 && occupied > capacity) occupied = capacity;

  // apply change
  daySlots[hourKey].occupied = occupied;

  // write file prettily
  fs.writeFileSync(SLOTS_PATH, JSON.stringify(obj, null, 2), 'utf8');
  console.log(`Updated ${lot} ${day} ${hourKey}: occupied=${occupied} (backup: ${bak})`);

  if (useDb) {
    const r = await maybeUpdateDB(lot, day, hourNum, occupied);
    if (!r.ok) console.error('DB update failed:', r.error); else console.log('DB slots table updated.');
  }
}

main().catch(err => { console.error('Error:', err && err.message ? err.message : err); process.exit(1); });
