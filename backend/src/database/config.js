const { Pool } = require("pg");
require("dotenv").config();
const { isPlaceholderValue } = require("../utils/config");

const hasDatabaseUrl =
  !!process.env.DATABASE_URL && !isPlaceholderValue(process.env.DATABASE_URL);

const shouldUseSsl =
  process.env.DB_SSL === "true" ||
  (hasDatabaseUrl && process.env.DB_SSL !== "false");

const ssl = shouldUseSsl ? { rejectUnauthorized: false } : undefined;
const connectionTimeoutMillis = Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000);
const idleTimeoutMillis = Number(process.env.DB_IDLE_TIMEOUT_MS || 10000);
const queryTimeoutMillis = Number(process.env.DB_QUERY_TIMEOUT_MS || 10000);
const statementTimeoutMillis = Number(process.env.DB_STATEMENT_TIMEOUT_MS || 10000);
const maxConnections = Number(process.env.DB_POOL_MAX || (process.env.VERCEL ? 1 : 10));

const baseConfig = {
  ssl,
  max: maxConnections,
  connectionTimeoutMillis,
  idleTimeoutMillis,
  query_timeout: queryTimeoutMillis,
  statement_timeout: statementTimeoutMillis,
  allowExitOnIdle: true
};

const pool = new Pool(
  hasDatabaseUrl
    ? {
        ...baseConfig,
        connectionString: process.env.DATABASE_URL,
        ssl
      }
    : {
        ...baseConfig,
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
