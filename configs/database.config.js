const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "",
  database: process.env.PGDATABASE || "postgres",
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
  process.exit(1);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
