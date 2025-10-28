Parking DB module

This workspace adds a small SQLite-backed parking database and utility functions to list parking lots and pick the best lot by occupancy.

Files added:
- `apps/api/models/parking_db.js` - main DB class with init, listParking, getBestParking and CRUD for fulfillment
- `apps/api/models/init_db.js` - example script to initialize and seed the DB and print a sample listing
- `package.json` - includes sqlite3 dependency and `init-db` script

How to run (Windows PowerShell):

1. Install dependencies:

   npm install

2. Initialize DB and see sample output:

   npm run init-db

This will create `apps/data/parking.db` and seed parking lots AA, QQ, KK, GG with capacities 50,100,200,300.

API (programmatic):

Use `const ParkingDB = require('./apps/api/models/parking_db');` then create `new ParkingDB(dbFile)` and call `init()`, `listParking(day,hour)`, `getBestParking(day,hour)`, and fulfillment CRUD methods: `createFulfillment`, `readFulfillment`, `updateFulfillment`, `deleteFulfillment`.

Seeding sample fulfillment data (recommended for testing)

1. After installing dependencies and running `npm run init-db`, run:

   npm run seed-db

2. This will insert example occupied values for `monday` hour `9` so `main.js` and `listParking('monday',9)` will show a meaningful ordering.

