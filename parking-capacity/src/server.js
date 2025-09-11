const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Fake parking data
let parkingLots = [
    {
      lotName: "Campus Lot A",
      totalSpaces: 350,
      availableSpaces: 7,
      lastUpdated: new Date().toISOString(),
    },
    {
      lotName: "Campus Lot B",
      totalSpaces: 200,
      availableSpaces: 10,
      lastUpdated: new Date().toISOString(),
    },
    {
      lotName: "Campus Lot C",
      totalSpaces: 200,
      availableSpaces: 37,
      lastUpdated: new Date().toISOString(),
    },
    {
      lotName: "Campus Lot D",
      totalSpaces: 150,
      availableSpaces: 50,
      lastUpdated: new Date().toISOString(),
    },
    {
      lotName: "Campus Lot E",
      totalSpaces: 150,
      availableSpaces: 87,
      lastUpdated: new Date().toISOString(),
    }
  ];
  

// Route: GET /parking
app.get("/parking", (req, res) => {
  res.json(parkingLots);
});

app.listen(PORT, () => {
  console.log(`🚗 Parking API running at http://localhost:${PORT}/parking`);
});
