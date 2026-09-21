const env = (import.meta.env.VITE_ENV || "qa").toLowerCase();

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (env === "dev" || env === "development"
    ? "http://localhost:5000/api"
    : env === "prod" || env === "production"
      ? "https://bharati-sweets-prod.onrender.com/api"
      : "https://bharati-sweets-backend.onrender.com/api");

