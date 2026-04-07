const { Pool } = require("pg");
require("dotenv").config();
const { isPlaceholderValue } = require("../utils/config");

function getConfiguredConnectionString() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING
  ];

  return candidates.find((value) => value && !isPlaceholderValue(value)) || "";
}

function normalizeConnectionString(value, shouldUseSsl) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);

    if (shouldUseSsl) {
      // node-postgres gives query-string SSL params precedence over the ssl config object.
      // For hosted Postgres URLs that ship with sslmode=require, switch to no-verify so
      // the driver keeps TLS enabled without rejecting provider-managed/self-signed chains.
      url.searchParams.set("sslmode", "no-verify");
      url.searchParams.delete("sslcert");
      url.searchParams.delete("sslkey");
      url.searchParams.delete("sslrootcert");
      url.searchParams.delete("sslpassword");
    }

    return url.toString();
  } catch (_error) {
    return value;
  }
}

const rawConnectionString = getConfiguredConnectionString();
const hasDatabaseUrl =
  !!rawConnectionString;

const shouldUseSsl =
  process.env.DB_SSL === "true" ||
  (hasDatabaseUrl && process.env.DB_SSL !== "false");
const connectionString = normalizeConnectionString(rawConnectionString, shouldUseSsl);

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

function createInMemoryPool() {
  const { newDb } = require("pg-mem");
  const globalKey = "__portfolioAmplifierInMemoryPg";

  if (globalThis[globalKey]?.pool) {
    return globalThis[globalKey].pool;
  }

  const db = newDb({
    autoCreateForeignKeyIndices: true
  });
  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool();

  globalThis[globalKey] = {
    db,
    pool
  };

  return pool;
}

const shouldUseInMemoryDb =
  process.env.USE_IN_MEMORY_DB === "true" ||
  (!hasDatabaseUrl &&
    !process.env.VERCEL &&
    ["localhost", "127.0.0.1", "::1", ""].includes(String(process.env.DB_HOST || "localhost")));

const pool = shouldUseInMemoryDb
  ? createInMemoryPool()
  : new Pool(
    hasDatabaseUrl
      ? {
        ...baseConfig,
        connectionString,
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
