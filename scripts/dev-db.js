const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const backendEnvPath = path.join(rootDir, "backend", ".env");

const PLACEHOLDER_TOKENS = new Set([
  "",
  "placeholder",
  "your_database_url",
  "your_password"
]);

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function isPlaceholderValue(value) {
  const normalized = normalizeValue(value);

  if (!normalized) {
    return true;
  }

  if (PLACEHOLDER_TOKENS.has(normalized)) {
    return true;
  }

  if (normalized.includes("[your-password]")) {
    return true;
  }

  return normalized.startsWith("your_");
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((accumulator, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return accumulator;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex < 0) {
        return accumulator;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      accumulator[key] = value;
      return accumulator;
    }, {});
}

function findConfiguredDatabaseUrl(...sources) {
  const keys = [
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING"
  ];

  for (const source of sources) {
    for (const key of keys) {
      const value = source?.[key];

      if (value && !isPlaceholderValue(value)) {
        return value;
      }
    }
  }

  return "";
}

function getConfiguredDatabaseUrl() {
  const backendEnv = parseEnvFile(backendEnvPath);
  return findConfiguredDatabaseUrl(process.env, backendEnv);
}

module.exports = {
  getConfiguredDatabaseUrl,
  getBackendEnv() {
    return parseEnvFile(backendEnvPath);
  }
};
