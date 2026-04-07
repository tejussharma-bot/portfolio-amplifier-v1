function getErrorMessage(error, fallback = "Unexpected server error") {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  if (Array.isArray(error.errors) && error.errors.length > 0) {
    const nestedMessages = error.errors
      .map((item) => getErrorMessage(item, ""))
      .filter(Boolean);

    if (nestedMessages.length > 0) {
      return nestedMessages.join("; ");
    }
  }

  if (error.code === "ECONNREFUSED") {
    return "Unable to connect to PostgreSQL. Set DATABASE_URL to your Supabase Postgres connection string or run the app with the embedded development database.";
  }

  if (typeof error.code === "string" && error.code.trim()) {
    return `Unexpected error (${error.code})`;
  }

  return fallback;
}

module.exports = {
  getErrorMessage
};
