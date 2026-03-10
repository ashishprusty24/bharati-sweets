import { message } from "antd";
import { PLATFORM_CONFIG, AVATAR_COLORS } from "./config";

/**
 * Safely copy text to clipboard with error handling
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback: textarea copy
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch (fallbackErr) {
      console.error("Clipboard copy failed:", fallbackErr);
      message.error("Could not copy to clipboard. Please copy manually.");
      return false;
    }
  }
};

/**
 * Open a platform-specific share window for the given message
 */
export const platformSend = async (platform, text, phone) => {
  const cfg = PLATFORM_CONFIG[platform];
  if (!text.trim()) {
    message.warning("Message cannot be empty.");
    return;
  }

  if (platform === "instagram") {
    const copied = await copyToClipboard(text);
    if (copied) {
      message.success("Message copied! Opening Instagram – paste into your post or story.");
    }
    window.open("https://www.instagram.com/", "_blank");
    return;
  }

  window.open(cfg.getUrl(text, phone), "_blank");
};

/**
 * Get initials from a name (max 2 chars)
 */
export function nameInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Get a deterministic avatar color from a name
 */
export function avatarColor(name = "") {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

/**
 * Format a number in Indian locale
 */
export function formatIndian(num) {
  return Number(num || 0).toLocaleString("en-IN");
}
