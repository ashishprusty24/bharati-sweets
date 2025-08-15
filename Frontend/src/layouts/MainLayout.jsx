import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Layout, Grid, ConfigProvider, theme as antdTheme } from "antd";
import Sidebar from "../components/Sidebar/Sidebar";
import HeaderBar from "../components/HeaderBar/HeaderBar";

const { useBreakpoint } = Grid;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [pageTitle, setPageTitle] = useState(null);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#f39c12",
          colorBgLayout: isDark ? "#141414" : "#f5f5f5",
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          drawerVisible={drawerVisible}
          setDrawerVisible={setDrawerVisible}
          setPageTitle={setPageTitle}
        />
        <Layout
          style={{
            marginLeft: isMobile ? 0 : collapsed ? 80 : 220,
            transition: "all 0.2s ease",
          }}
        >
          <HeaderBar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            drawerVisible={drawerVisible}
            setDrawerVisible={setDrawerVisible}
            toggleTheme={toggleTheme}
            isDark={isDark}
            pageTitle={pageTitle}
          />
          <Layout.Content
            style={{
              padding: "24px",
              background: "#f0f2f5",
              minHeight: "calc(100vh - 64px)",
            }}
          >
            <Outlet /> {/* This renders the child route */}
          </Layout.Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AppLayout;
