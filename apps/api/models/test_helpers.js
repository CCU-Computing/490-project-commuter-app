const ParkingDB = require('./parking_db');

// Test script: exercises helper functions as a user would.
// Usage: node test_helpers.js <lot_code> <day> <hour> <occupied>
// Example: node test_helpers.js AA monday 9 20

async function main() {
  const [,, lot_code, day, hourArg, occupiedArg] = process.argv;
  const dayArg = day || 'monday';
  const hour = Number(hourArg || 9);
  const occupied = Number(occupiedArg || 0);

  const pdb = new ParkingDB();
  await pdb.init(true);

  console.log('Setting slot occupied ->', { lot_code, day: dayArg, hour, occupied });
  const updated = await pdb.setSlotOccupied(lot_code, dayArg, hour, occupied, { clamp: true });
  console.log('Updated slot:', JSON.stringify(updated, null, 2));

  const slot = await pdb.getSlot(lot_code, dayArg, hour);
  console.log('Read slot:', JSON.stringify(slot, null, 2));

  const prob = await pdb.getAvailabilityProbability(lot_code, dayArg, hour);
  console.log('Availability probability for lot:', JSON.stringify(prob, null, 2));

  const overall = await pdb.getOverallAvailabilityProbability(dayArg, hour);
  console.log('Overall availability:', JSON.stringify(overall, null, 2));

  // list all lots for that time
  const list = await pdb.listParking(dayArg, hour);
  console.log('Full listing best->worst:', JSON.stringify(list, null, 2));
}

if (require.main === module) {
  main().catch(err => {
    console.error('Test error:', err && err.message ? err.message : err);
    process.exit(1);
  });
}
