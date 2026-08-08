const env = process.env.NODE_ENV === "production" ? "qa" : "dev";

export const API_BASE_URL =
  env === "dev"
    ? "http://localhost:5000/api"
    : env === "qa"
    ? "https://bharati-sweets-backend.onrender.com/api"
    : "https://bharati-sweets-prod.onrender.com/api";

// https://bharati-sweets-backend.onrender.com/api
// https://bharati-sweets-prod.onrender.com/api
// http://localhost:5000/api

