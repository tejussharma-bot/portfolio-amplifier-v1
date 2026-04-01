const { pool } = require("./config");
const { runMigrations } = require("./run-migrations");

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await runMigrations(client);

    await client.query("COMMIT");
    console.log("Database tables created successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration error:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
