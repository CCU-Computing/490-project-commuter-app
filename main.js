const readline = require("readline");

// Mock parking + traffic data
const parkingData = [
  { lot: "Lot A", peakHours: ["08:00", "09:00", "10:00"], spaces: 50 },
  { lot: "Lot B", peakHours: ["12:00", "13:00"], spaces: 30 },
  { lot: "Lot C", peakHours: ["15:00", "16:00"], spaces: 70 }
];

const trafficData = {
  "08:00": "heavy",
  "09:00": "heavy",
  "12:00": "moderate",
  "15:00": "light",
  "16:00": "moderate"
};

// All hours we track
const allHours = ["08:00", "09:00", "10:00", "12:00", "13:00", "15:00", "16:00"];

// Step 1: Show best hours automatically
function getBestParkingHours() {
  let bestHours = [];
  for (let hour of allHours) {
    let busyLots = parkingData.filter(lot => lot.peakHours.includes(hour)).length;
    if (busyLots === 0) {
      bestHours.push(hour);
    }
  }
  return bestHours;
}

// Step 2: Suggest adjusted arrival time based on traffic
function suggestArrivalTime(classTime) {
  const traffic = trafficData[classTime] || "light"; // default to light
  const arrivalTime = adjustTime(classTime, traffic);
  return `Traffic at ${classTime} is ${traffic}. Suggested arrival time to campus: ${arrivalTime}`;
}

// Adjusts class time backwards to account for traffic
function adjustTime(classTime, traffic) {
  const [hourStr, minStr] = classTime.split(":");
  let hour = parseInt(hourStr, 10);
  let minutes = parseInt(minStr, 10);

  let subtractMinutes = (traffic === "heavy") ? 45 : 20;

  minutes -= subtractMinutes;
  while (minutes < 0) {
    hour -= 1;
    minutes += 60;
  }
  if (hour < 0) hour = 23; // wrap around midnight

  return `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

// --- Run the program ---

// Automatically print all best hours (light or moderate traffic)
function printBestArrivalHours() {
  console.log("Best hours to arrive at campus (light or moderate parking):");
  for (let time in trafficData) {
    if (trafficData[time] === "light" || trafficData[time] === "moderate") {
      console.log(time);
    }
  }
}

// Run the function
printBestArrivalHours();


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Enter your class scheduled time (HH:MM): ", (classTime) => {
  console.log(suggestArrivalTime(classTime));
  rl.close();
});

