const path = require("path");
const { spawn } = require("child_process");

const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);

const child = isRender
  ? spawn(process.execPath, [path.join(__dirname, "..", "backend", "src", "index.js")], {
      stdio: "inherit",
      env: process.env
    })
  : spawn(
      process.execPath,
      [require.resolve("next/dist/bin/next"), "start", "-p", process.env.PORT || "3001"],
      {
        stdio: "inherit",
        env: process.env
      }
    );

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
