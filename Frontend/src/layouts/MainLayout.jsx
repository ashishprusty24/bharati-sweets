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
    <Layout style={{ minHeight: "100vh", background: "var(--bg-gradient)" }}>
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
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "transparent",
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
            padding: isMobile ? "16px" : "32px",
            minHeight: "calc(100vh - 64px)",
            background: "transparent",
          }}
        >
          <div className="fade-in">
            <Outlet />
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
