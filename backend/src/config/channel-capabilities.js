const { cleanEnvValue } = require("../utils/config");

const LINKEDIN_API_VERSION = cleanEnvValue(process.env.LINKEDIN_API_VERSION) || "202603";

const channelCapabilities = {
  linkedin: {
    platform: "linkedin",
    label: "LinkedIn",
    productMode: "direct",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    apiBaseUrl: "https://api.linkedin.com/rest",
    apiVersionHeader: {
      name: "Linkedin-Version",
      value: LINKEDIN_API_VERSION
    },
    requiredScopes: {
      signIn: ["openid", "profile", "email"],
      publish: ["w_member_social"]
    },
    requiredHeaders: {
      "X-Restli-Protocol-Version": "2.0.0"
    },
    envVars: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LINKEDIN_REDIRECT_URI"],
    supportedActions: ["connect", "validate", "publish", "schedule", "export"],
    unsupportedActions: ["template-selection", "case-study-generation"],
    fallbackBehavior:
      "If posting permission is missing or rejected, keep the draft exportable and guide the user back to reconnect."
  },
  behance: {
    platform: "behance",
    label: "Behance",
    productMode: "export",
    authUrl: null,
    tokenUrl: null,
    apiBaseUrl: null,
    apiVersionHeader: null,
    requiredScopes: {
      signIn: [],
      publish: []
    },
    requiredHeaders: {},
    envVars: [],
    supportedActions: ["export", "copy-template", "open-destination"],
    unsupportedActions: ["direct-publish", "schedule"],
    fallbackBehavior:
      "Generate a Behance-ready export pack, copy-friendly section order, and open the manual publish flow."
  },
  dribbble: {
    platform: "dribbble",
    label: "Dribbble",
    productMode: "guided-upload",
    authUrl: "https://dribbble.com/oauth/authorize",
    tokenUrl: "https://dribbble.com/oauth/token",
    apiBaseUrl: "https://api.dribbble.com/v2",
    apiVersionHeader: null,
    requiredScopes: {
      signIn: ["public"],
      publish: ["upload"]
    },
    requiredHeaders: {},
    envVars: ["DRIBBBLE_CLIENT_ID", "DRIBBBLE_CLIENT_SECRET", "DRIBBBLE_REDIRECT_URI"],
    supportedActions: ["connect", "validate", "export", "guided-upload"],
    unsupportedActions: ["direct-publish-until-validated", "schedule"],
    fallbackBehavior:
      "Stay export-first until a compliant shot-render and upload pipeline is fully validated."
  },
  googlemybusiness: {
    platform: "googlemybusiness",
    label: "Google Business",
    productMode: "direct",
    authUrl: "https://accounts.google.com/oauth/authorize",
    tokenUrl: "https://oauth2.googleapis.com/token",
    apiBaseUrl: "https://mybusiness.googleapis.com",
    apiVersionHeader: null,
    requiredScopes: {
      signIn: [],
      publish: ["https://www.googleapis.com/auth/business.manage"]
    },
    requiredHeaders: {},
    envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_CHANNEL_REDIRECT_URI"],
    supportedActions: ["connect", "validate", "publish", "schedule", "export"],
    unsupportedActions: ["template-selection", "case-study-generation"],
    fallbackBehavior:
      "If account linking is valid but posting fails, preserve the export pack and explain the business-profile issue clearly."
  }
};

function getChannelCapability(platform) {
  return channelCapabilities[platform] || null;
}

function listChannelCapabilities() {
  return Object.values(channelCapabilities);
}

module.exports = {
  channelCapabilities,
  getChannelCapability,
  listChannelCapabilities
};
