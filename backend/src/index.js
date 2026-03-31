const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require("passport");

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const amplifyRoutes = require("./routes/amplify");
const channelRoutes = require("./routes/channels");
const ormRoutes = require("./routes/orm");
const dashboardRoutes = require("./routes/dashboard");
const settingsRoutes = require("./routes/settings");
const { configurePassport } = require("./config/passport");

dotenv.config();
configurePassport();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true
  })
);
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.get("/health", (_, res) => {
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

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
