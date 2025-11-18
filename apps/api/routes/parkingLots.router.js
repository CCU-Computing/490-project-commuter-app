// apps/api/routes/parkingLots.router.js
import express from "express";
import {
  listParkingLots,
  bestParkingLot,
  historicalParking,
  importParkingLotsGeoJSON,
  parkingLotsGeoJSON,
} from "../controllers/parkingLots.controller.js";

const router = express.Router();


// Uses lots.geojson on disk (NOT DB geom)
router.get("/geojson", listParkingLots);

// Optional DB-based variant, if you ever want it
router.get("/db-geojson", parkingLotsGeoJSON);

// Other endpoints
router.get("/best", bestParkingLot);
router.get("/historical", historicalParking);
router.post("/import", importParkingLotsGeoJSON);

export default router;
