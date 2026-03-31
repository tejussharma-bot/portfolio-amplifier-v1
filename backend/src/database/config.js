const { Pool } = require("pg");
require("dotenv").config();
const { isPlaceholderValue } = require("../utils/config");

const hasDatabaseUrl =
  !!process.env.DATABASE_URL && !isPlaceholderValue(process.env.DATABASE_URL);

const shouldUseSsl =
  process.env.DB_SSL === "true" ||
  (hasDatabaseUrl && process.env.DB_SSL !== "false");

const ssl = shouldUseSsl ? { rejectUnauthorized: false } : undefined;

const pool = new Pool(
  hasDatabaseUrl
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl
      }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        ssl
      }
);

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error", error);
});

module.exports = {
  pool,
  query(text, params) {
    return pool.query(text, params);
  }
};
