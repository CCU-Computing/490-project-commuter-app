#!/usr/bin/env node
// Simple CLI for fulfillment CRUD using ParkingDB
// Usage: node fulfillment_cli.js <command> [args]
// Commands:
//   help
//   init
//   create <LOT_CODE> <day> <hour> <occupied>
//   read <id>
//   update <id> [occupied=<n>] [day=<day>] [hour=<h>]
//   delete <id>
//   list [day] [hour]

function printHelp() {
  console.log('Fulfillment CLI');
  console.log('Usage: node fulfillment_cli.js <command> [args]');
  console.log('Commands:');
  console.log('  help');
  console.log('  init                             Initialize DB and seed parking lots/slots');
  console.log('  create <LOT_CODE> <day> <hour> <occupied>');
  console.log('  read <id>');
  console.log('  update <id> [occupied=<n>] [day=<day>] [hour=<h>]');
  console.log('  delete <id>');
  console.log('  list [day] [hour]                List fulfillment rows (optional filter)');
}

function parseKVArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.includes('=')) {
      const [k, v] = a.split('='); out[k] = v;
    }
  }
  return out;
}

async function run() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (!cmd || cmd === 'help') {
    printHelp();
    return;
  }

  // Lazy require to avoid forcing sqlite3 install when user just asks for help
  let ParkingDB;
  try {
    ParkingDB = require('./parking_db');
  } catch (e) {
    console.error('Could not load ParkingDB. Ensure sqlite3 is installed.');
    console.error('Run: npm install sqlite3');
    process.exit(1);
  }

  const pdb = new ParkingDB();

  try {
    if (cmd === 'init') {
      console.log('Initializing DB and seeding...');
      const ok = await pdb.init(true);
      console.log('Init result:', ok);
      return;
    }

    if (cmd === 'create') {
      if (args.length < 5) {
        console.error('create requires: LOT_CODE day hour occupied'); process.exit(1);
      }
      const [, lot_code, day, hourStr, occupiedStr] = args;
      const res = await pdb.createFulfillment({ lot_code, day, hour: Number(hourStr), occupied: Number(occupiedStr) });
      console.log('Created fulfillment id:', res.id);
      return;
    }

    if (cmd === 'read') {
      const id = Number(args[1]); if (!id) { console.error('read requires id'); process.exit(1); }
      const row = await pdb.readFulfillment(id);
      console.log(JSON.stringify(row, null, 2));
      return;
    }

    if (cmd === 'update') {
      const id = Number(args[1]); if (!id) { console.error('update requires id'); process.exit(1); }
      const kv = parseKVArgs(args.slice(2));
      const payload = {};
      if (kv.occupied !== undefined) payload.occupied = Number(kv.occupied);
      if (kv.day !== undefined) payload.day = kv.day;
      if (kv.hour !== undefined) payload.hour = Number(kv.hour);
      if (Object.keys(payload).length === 0) { console.error('update requires at least one field (occupied=, day=, hour=)'); process.exit(1); }
      const res = await pdb.updateFulfillment(id, payload);
      console.log('Update result:', res);
      return;
    }

    if (cmd === 'delete') {
      const id = Number(args[1]); if (!id) { console.error('delete requires id'); process.exit(1); }
      const res = await pdb.deleteFulfillment(id);
      console.log('Delete result:', res);
      return;
    }

    if (cmd === 'list') {
      // optional filters: day, hour
      const day = args[1];
      const hour = args[2] !== undefined ? Number(args[2]) : undefined;
      let sql = `SELECT f.id, pl.code as lot_code, f.day, f.hour, f.occupied, f.last_updated FROM fulfillment f JOIN parking_lots pl ON f.lot_id = pl.id`;
      const params = [];
      if (day !== undefined) { sql += ' WHERE f.day = ?'; params.push(String(day).toLowerCase()); }
      if (hour !== undefined) { sql += params.length ? ' AND f.hour = ?' : ' WHERE f.hour = ?'; params.push(Number(hour)); }
      const db = pdb.open();
      try {
        const rows = await pdb.all(db, sql, params);
        console.log(JSON.stringify(rows, null, 2));
      } finally { db.close(); }
      return;
    }

    console.error('Unknown command:', cmd);
    printHelp();
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();
