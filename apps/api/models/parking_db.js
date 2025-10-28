const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class ParkingDB {
  constructor(dbFile) {
    this.dbFile = dbFile || path.join(__dirname, '..', '..', '..', 'data', 'parking.db');
    const dir = path.dirname(this.dbFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  open() {
    return new sqlite3.Database(this.dbFile);
  }

  run(db, sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(db, sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  all(db, sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async init(seed = true) {
    const db = this.open();
    try {
      await this.run(db, `CREATE TABLE IF NOT EXISTS parking_lots (
        id INTEGER PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        capacity INTEGER NOT NULL
      )`);

      await this.run(db, `CREATE TABLE IF NOT EXISTS fulfillment (
        id INTEGER PRIMARY KEY,
        lot_id INTEGER NOT NULL,
        day TEXT NOT NULL,
        hour INTEGER NOT NULL,
        occupied INTEGER NOT NULL DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(lot_id) REFERENCES parking_lots(id)
      )`);

      // slots table represents capacity and occupied for each lot/day/hour
      await this.run(db, `CREATE TABLE IF NOT EXISTS slots (
        id INTEGER PRIMARY KEY,
        lot_id INTEGER NOT NULL,
        day TEXT NOT NULL,
        hour INTEGER NOT NULL,
        capacity INTEGER NOT NULL,
        occupied INTEGER NOT NULL DEFAULT 0,
        UNIQUE(lot_id, day, hour),
        FOREIGN KEY(lot_id) REFERENCES parking_lots(id)
      )`);

      if (seed) {
        // seed parking lots AA, QQ, KK, GG with capacities
        const lots = [
          { code: 'AA', capacity: 50 },
          { code: 'QQ', capacity: 100 },
          { code: 'KK', capacity: 200 },
          { code: 'GG', capacity: 300 }
        ];

        for (const lot of lots) {
          try {
            await this.run(db, `INSERT OR IGNORE INTO parking_lots (code, capacity) VALUES (?,?)`, [lot.code, lot.capacity]);
          } catch (e) {
            // ignore
          }
        }

        // seed slots for Monday-Friday, hours 07..17 for each lot
        const days = ['monday','tuesday','wednesday','thursday','friday'];
        const hours = [];
        for (let h = 7; h <= 17; h++) hours.push(h);

        const plRows = await this.all(db, `SELECT id, code, capacity FROM parking_lots`);
        for (const pl of plRows) {
          for (const day of days) {
            for (const hour of hours) {
              try {
                await this.run(db, `INSERT OR IGNORE INTO slots (lot_id, day, hour, capacity, occupied) VALUES (?,?,?,?,?)`, [pl.id, day, hour, pl.capacity, 0]);
              } catch (e) {
                // ignore duplicates
              }
            }
          }
        }
      }

      return true;
    } finally {
      db.close();
    }
  }

  // List parking lots for a given day and hour, sorted best->worst by occupancy percent (lowest first)
  async listParking(day, hour) {
    day = String(day || '').toLowerCase();
    hour = Number(hour || 0);
    const db = this.open();
    try {
      const sql = `SELECT pl.id, pl.code, s.capacity, s.occupied,
        (CAST(s.occupied AS REAL) / s.capacity) AS occupancy_percent
        FROM parking_lots pl
        JOIN slots s ON s.lot_id = pl.id AND s.day = ? AND s.hour = ?
        ORDER BY occupancy_percent ASC, pl.code ASC`;

      const rows = await this.all(db, sql, [day, hour]);
      const list = rows.map(r => ({
        id: r.id,
        code: r.code,
        capacity: r.capacity,
        occupied: r.occupied,
        occupancy_percent: Number(Number(r.occupancy_percent || 0).toFixed(4))
      }));
      return list;
    } finally {
      db.close();
    }
  }

  async getBestParking(day, hour) {
    const list = await this.listParking(day, hour);
    return (list && list.length) ? list[0] : null;
  }

  // CRUD for fulfillment
  async createFulfillment({ lot_code, day, hour, occupied }) {
    day = String(day || '').toLowerCase();
    hour = Number(hour);
    occupied = Number(occupied || 0);
    const db = this.open();
    try {
      // find lot
      const lot = await this.get(db, `SELECT id FROM parking_lots WHERE code = ?`, [lot_code]);
      if (!lot) throw new Error('parking lot not found');
      const res = await this.run(db, `INSERT INTO fulfillment (lot_id, day, hour, occupied) VALUES (?,?,?,?)`, [lot.id, day, hour, occupied]);
      return { id: res.id };
    } finally {
      db.close();
    }
  }

  async readFulfillment(id) {
    const db = this.open();
    try {
      const row = await this.get(db, `SELECT f.id, pl.code as lot_code, f.day, f.hour, f.occupied FROM fulfillment f JOIN parking_lots pl ON f.lot_id = pl.id WHERE f.id = ?`, [id]);
      return row || null;
    } finally {
      db.close();
    }
  }

  async updateFulfillment(id, { occupied, day, hour }) {
    const db = this.open();
    try {
      const parts = [];
      const params = [];
      if (occupied !== undefined) { parts.push('occupied = ?'); params.push(Number(occupied)); }
      if (day !== undefined) { parts.push('day = ?'); params.push(String(day).toLowerCase()); }
      if (hour !== undefined) { parts.push('hour = ?'); params.push(Number(hour)); }
      if (parts.length === 0) throw new Error('no fields to update');
      params.push(id);
      const sql = `UPDATE fulfillment SET ${parts.join(', ')}, last_updated = CURRENT_TIMESTAMP WHERE id = ?`;
      const res = await this.run(db, sql, params);
      return { changes: res.changes };
    } finally {
      db.close();
    }
  }

  async deleteFulfillment(id) {
    const db = this.open();
    try {
      const res = await this.run(db, `DELETE FROM fulfillment WHERE id = ?`, [id]);
      return { changes: res.changes };
    } finally {
      db.close();
    }
  }

  // Helper: normalize day
  _normalizeDay(day) {
    return String(day || '').toLowerCase();
  }

  // Get a single slot by lot code, day, hour
  async getSlot(lot_code, day, hour) {
    day = this._normalizeDay(day);
    hour = Number(hour);
    const db = this.open();
    try {
      const sql = `SELECT s.id, pl.code as lot_code, s.day, s.hour, s.capacity, s.occupied
        FROM slots s JOIN parking_lots pl ON s.lot_id = pl.id
        WHERE pl.code = ? AND s.day = ? AND s.hour = ? LIMIT 1`;
      const row = await this.get(db, sql, [lot_code, day, hour]);
      return row || null;
    } finally {
      db.close();
    }
  }

  // Set slot occupied to a value (clamp by capacity if clamp=true)
  async setSlotOccupied(lot_code, day, hour, occupied, { clamp = true } = {}) {
    day = this._normalizeDay(day);
    hour = Number(hour);
    occupied = Number(occupied || 0);
    const db = this.open();
    try {
      const slot = await this.get(db, `SELECT s.id, s.capacity FROM slots s JOIN parking_lots pl ON s.lot_id=pl.id WHERE pl.code=? AND s.day=? AND s.hour=?`, [lot_code, day, hour]);
      if (!slot) throw new Error('slot not found');
      const cap = Number(slot.capacity);
      let newVal = occupied;
      if (clamp) {
        if (newVal < 0) newVal = 0;
        if (newVal > cap) newVal = cap;
      } else {
        if (newVal < 0 || newVal > cap) throw new Error('occupied out of range');
      }
      await this.run(db, `UPDATE slots SET occupied = ?, rowid = rowid WHERE id = ?`, [newVal, slot.id]);
      // return updated slot
      const updated = await this.get(db, `SELECT s.id, pl.code as lot_code, s.day, s.hour, s.capacity, s.occupied FROM slots s JOIN parking_lots pl ON s.lot_id=pl.id WHERE s.id = ?`, [slot.id]);
      return updated;
    } finally {
      db.close();
    }
  }

  // Adjust slot occupied by delta (can be negative). Returns updated slot.
  async adjustSlotOccupied(lot_code, day, hour, delta) {
    day = this._normalizeDay(day);
    hour = Number(hour);
    delta = Number(delta || 0);
    const db = this.open();
    try {
      const slot = await this.get(db, `SELECT s.id, s.capacity, s.occupied FROM slots s JOIN parking_lots pl ON s.lot_id=pl.id WHERE pl.code=? AND s.day=? AND s.hour=?`, [lot_code, day, hour]);
      if (!slot) throw new Error('slot not found');
      const cap = Number(slot.capacity);
      let newVal = Number(slot.occupied) + delta;
      if (newVal < 0) newVal = 0;
      if (newVal > cap) newVal = cap;
      await this.run(db, `UPDATE slots SET occupied = ? WHERE id = ?`, [newVal, slot.id]);
      const updated = await this.get(db, `SELECT s.id, pl.code as lot_code, s.day, s.hour, s.capacity, s.occupied FROM slots s JOIN parking_lots pl ON s.lot_id=pl.id WHERE s.id = ?`, [slot.id]);
      return updated;
    } finally {
      db.close();
    }
  }

  // Reset slots occupied to zero. If day & hour provided, limits to that; if only day provided, reset that day; otherwise resets all slots.
  async resetSlots(day, hour) {
    const db = this.open();
    try {
      if (day && hour !== undefined) {
        await this.run(db, `UPDATE slots SET occupied = 0 WHERE day = ? AND hour = ?`, [this._normalizeDay(day), Number(hour)]);
      } else if (day) {
        await this.run(db, `UPDATE slots SET occupied = 0 WHERE day = ?`, [this._normalizeDay(day)]);
      } else {
        await this.run(db, `UPDATE slots SET occupied = 0`, []);
      }
      return { success: true };
    } finally {
      db.close();
    }
  }

  // Probability helpers
  // For a single lot: probability of finding a free space = max(0, 1 - occupancy_percent)
  async getAvailabilityProbability(lot_code, day, hour) {
    const slot = await this.getSlot(lot_code, day, hour);
    if (!slot) return null;
    const cap = Number(slot.capacity) || 0;
    const occ = Number(slot.occupied) || 0;
    const occupancy = cap === 0 ? 1 : (occ / cap);
    let prob = 1 - occupancy;
    if (prob < 0) prob = 0;
    if (prob > 1) prob = 1;
    return { lot_code: slot.lot_code, day: slot.day, hour: slot.hour, capacity: cap, occupied: occ, probability: Number(prob.toFixed(4)) };
  }

  // Overall probability across all lots: (total_free_spots) / (total_capacity)
  async getOverallAvailabilityProbability(day, hour) {
    day = this._normalizeDay(day);
    hour = Number(hour);
    const db = this.open();
    try {
      const row = await this.get(db, `SELECT SUM(capacity) as total_capacity, SUM(occupied) as total_occupied FROM slots WHERE day = ? AND hour = ?`, [day, hour]);
      const total_capacity = Number(row && row.total_capacity) || 0;
      const total_occupied = Number(row && row.total_occupied) || 0;
      const free = Math.max(0, total_capacity - total_occupied);
      const prob = total_capacity === 0 ? 0 : Number((free / total_capacity).toFixed(4));
      return { day, hour, total_capacity, total_occupied, free, probability: prob };
    } finally {
      db.close();
    }
  }

  // Seed slots from a JSON object or file path (uses apps/data/slots.json by default)
  async seedSlotsFromJSON(jsonPathOrObject, { overwrite = false } = {}) {
    let obj = jsonPathOrObject;
    if (!obj) {
      const defaultPath = path.join(__dirname, '..', 'data', 'slots.json');
      if (!fs.existsSync(defaultPath)) throw new Error('slots.json not found');
      obj = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
    } else if (typeof obj === 'string') {
      obj = JSON.parse(fs.readFileSync(obj, 'utf8'));
    }

    const db = this.open();
    try {
      const plRows = await this.all(db, `SELECT id, code FROM parking_lots`);
      const plMap = {};
      for (const p of plRows) plMap[p.code] = p.id;

      for (const lotCode of Object.keys(obj)) {
        const lot = obj[lotCode];
        const lotId = plMap[lotCode];
        if (!lotId) continue;
        const slotsForLot = lot.slots || {};
        for (const day of Object.keys(slotsForLot)) {
          const hours = slotsForLot[day] || {};
          for (const h of Object.keys(hours)) {
            const entry = hours[h];
            const hourInt = Number(h);
            const cap = Number(lot.capacity || entry.capacity || 0);
            const occ = Number(entry.occupied || 0);
            if (overwrite) {
              await this.run(db, `INSERT OR REPLACE INTO slots (lot_id, day, hour, capacity, occupied) VALUES (?,?,?,?,?)`, [lotId, day, hourInt, cap, occ]);
            } else {
              await this.run(db, `INSERT OR IGNORE INTO slots (lot_id, day, hour, capacity, occupied) VALUES (?,?,?,?,?)`, [lotId, day, hourInt, cap, occ]);
            }
          }
        }
      }
      return { success: true };
    } finally {
      db.close();
    }
  }
}

module.exports = ParkingDB;
