const path = require("path");
const { spawn } = require("child_process");

const { getBackendEnv, getConfiguredDatabaseUrl } = require("./dev-db");

async function main() {
  const configuredDatabaseUrl = getConfiguredDatabaseUrl();
  const childEnv = { ...getBackendEnv(), ...process.env };

  if (!configuredDatabaseUrl) {
    childEnv.USE_IN_MEMORY_DB = "true";
    console.log("No Supabase/Postgres DATABASE_URL found. Using the embedded in-memory development database.");
  }

  const child = spawn(
    process.execPath,
    [path.join(__dirname, "..", "backend", "src", "index.js")],
    {
      stdio: "inherit",
      env: childEnv
    }
  );

  process.on("SIGINT", () => {
    child.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    child.kill("SIGTERM");
  });

  child.on("exit", async (code) => {
    process.exit(code ?? 0);
  });

  child.on("error", async (error) => {
    console.error(error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
