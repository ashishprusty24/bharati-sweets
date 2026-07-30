"use client";

import React from "react";
import { ConfigProvider } from "antd";
import MainLayout from "../components/layouts/MainLayout";
import "./globals.css";

const themeConfig = {
  token: {
    colorPrimary: "#1e2a38",
    borderRadius: 8,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "'Inter', sans-serif" }}>
        <ConfigProvider theme={themeConfig}>
          <MainLayout>{children}</MainLayout>
        </ConfigProvider>
      </body>
    </html>
  );
}
