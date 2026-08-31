const env = process.env.ENV || process.env.NODE_ENV || "dev";

const API_BASE_URL =
  env === "dev" || env === "development"
    ? `http://localhost:${process.env.PORT || 5000}`
    : env === "qa" || env === "staging"
      ? "https://bharati-sweets-backend.onrender.com"
      : "https://bharati-sweets-prod.onrender.com";

module.exports = { API_BASE_URL, env };
