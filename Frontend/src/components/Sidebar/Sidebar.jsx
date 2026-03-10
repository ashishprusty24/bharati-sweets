import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Layout, Menu, Drawer, Grid } from "antd";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  UserOutlined,
  DollarOutlined,
  PieChartOutlined,
  TeamOutlined,
  CreditCardOutlined,
  SettingOutlined,
  CloseOutlined,
  WalletOutlined,
  ShareAltOutlined,
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
      icon: <ShoppingCartOutlined />,
      name: "Event Orders",
    },
    { key: "/inventory", icon: <ShopOutlined />, name: "Inventory" },
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
    console.log(clickedItem);

    if (clickedItem) {
      setPageTitle(clickedItem.name);
      console.log("Selected Menu Item:", clickedItem.name);
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

  return (
    <>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          collapsedWidth={80}
          width={220}
          style={{
            background: "#0f172a", // Deeper Blue/Slate
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            boxShadow: "4px 0 24px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                padding: "4px",
                borderRadius: "16px",
                overflow: "hidden",
                background: "white",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
                height: collapsed ? 48 : 70,
                width: collapsed ? 48 : 120,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease"
              }}
            >
              <img 
                src="/assets/logo.jpeg" 
                alt="Logo" 
                style={{ 
                  height: "100%", 
                  width: "100%", 
                  objectFit: "contain",
                  borderRadius: "12px"
                }} 
              />
            </div>
            {!collapsed && <div style={{ color: "#cbd5e1", fontSize: 10, marginTop: 12, fontWeight: 700, letterSpacing: 1.5 }}>BHARATI SWEETS</div>}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ 
              background: "transparent", 
              borderRight: 0,
              padding: "0 8px"
            }}
            onClick={handleMenuClick}
            inlineIndent={16}
          />
        </Sider>
      )}

      <Drawer
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img 
                src="/assets/logo.jpeg" 
                alt="Logo" 
                style={{ 
                  height: "32px", 
                  width: "32px", 
                  objectFit: "contain",
                  borderRadius: "6px"
                }} 
              />
              <span style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>
                Bharati Sweets
              </span>
            </div>
            <CloseOutlined
              onClick={() => setDrawerVisible(false)}
              style={{ fontSize: 18, cursor: "pointer", color: "#64748b" }}
            />
          </div>
        }
        headerStyle={{
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          padding: "16px 20px",
          borderBottom: "1px solid #f1f5f9",
        }}
        bodyStyle={{ padding: "8px" }}
        style={{ 
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
        }}
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        closable={false}
        width={280}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ height: "100%", borderRight: 0, background: "transparent" }}
          onClick={handleMenuClick}
        />
      </Drawer>
    </>
  );
};

export default Sidebar;
