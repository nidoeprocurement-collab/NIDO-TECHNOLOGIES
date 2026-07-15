import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error(
    "SUPABASE_DB_URL is required. Add your Supabase Postgres connection string as a secret.",
  );
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on("error", (err) => {
  console.error("[db] unexpected error on idle client", err);
});
