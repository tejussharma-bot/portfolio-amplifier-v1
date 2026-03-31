const PLACEHOLDER_TOKENS = [
  "",
  "placeholder",
  "your_password",
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

  return normalized.startsWith("your_");
}

function hasConfiguredCredentials(...values) {
  return values.every((value) => !isPlaceholderValue(value));
}

module.exports = {
  hasConfiguredCredentials,
  isPlaceholderValue
};
