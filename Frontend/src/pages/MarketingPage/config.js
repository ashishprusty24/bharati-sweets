// ─────────────────────────────────────────────
// Platform Configuration (no JSX — icons rendered in components)
// ─────────────────────────────────────────────
export const PLATFORM_CONFIG = {
  whatsapp: {
    label: "WhatsApp",
    iconName: "WhatsAppOutlined",
    color: "#25D366",
    bg: "#dcfce7",
    textColor: "#166534",
    getUrl: (text, phone) =>
      phone
        ? `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  facebook: {
    label: "Facebook",
    iconName: "FacebookOutlined",
    color: "#1877F2",
    bg: "#dbeafe",
    textColor: "#1e40af",
    getUrl: (text) =>
      `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}&u=${encodeURIComponent("https://bharatisweets.in")}`,
  },
  instagram: {
    label: "Instagram",
    iconName: "InstagramOutlined",
    color: "#E1306C",
    bg: "#fce7f3",
    textColor: "#9d174d",
    getUrl: null,
  },
};

// ─────────────────────────────────────────────
// Ad Objectives for Social Ads
// ─────────────────────────────────────────────
export const AD_OBJECTIVES = [
  { value: "AWARENESS", label: "Brand Awareness", desc: "Show your brand to as many nearby people as possible", icon: "👁️" },
  { value: "REACH", label: "Reach", desc: "Maximise the number of people who see your ad", icon: "📡" },
  { value: "TRAFFIC", label: "Traffic", desc: "Drive people to your page or WhatsApp", icon: "🔗" },
  { value: "ENGAGEMENT", label: "Engagement", desc: "Get likes, comments and shares on your post", icon: "💬" },
  { value: "MESSAGES", label: "Messages", desc: "Get customers to message you on WhatsApp or Messenger", icon: "📩" },
];

// ─────────────────────────────────────────────
// Avatar Colors
// ─────────────────────────────────────────────
export const AVATAR_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

// ─────────────────────────────────────────────
// Customer Segment Config
// ─────────────────────────────────────────────
export const SEGMENT_CONFIG = {
  All: { color: "#64748b", label: "All" },
  VIP: { color: "#f59e0b", label: "⭐ VIP" },
  Frequent: { color: "#3b82f6", label: "🔄 Frequent" },
  Wholesale: { color: "#8b5cf6", label: "📦 Wholesale" },
  Inactive: { color: "#ef4444", label: "💤 Inactive" },
  Regular: { color: "#10b981", label: "👤 Regular" },
};

// ─────────────────────────────────────────────
// Bulk send limits
// ─────────────────────────────────────────────
export const MAX_POPUP_TABS = 5;
