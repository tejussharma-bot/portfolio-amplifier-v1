const { cleanEnvValue, isPlaceholderValue } = require("./config");

const DEFAULT_PUBLIC_APP_ORIGIN = "https://portfolio-amplifier-v1.vercel.app";
const LOCALHOST_PATTERN = /^(localhost|127\.0\.0\.1)(:\d+)?$/i;

function firstHeaderValue(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return String(value || "").split(",")[0].trim();
}

function isLocalHost(host) {
  return LOCALHOST_PATTERN.test(String(host || "").trim());
}

function toOrigin(candidate) {
  const normalized = cleanEnvValue(candidate);

  if (!normalized || isPlaceholderValue(normalized)) {
    return null;
  }

  try {
    return new URL(normalized).origin;
  } catch (_error) {
    const host = normalized.replace(/^https?:\/\//i, "").replace(/\/$/, "");

    if (!host) {
      return null;
    }

    return `${isLocalHost(host) ? "http" : "https"}://${host}`;
  }
}

function getConfiguredRedirectUri(keys, predicate) {
  for (const key of keys) {
    const value = cleanEnvValue(process.env[key]);

    if (!value || isPlaceholderValue(value)) {
      continue;
    }

    if (typeof predicate === "function" && !predicate(value)) {
      continue;
    }

    return value;
  }

  return null;
}

function getConfiguredPublicAppOrigin() {
  const candidates = [
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    DEFAULT_PUBLIC_APP_ORIGIN
  ];

  for (const candidate of candidates) {
    const origin = toOrigin(candidate);

    if (origin) {
      return origin;
    }
  }

  return DEFAULT_PUBLIC_APP_ORIGIN;
}

function getAllowedHosts() {
  const configuredHosts = [
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL
  ]
    .map((candidate) => toOrigin(candidate))
    .filter(Boolean)
    .map((origin) => new URL(origin).host.toLowerCase());

  const explicitHosts = cleanEnvValue(process.env.ALLOWED_HOSTS)
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  return new Set([
    "localhost:3000",
    "127.0.0.1:3000",
    "localhost:3001",
    "127.0.0.1:3001",
    "portfolio-amplifier-v1.vercel.app",
    ...configuredHosts,
    ...explicitHosts
  ]);
}

function getRequestOrigin(req) {
  const host =
    firstHeaderValue(req?.headers?.["x-forwarded-host"]) ||
    firstHeaderValue(req?.headers?.host);

  if (!host) {
    return null;
  }

  const normalizedHost = host.toLowerCase();
  const allowedHosts = getAllowedHosts();
  const isAllowed = Array.from(allowedHosts).some(
    (allowedHost) =>
      normalizedHost === allowedHost || normalizedHost.endsWith(`.${allowedHost}`)
  );

  if (!isAllowed) {
    return null;
  }

  const forwardedProto = firstHeaderValue(req?.headers?.["x-forwarded-proto"]);
  const protocol =
    cleanEnvValue(forwardedProto) ||
    (isLocalHost(normalizedHost) ? "http" : "https");

  return `${protocol}://${normalizedHost}`;
}

function getPublicAppOrigin(req) {
  return getRequestOrigin(req) || getConfiguredPublicAppOrigin();
}

function buildFrontendUrl(req, pathname = "/dashboard/channels", searchParams = {}) {
  const target = new URL(pathname, getPublicAppOrigin(req));

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      target.searchParams.set(key, String(value));
    }
  });

  return target.toString();
}

function buildFrontendTokenRedirect(req, pathname = "/dashboard", token) {
  const target = new URL(pathname || "/dashboard", getPublicAppOrigin(req));

  target.searchParams.set("token", token);
  return target.toString();
}

function buildOAuthRedirectUri(req, pathname, envKeys, predicate) {
  const configured = getConfiguredRedirectUri(envKeys, predicate);

  if (configured) {
    return configured;
  }

  return new URL(pathname, getPublicAppOrigin(req)).toString();
}

module.exports = {
  buildFrontendTokenRedirect,
  buildFrontendUrl,
  buildOAuthRedirectUri,
  getConfiguredPublicAppOrigin,
  getConfiguredRedirectUri,
  getPublicAppOrigin,
  getRequestOrigin
};
