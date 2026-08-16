import pg from "pg";

const { Pool } = pg;

// Prefer Replit's managed PostgreSQL connection. Keep the existing Supabase
// fallback because the email module was originally provisioned against it.
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

export const pool = connectionString
  ? (() => {
      const p = new Pool({
        connectionString,
        ssl: process.env.DATABASE_URL ? undefined : { rejectUnauthorized: false },
        max: 10,
      });
      p.on("error", (err) => {
        console.error("[db] unexpected error on idle client", err);
      });
      return p;
    })()
  : null;
