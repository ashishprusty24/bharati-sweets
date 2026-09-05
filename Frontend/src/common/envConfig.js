/**
 * Environment Configuration and Dynamic Manifest / Icon Manager
 * Automatically configures PWA manifest, document title, and favicons
 * according to current environment (dev, qa, prod).
 */

export const getEnvironment = () => {
  // 1. Explicit Vite env override
  if (import.meta.env.VITE_ENV) {
    const e = import.meta.env.VITE_ENV.toLowerCase();
    if (e.includes("prod")) return "prod";
    if (e.includes("qa") || e.includes("staging")) return "qa";
    return "dev";
  }

  // 2. Runtime browser hostname inspection
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.")) {
      return "dev";
    }
    if (host.includes("qa") || host.includes("staging") || host.includes("dev")) {
      return "qa";
    }
    return "prod";
  }

  // 3. Vite MODE fallback
  const mode = (import.meta.env.MODE || "").toLowerCase();
  if (mode === "production") return "prod";
  if (mode === "staging" || mode === "qa") return "qa";
  return "dev";
};

export const getEnvironmentMetadata = () => {
  const env = getEnvironment();

  if (env === "dev") {
    return {
      env: "dev",
      appName: "Bharati Sweets (DEV)",
      shortName: "BS (DEV)",
      documentTitle: "🟢 [DEV] Bharati Sweets",
      themeColor: "#10b981",
      iconUrl: "/assets/icons/icon-dev.svg",
      icons: [
        {
          src: "/assets/icons/icon-dev.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any maskable",
        },
        {
          src: "/assets/icons/icon-192.webp",
          sizes: "192x192",
          type: "image/webp",
          purpose: "any maskable",
        },
        {
          src: "/assets/icons/icon-512.webp",
          sizes: "512x512",
          type: "image/webp",
          purpose: "any maskable",
        },
      ],
    };
  }

  if (env === "qa") {
    return {
      env: "qa",
      appName: "Bharati Sweets (QA)",
      shortName: "BS (QA)",
      documentTitle: "🟡 [QA] Bharati Sweets",
      themeColor: "#f59e0b",
      iconUrl: "/assets/icons/icon-qa.svg",
      icons: [
        {
          src: "/assets/icons/icon-qa.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any maskable",
        },
        {
          src: "/assets/icons/icon-192.webp",
          sizes: "192x192",
          type: "image/webp",
          purpose: "any maskable",
        },
        {
          src: "/assets/icons/icon-512.webp",
          sizes: "512x512",
          type: "image/webp",
          purpose: "any maskable",
        },
      ],
    };
  }

  // Default: Production
  return {
    env: "prod",
    appName: "Bharati Sweets",
    shortName: "Bharati Sweets",
    documentTitle: "Bharati Sweets - Management System",
    themeColor: "#0d7377",
    iconUrl: "/assets/bharati-sweets-icon.png",
    icons: [
      {
        src: "/assets/icons/icon-prod.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: "/assets/bharati-sweets-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/assets/icons/icon-192.webp",
        sizes: "192x192",
        type: "image/webp",
        purpose: "any maskable",
      },
      {
        src: "/assets/icons/icon-512.webp",
        sizes: "512x512",
        type: "image/webp",
        purpose: "any maskable",
      },
    ],
  };
};

/**
 * Applies dynamic manifest, favicon, theme color, and title to document head
 */
export const applyEnvironment = () => {
  if (typeof document === "undefined") return;

  const meta = getEnvironmentMetadata();

  // 1. Set document title
  document.title = meta.documentTitle;

  // 2. Set Favicon
  let favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }
  favicon.href = meta.iconUrl;
  favicon.type = meta.iconUrl.endsWith(".svg") ? "image/svg+xml" : "image/png";

  // 3. Set Theme Color
  let themeMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeMeta) {
    themeMeta = document.createElement("meta");
    themeMeta.name = "theme-color";
    document.head.appendChild(themeMeta);
  }
  themeMeta.content = meta.themeColor;

  // 4. Update or inject dynamic Web Manifest
  const manifestData = {
    name: meta.appName,
    short_name: meta.shortName,
    description: "Bharati Sweets Inventory & Business Management System",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: meta.themeColor,
    icons: meta.icons,
  };

  const manifestBlob = new Blob([JSON.stringify(manifestData, null, 2)], {
    type: "application/manifest+json",
  });
  const manifestUrl = URL.createObjectURL(manifestBlob);

  let manifestLink = document.querySelector('link[rel="manifest"]');
  if (!manifestLink) {
    manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    document.head.appendChild(manifestLink);
  }
  manifestLink.href = manifestUrl;
};
