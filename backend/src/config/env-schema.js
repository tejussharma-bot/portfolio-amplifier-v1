const { channelCapabilities } = require("./channel-capabilities");

const envSchema = {
  auth: ["JWT_SECRET"],
  ai: ["AI_API_KEY", "AI_SERVICE_URL", "AI_MODEL"],
  storage: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "BLOB_READ_WRITE_TOKEN"],
  channels: Object.fromEntries(
    Object.values(channelCapabilities).map((capability) => [
      capability.platform,
      capability.envVars
    ])
  )
};

module.exports = {
  envSchema
};
