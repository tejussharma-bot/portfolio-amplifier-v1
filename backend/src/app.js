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
const allowedOrigins = Array.from(
  new Set(
    [
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      ...(process.env.FRONTEND_URL || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ]
  )
);
const allowedOriginHosts = allowedOrigins
  .map((origin) => {
    try {
      return new URL(origin).host.toLowerCase();
    } catch (_error) {
      return null;
    }
  })
  .filter(Boolean);

function getRequestHost(req) {
  const forwardedHost = req.headers["x-forwarded-host"];
  const rawHost = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host;

  return String(rawHost || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
}

function isAllowedCorsOrigin(origin, req) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host.toLowerCase();
    const requestHost = getRequestHost(req);

    if (requestHost && originHost === requestHost) {
      return true;
    }

    return allowedOriginHosts.includes(originHost);
  } catch (_error) {
    return false;
  }
}

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;

  if (!isAllowedCorsOrigin(requestOrigin, req)) {
    const corsError = new Error("Origin not allowed by CORS");
    corsError.status = 403;
    next(corsError);
    return;
  }

  return cors({
    origin: requestOrigin || true,
    credentials: true
  })(req, res, next);
});
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
  res.status(error.status || 500).json({ error: getErrorMessage(error) });
});

module.exports = app;
