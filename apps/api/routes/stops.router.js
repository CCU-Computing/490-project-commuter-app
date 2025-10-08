import { Router } from "express";
import {
  listStops, getStop, createStop, updateStop, deleteStop
} from "../controllers/stops.controller.js";

const r = Router();
r.get("/", listStops);
r.get("/:id", getStop);
r.post("/", createStop);
r.patch("/:id", updateStop);
r.delete("/:id", deleteStop);

export default r;
