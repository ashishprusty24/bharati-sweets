import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Layout, Menu, Drawer, Grid } from "antd";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
  CloseOutlined,
  WalletOutlined,
  ShareAltOutlined,
  CalendarOutlined,
  InboxOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;
const { useBreakpoint } = Grid;

const Sidebar = ({
  collapsed,
  setCollapsed,
  drawerVisible,
  setDrawerVisible,
  setPageTitle,
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const location = useLocation();

  const menuItems = [
    { key: "/", icon: <DashboardOutlined />, name: "Dashboard" },
    {
      key: "/regular-orders",
      icon: <ShoppingCartOutlined />,
      name: "Regular Orders",
    },
    {
      key: "/event-orders",
      icon: <CalendarOutlined />,
      name: "Event Orders",
    },
    { key: "/inventory", icon: <InboxOutlined />, name: "Inventory" },
    { key: "/expenses", icon: <ShopOutlined />, name: "Expenses" },
    { key: "/accounting", icon: <DollarOutlined />, name: "Accounting" },
    { key: "/ledger", icon: <WalletOutlined />, name: "Daily Ledger" },
    { key: "/marketing", icon: <ShareAltOutlined />, name: "Marketing" },
    { key: "/vendors", icon: <UserOutlined />, name: "Vendors" },
    { key: "/staff", icon: <TeamOutlined />, name: "Staff" },
  ].map((item) => ({
    ...item,
    label: <Link to={item.key}>{item.name}</Link>,
  }));

  const handleMenuClick = ({ key }) => {
    const clickedItem = menuItems.find((item) => item.key === key);
    if (clickedItem) {
      setPageTitle(clickedItem.name);
      if (isMobile) {
        setDrawerVisible(false);
      }
    }
  };

  useEffect(() => {
    const clickedItem = menuItems.find(
      (item) => item.key === location.pathname
    );
    if (clickedItem) {
      setPageTitle(clickedItem.name);
    }
  }, []);

  // Shared menu component for DRY
  const renderMenu = (extraStyle = {}) => (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      style={{
        background: "transparent",
        borderRight: 0,
        padding: "0 8px",
        ...extraStyle,
      }}
      onClick={handleMenuClick}
      inlineIndent={16}
    />
  );

  // Logo section for both desktop and mobile drawer
  const renderLogo = (isCollapsed = false, size = "normal") => {
    const logoSize = isCollapsed ? 42 : size === "small" ? 40 : 70;
    const containerSize = isCollapsed ? 48 : size === "small" ? 46 : 80;

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isCollapsed ? 0 : 14,
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}
      >
        <div
          style={{
            height: containerSize,
            width: containerSize,
            minWidth: containerSize,
            borderRadius: 14,
            overflow: "hidden",
            background: "rgba(255,255,255,0.12)",
            border: "2px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          }}
        >
          <img
            src="/assets/logo.jpeg"
            alt="Bharati Sweets"
            style={{
              height: logoSize,
              width: logoSize,
              objectFit: "cover",
              borderRadius: 10,
            }}
          />
        </div>
        {!isCollapsed && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              transition: "opacity 0.3s ease",
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: size === "small" ? 16 : 17,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: 0.3,
              }}
            >
              Bharati
            </span>
            <span
              style={{
                color: "#94a3b8",
                fontSize: size === "small" ? 11 : 11,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              SWEETS
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          collapsedWidth={80}
          width={240}
          trigger={null}
          className="premium-sidebar"
          style={{
            background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            boxShadow: "4px 0 30px rgba(0,0,0,0.12)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Logo area */}
          <div
            style={{
              padding: collapsed ? "20px 8px" : "24px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {renderLogo(collapsed)}
          </div>

          {/* Menu */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              paddingTop: 12,
            }}
          >
            {renderMenu()}
          </div>

          {/* Bottom collapse toggle */}
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{
              padding: "14px 16px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
              fontSize: 12,
              fontWeight: 500,
              gap: 8,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ fontSize: 16 }}>
              {collapsed ? "»" : "«"}
            </span>
            {!collapsed && <span>Collapse</span>}
          </div>
        </Sider>
      )}

      {/* ─── MOBILE DRAWER ─── */}
      <Drawer
        title={null}
        headerStyle={{ display: "none" }}
        bodyStyle={{ padding: 0, background: "transparent" }}
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        closable={false}
        width={280}
        styles={{
          wrapper: { boxShadow: "10px 0 40px rgba(0,0,0,0.2)" },
        }}
        style={{
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        }}
        className="mobile-sidebar-drawer"
      >
        {/* Drawer Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 20px 16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {renderLogo(false, "small")}
          <div
            onClick={() => setDrawerVisible(false)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              background: "rgba(255,255,255,0.08)",
              transition: "all 0.2s ease",
            }}
          >
            <CloseOutlined
              style={{ fontSize: 14, color: "#94a3b8" }}
            />
          </div>
        </div>

        {/* Drawer Menu */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingTop: 8,
          }}
        >
          {renderMenu()}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 12,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #e74c3c, #c0392b)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              SK
            </div>
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
                Shop Owner
              </div>
              <div style={{ color: "#64748b", fontSize: 11 }}>Admin</div>
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default Sidebar;
