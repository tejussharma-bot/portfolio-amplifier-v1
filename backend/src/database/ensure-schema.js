const { pool } = require("./config");
const { runMigrations } = require("./run-migrations");

let schemaReadyPromise = null;

async function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        await runMigrations(client);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    })().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }

  return schemaReadyPromise;
}

module.exports = {
  ensureSchema
};
