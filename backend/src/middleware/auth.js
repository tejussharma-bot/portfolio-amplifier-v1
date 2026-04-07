const jwt = require("jsonwebtoken");
const { isPlaceholderValue } = require("../utils/config");

// Validate JWT_SECRET at module load time
if (!process.env.JWT_SECRET || isPlaceholderValue(process.env.JWT_SECRET)) {
  throw new Error("JWT_SECRET is not configured. Please set a secure JWT secret in environment variables.");
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: payload.userId,
      email: payload.email
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

module.exports = {
  authenticateToken,
  signToken
};
