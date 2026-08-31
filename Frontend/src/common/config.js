const env = import.meta.env.VITE_ENV || import.meta.env.MODE || "dev";

export const API_BASE_URL =
  env === "dev" || env === "development"
    ? "http://localhost:5000/api"
    : env === "qa" || env === "staging"
      ? "https://bharati-sweets-backend.onrender.com/api"
      : "https://bharati-sweets-prod.onrender.com/api";
