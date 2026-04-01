const PLACEHOLDER_TOKENS = [
  "",
  "placeholder",
  "your_password",
  "your_database_url",
  "your_openai_key",
  "your_google_client_id",
  "your_google_client_secret",
  "your_linkedin_client_id",
  "your_linkedin_client_secret",
  "your_dribbble_client_id",
  "your_dribbble_client_secret",
  "super_secure_jwt_secret_change_this"
];

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function isPlaceholderValue(value) {
  const normalized = normalizeValue(value);

  if (!normalized) {
    return true;
  }

  if (PLACEHOLDER_TOKENS.includes(normalized)) {
    return true;
  }

  if (normalized.includes("[your-password]")) {
    return true;
  }

  return normalized.startsWith("your_");
}

function hasConfiguredCredentials(...values) {
  return values.every((value) => !isPlaceholderValue(value));
}

function getAuthProviderStatus() {
  return {
    emailPassword: true,
    google: hasConfiguredCredentials(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    ),
    linkedin: hasConfiguredCredentials(
      process.env.LINKEDIN_CLIENT_ID,
      process.env.LINKEDIN_CLIENT_SECRET,
      process.env.LINKEDIN_AUTH_REDIRECT_URI
    )
  };
}

module.exports = {
  getAuthProviderStatus,
  hasConfiguredCredentials,
  isPlaceholderValue
};
