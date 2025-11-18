import "dotenv/config";
import express from "express";
import cors from "cors";
import routesRouter from "./routes/routes.router.js";
import stopsRouter from "./routes/stops.router.js";
import parkingLotsRouter from "./routes/parkingLots.router.js";
import fulfillmentRouter from "./routes/fulfillment.router.js";

const app = express();
const PORT = process.env.PORT || 3000;
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "../web"); // apps/web

// serve /web/*
app.use("/web", express.static(webRoot));
app.use(cors({ origin: 'http://localhost:8000' }));
// optional: redirect / -> /web/
app.get("/", (_req, res) => res.redirect("/web/"));
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/routes", routesRouter);
app.use("/stops", stopsRouter);
app.use("/parking-lots", parkingLotsRouter);
app.use("/fulfillment", fulfillmentRouter);

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "server_error", message: err.message });
});

app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
