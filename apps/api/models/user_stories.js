//user story 1

const SEMESTER_BASE_MIN = { Fall: 34, Spring: 30, Summer: 24 }; // rough baseline minutes
const WEEK_FACTOR = { 1: 1.15, 2: 1.05, 3: 1.00, 4: 1.00, 5: 0.98 }; // start-of-term surge
const DAY_FACTOR = { Mon: 1.15, Tue: 1.10, Wed: 1.10, Thu: 1.08, Fri: 1.05, Sat: 0.80, Sun: 0.75 };
const WEATHER_FACTOR = { clear: 1.00, rain: 1.10, storm: 1.20 };


function todFactor(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const t = h + m / 60;
  if (t >= 6 && t < 9) return 1.25;     // AM rush
  if (t >= 9 && t < 15) return 1.00;    // mid-day
  if (t >= 15 && t < 18) return 1.30;   // PM rush
  if (t >= 18 && t < 21) return 1.05;   // evening
  return 0.90;                           // late night / very early
}

function jitterMinutes(key, spread = 3) {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % (2 * spread + 1)) - spread; // integer in [-spread, +spread]
}

function estimateDriveMinutes({ semester, weekOfMonth, day, departTime, weather = "clear" }) {
  const base = SEMESTER_BASE_MIN[semester] ?? 30;
  const wf = WEEK_FACTOR[weekOfMonth] ?? 1.0;
  const df = DAY_FACTOR[day] ?? 1.0;
  const tf = todFactor(departTime);
  const wfz = WEATHER_FACTOR[weather] ?? 1.0;

  const raw = base * wf * df * tf * wfz;
  const noise = jitterMinutes(`${semester}|${weekOfMonth}|${day}|${departTime}|${weather}`, 3);
  return Math.max(8, Math.round(raw + noise)); // never below 8 min
}


for (let w = 1; w <= 5; w++) {
  const mins = estimateDriveMinutes({ semester: "Fall", weekOfMonth: w, day: "Mon", departTime: "08:00", weather: "clear" });
  console.log(`Fall, week ${w}, Mon 08:00 → ~${mins} min`);
}



//user story 2

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(total) {
  const t = ((total % (24 * 60)) + 24 * 60) % (24 * 60); 
  const h = Math.floor(t / 60), m = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function whenToLeaveForClass({
  classStartHHMM,
  semester,
  weekOfMonth,
  day,             
  weather = "clear",
  arriveEarlyMin = 20,  
  parkingWalkBufferMin = 0, 
}) {
  const driveMin = estimateDriveMinutes({ semester, weekOfMonth, day, departTime: classStartHHMM, weather });
  const leaveAt = toMinutes(classStartHHMM) - arriveEarlyMin - parkingWalkBufferMin - driveMin;
  return {
    leaveHHMM: fromMinutes(leaveAt),
    driveMin,
    arriveBufferMin: arriveEarlyMin + parkingWalkBufferMin
  };
}


const plan = whenToLeaveForClass({
  classStartHHMM: "09:30",
  semester: "Fall",
  weekOfMonth: 1,
  day: "Mon",
  weather: "rain",
  arriveEarlyMin: 20,
  parkingWalkBufferMin: 5
});

console.log(`Drive ≈ ${plan.driveMin} min, arrive buffer = ${plan.arriveBufferMin} min`);
console.log(`Leave home at: ${plan.leaveHHMM}`);
