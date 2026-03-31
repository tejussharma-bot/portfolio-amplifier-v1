const { spawnSync } = require("child_process");

const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);

if (isRender) {
  console.log("Render environment detected. Skipping frontend build for backend service.");
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "build"],
  {
    stdio: "inherit",
    env: process.env
  }
);

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
