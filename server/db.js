import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.SUPABASE_DB_URL;

export const pool = connectionString
  ? (() => {
      const p = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 10,
      });
      p.on("error", (err) => {
        console.error("[db] unexpected error on idle client", err);
      });
      return p;
    })()
  : null;
