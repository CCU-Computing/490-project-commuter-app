import express from "express";
import {
  listParkingLots,
  bestParkingLot,
  historicalParking,
  parkingLotsGeoJSON,
  importParkingLotsGeoJSON,   // <-- add
} from "../controllers/parkingLots.controller.js";

const router = express.Router();

router.get("/", listParkingLots);
router.get("/best", bestParkingLot);
router.get("/historical", historicalParking);
router.get("/geojson", parkingLotsGeoJSON);

// NEW: import lots polygons
router.post("/import-geojson", importParkingLotsGeoJSON);

export default router;
