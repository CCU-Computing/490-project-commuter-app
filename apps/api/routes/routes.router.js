import { Router } from "express";
import {
  listRoutes, getRoute, createRoute, updateRoute, deleteRoute, listRouteStops
} from "../controllers/routes.controller.js";
import { upsertRouteStop, deleteRouteStop } from "../controllers/routeStops.controller.js";

const r = Router();

r.get("/", listRoutes);
r.get("/:id", getRoute);
r.post("/", createRoute);
r.patch("/:id", updateRoute);
r.delete("/:id", deleteRoute);

// route stops
r.get("/:id/stops", listRouteStops);
r.put("/:id/stops", upsertRouteStop);          // body: { stop_id, seq, dwell_s?, distance_m? }
r.delete("/:id/stops/:stopId", deleteRouteStop);

export default r;
