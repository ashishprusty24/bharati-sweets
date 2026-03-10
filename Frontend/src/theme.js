export const themeConfig = {
  token: {
    colorPrimary: "#1e2a38", // Deep Bharati Blue
    colorInfo: "#1e2a38",
    borderRadius: 12,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    colorBgContainer: "#ffffff",
    boxShadow: "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      fontWeight: 600,
      boxShadow: "0 2px 0 rgba(5, 145, 255, 0.1)",
    },
    Card: {
      borderRadiusLG: 16,
      boxShadowTertiary: "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
    },
    Table: {
      headerBg: "#f8fafc",
      headerColor: "#1e2a38",
      headerBorderRadius: 10,
    },
    Menu: {
      itemBorderRadius: 8,
      itemSelectedBg: "rgba(30, 42, 56, 0.1)",
      itemSelectedColor: "#1e2a38",
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 40,
    },
  },
};
