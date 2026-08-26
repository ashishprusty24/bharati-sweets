const env = "qa";

const API_BASE_URL =
  env === "dev"
    ? "http://localhost:5000"
    : env === "qa"
      ? "https://bharati-sweets-backend.onrender.com"
      : "https://bharati-sweets-prod.onrender.com";

module.exports = { API_BASE_URL };

