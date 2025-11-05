// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import parkingLotsRouter from './routes/parkingLots.js';
import fulfillmentRouter from './routes/fulfillment.js';

const app = express();
app.use(cors());
app.use(express.json());

// Your original routes remain the same
app.use('/api/parking-lots', parkingLotsRouter);
app.use('/api/fulfillment', fulfillmentRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));