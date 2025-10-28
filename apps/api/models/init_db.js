const path = require('path');
const ParkingDB = require('./parking_db');

async function main() {
  const dbFile = path.join(__dirname, '..', '..', 'data', 'parking.db');
  const pdb = new ParkingDB(dbFile);
  console.log('Initializing DB and seeding parking lots...');
  await pdb.init(true);
  console.log('DB initialized. Sample listing for monday 9:');
  const list = await pdb.listParking('monday', 9);
  console.log(JSON.stringify(list, null, 2));
  const best = await pdb.getBestParking('monday', 9);
  console.log('Best parking lot:', JSON.stringify(best, null, 2));
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
