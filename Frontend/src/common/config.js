const env = "dev";

export const API_BASE_URL =
  env === "dev"
    ? "http://localhost:5000/api"
    : "https://api.bharatisweets.com/api";
