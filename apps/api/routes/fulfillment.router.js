// routes/fulfillment.router.js
import express from "express";
import {
  listFulfillment,
  createFulfillment,
  updateFulfillment,
  deleteFulfillment,
} from "../controllers/fulfillment.controller.js";

const router = express.Router();

router.get("/", listFulfillment);
router.post("/", createFulfillment);
router.put("/:id", updateFulfillment);
router.delete("/:id", deleteFulfillment);

export default router;
