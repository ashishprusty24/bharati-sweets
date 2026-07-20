const env = "prod";

const API_BASE_URL =
  env === "dev"
    ? "http://localhost:5000"
    : "https://bharati-sweets-prod.onrender.com";

module.exports = { API_BASE_URL };

