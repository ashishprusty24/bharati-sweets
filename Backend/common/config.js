const env = "dev";

export const API_BASE_URL =
  env === "dev"
    ? "https://bharati-sweets-backend.onrender.com"
    : "https://bharati-sweets-prod.onrender.com";
