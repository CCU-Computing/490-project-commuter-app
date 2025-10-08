import pg from "pg";
const { Pool } = pg;

const {
  DATABASE_URL,
  PGHOST = "localhost",
  PGPORT = "5432",
  PGDATABASE = "transit",
  PGUSER = "postgres",
  PGPASSWORD = "postgres",
} = process.env;

export const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL })
  : new Pool({
      host: PGHOST,
      port: Number(PGPORT),
      database: PGDATABASE,
      user: PGUSER,
      password: String(PGPASSWORD),
    });
