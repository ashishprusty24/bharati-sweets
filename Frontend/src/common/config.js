const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 1. Runtime browser hostname inspection (Dynamic & bulletproof on deployed sites)
  if (typeof window !== "undefined" && window.location) {
    const host = window.location.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.")) {
      return "http://localhost:5000/api";
    }
    if (host.includes("qa") || host.includes("staging") || host.includes("dev")) {
      return "https://bharati-sweets-backend.onrender.com/api";
    }
    if (host.includes("prod")) {
      return "https://bharati-sweets-prod.onrender.com/api";
    }
  }

  // 2. Vite ENV fallback
  const env = (import.meta.env.VITE_ENV || "").toLowerCase();
  if (env === "dev" || env === "development") {
    return "http://localhost:5000/api";
  }
  if (env === "prod" || env === "production") {
    return "https://bharati-sweets-prod.onrender.com/api";
  }

  // Default to QA / main backend
  return "https://bharati-sweets-backend.onrender.com/api";
};

export const API_BASE_URL = getApiBaseUrl();


