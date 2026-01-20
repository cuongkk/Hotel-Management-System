// const { Pool } = require("pg");

// const pool = new Pool({
//   host: process.env.PGHOST || "localhost",
//   port: Number(process.env.PGPORT || 5432),
//   user: process.env.PGUSER || "postgres",
//   password: process.env.PGPASSWORD || "",
//   database: process.env.PGDATABASE || "postgres",
// });

// console.log("PGHOST:", process.env.PGHOST);
// console.log("PGPORT:", process.env.PGPORT);
// console.log("PGUSER:", process.env.PGUSER);
// console.log("PGPASSWORD:", process.env.PGPASSWORD);
// console.log("PGDATABASE:", process.env.PGDATABASE);

// pool.on("error", (err) => {
//   console.error("Unexpected error on idle PostgreSQL client:", err);
//   process.exit(1);
// });

// module.exports = {
//   pool,
//   query: (text, params) => pool.query(text, params),
// };

const { Pool } = require("pg");

const isProd = process.env.NODE_ENV === "production";

// Ưu tiên DATABASE_URL (Render)
// Fallback về các biến PGHOST/PGPORT... để chạy local
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: isProd ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "",
        database: process.env.PGDATABASE || "postgres",
        ssl: false,
      },
);

// Log an toàn (KHÔNG in password)
console.log("DB mode:", process.env.DATABASE_URL ? "DATABASE_URL" : "PG* vars");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PGHOST:", process.env.PGHOST);
console.log("PGPORT:", process.env.PGPORT);
console.log("PGUSER:", process.env.PGUSER);
console.log("PGDATABASE:", process.env.PGDATABASE);
// console.log("DATABASE_URL:", process.env.DATABASE_URL); // ❌ tránh log full URL vì lộ password

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
  process.exit(1);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
