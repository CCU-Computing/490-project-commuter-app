const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SLOTS_JSON = path.join(__dirname, 'apps', 'data', 'slots.json');

function normalizeDay(d) { return String(d || '').trim().toLowerCase(); }
function parseHour(input) {
  if (!input) return null;
  const s = String(input).trim();
  const m = s.match(/^(\d{1,2})(:?\d{0,2})/);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  if (Number.isNaN(hour)) return null;
  if (hour < 0) hour = 0; if (hour > 23) hour = 23;
  return hour.toString().padStart(2, '0');
}

function loadSlots() {
  if (!fs.existsSync(SLOTS_JSON)) throw new Error(`slots.json not found at ${SLOTS_JSON}`);
  const raw = fs.readFileSync(SLOTS_JSON, 'utf8');
  return JSON.parse(raw);
}

function computeListFor(slotsObj, day, hourKey) {
  const dayKey = normalizeDay(day);
  const list = [];
  for (const lotCode of Object.keys(slotsObj)) {
    const lot = slotsObj[lotCode] || {};
    const capacity = Number(lot.capacity || 0);
    const slotDays = lot.slots || {};
    const daySlots = slotDays[dayKey] || {};
    const slotEntry = daySlots[hourKey] || {};
    const occupied = Number(slotEntry.occupied || 0);
    const occupancy_percent = capacity === 0 ? 1 : (occupied / capacity);
    const probability = Math.max(0, Math.min(1, 1 - occupancy_percent));
    list.push({ code: lotCode, capacity, occupied, occupancy_percent: Number(occupancy_percent.toFixed(4)), probability: Number(probability.toFixed(4)) });
  }
  list.sort((a, b) => {
    if (a.occupancy_percent !== b.occupancy_percent) return a.occupancy_percent - b.occupancy_percent;
    return a.code.localeCompare(b.code);
  });
  return list;
}

// No terminal coloring is used to keep output portable and simple.

function formatTable(list) {
  // columns: Rank, Lot, Occupied/Cap, Free, Occupancy%, Chance
  const col = { rank: 4, lot: 6, oc: 14, free: 6, occp: 10, prob: 8 };
  const header = `${'Rank'.padEnd(col.rank)} ${'Lot'.padEnd(col.lot)} ${'Occupied/Cap'.padEnd(col.oc)} ${'Free'.padEnd(col.free)} ${'Occupancy%'.padEnd(col.occp)} ${'Chance'.padEnd(col.prob)}`;
  console.log(header);
  console.log('-'.repeat(header.length));
  let rank = 1;
  for (const item of list) {
    const free = Math.max(0, item.capacity - item.occupied);
    const occPercentStr = (item.occupancy_percent * 100).toFixed(1) + '%';
    const probStr = (item.probability * 100).toFixed(1) + '%';
    const occPadded = occPercentStr.padEnd(col.occp);
    const line = `${String(rank).padEnd(col.rank)} ${item.code.padEnd(col.lot)} ${`${item.occupied}/${item.capacity}`.padEnd(col.oc)} ${String(free).padEnd(col.free)} ${occPadded} ${probStr.padEnd(col.prob)}`;
    console.log(line);
    rank++;
  }
}

// summary removed per user request (we no longer print aggregated summary section)

async function runInteractiveOrArgs() {
  const slotsObj = loadSlots();
  const argvDay = process.argv[2];
  const argvTime = process.argv[3];
  let day, hourKey;
  if (argvDay && argvTime) {
    day = normalizeDay(argvDay);
    hourKey = parseHour(argvTime);
    if (!hourKey) {
      console.error('Invalid hour arg'); process.exit(1);
    }
  } else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = q => new Promise(res => rl.question(q, ans => res(ans)));
  const dayAns = await question('Enter day (Monday to Friday): ');
  const timeAns = await question('Enter time (HH or HH:MM, between 07:00 and 17:00): ');
    rl.close();
    day = normalizeDay(dayAns);
    hourKey = parseHour(timeAns);
    if (!hourKey) { console.error('Invalid time input'); process.exit(1); }
  }

  const list = computeListFor(slotsObj, day, hourKey);
  const best = list.length ? list[0] : null;
  // Capitalize day for nicer display
  const displayDay = day.charAt(0).toUpperCase() + day.slice(1);
  console.log(`\nResult for ${displayDay} at ${hourKey}:00`);
  if (best) {
    const free = Math.max(0, best.capacity - best.occupied);
    // print best slot on one line (sideways)
    console.log(`\nBest: ${best.code}  ${best.occupied}/${best.capacity}  Free:${free}  Occupancy:${(best.occupancy_percent*100).toFixed(1)}%  Chance:${(best.probability*100).toFixed(1)}%\n`);
  }
  formatTable(list);
  console.log('\nNote: These numbers are estimates/predictions based on historical/seed data and do not guarantee actual availability.\n');
}

runInteractiveOrArgs().catch(err => { console.error('Error:', err && err.message ? err.message : err); process.exit(1); });
