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

app.get(["/health", "/api/health"], (_, res) => {
  res.json({
    status: "ok",
    service: "portfolio-ai-backend"
  });
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
  res.status(500).json({ error: "Unexpected server error" });
});

module.exports = app;
