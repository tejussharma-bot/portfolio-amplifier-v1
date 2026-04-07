const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require("passport");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const amplifyRoutes = require("./routes/amplify");
const channelRoutes = require("./routes/channels");
const ormRoutes = require("./routes/orm");
const dashboardRoutes = require("./routes/dashboard");
const settingsRoutes = require("./routes/settings");
const { configurePassport } = require("./config/passport");
const { query } = require("./database/config");
const { ensureSchema } = require("./database/ensure-schema");
const { getErrorMessage } = require("./utils/errors");

configurePassport();

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get(["/health", "/api/health"], (_req, res) => {
  res.json({
    status: "ok",
    service: "portfolio-ai-backend"
  });
});

app.get("/api/health/db", async (_req, res) => {
  const startedAt = Date.now();

  try {
    await query("SELECT 1");

    return res.json({
      status: "ok",
      service: "portfolio-ai-backend",
      database: {
        status: "ok",
        latencyMs: Date.now() - startedAt
      }
    });
  } catch (error) {
    return res.status(503).json({
      status: "error",
      service: "portfolio-ai-backend",
      database: {
        status: "error",
        message: getErrorMessage(error, "Database check failed")
      }
    });
  }
});

app.use("/api", async (req, res, next) => {
  try {
    await ensureSchema();
    return next();
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/amplify", amplifyRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/orm", ormRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: getErrorMessage(error) });
});

module.exports = app;
