const { Pool } = require("pg");
require("dotenv").config();

const ssl =
  process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error", error);
});

module.exports = {
  pool,
  query(text, params) {
    return pool.query(text, params);
  }
};
