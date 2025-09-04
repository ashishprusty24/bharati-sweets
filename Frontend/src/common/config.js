const env = "prod";

export const API_BASE_URL =
  env === "dev"
    ? "https://bharati-sweets-backend.onrender.com/api"
    : "https://bharati-sweets-backend.onrender.com/api";
