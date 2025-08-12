import React from "react";
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
} from "@ant-design/icons";

const { Sider } = Layout;
const { useBreakpoint } = Grid;

const Sidebar = ({
  collapsed,
  setCollapsed,
  drawerVisible,
  setDrawerVisible,
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const location = useLocation(); // For setting active menu item

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: "/regular-orders",
      icon: <ShoppingCartOutlined />,
      label: <Link to="/regular-orders">Regular Orders</Link>,
    },
    {
      key: "/event-orders",
      icon: <ShoppingCartOutlined />,
      label: <Link to="/event-orders">Event Orders</Link>,
    },
    {
      key: "/inventory",
      icon: <ShopOutlined />,
      label: <Link to="/inventory">Inventory</Link>,
    },
    {
      key: "/expenses",
      icon: <ShopOutlined />,
      label: <Link to="/expenses">Expenses</Link>,
    },
    {
      key: "/accounting",
      icon: <DollarOutlined />,
      label: <Link to="/accounting">Accounting</Link>,
    },
    {
      key: "/vendors",
      icon: <UserOutlined />,
      label: <Link to="/vendors">Vendors</Link>,
    },
    {
      key: "/credit-cards",
      icon: <CreditCardOutlined />,
      label: <Link to="/credit-cards">Credit Cards</Link>,
    },
    {
      key: "/marketing",
      icon: <PieChartOutlined />,
      label: <Link to="/marketing">Marketing</Link>,
    },
    {
      key: "/staff",
      icon: <TeamOutlined />,
      label: <Link to="/staff">Staff</Link>,
    },
    {
      key: "/settings",
      icon: <SettingOutlined />,
      label: <Link to="/settings">Settings</Link>,
    },
  ];

  return (
    <>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          collapsedWidth={80}
          style={{
            background: "#1e2a38",
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: "16px",
              textAlign: "center",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              fontSize: collapsed ? 18 : 20,
            }}
          >
            {collapsed ? "BS" : "Bharati Sweets"}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ background: "transparent", borderRight: 0 }}
          />
        </Sider>
      )}

      {/* Drawer for mobile */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ height: "100%", borderRight: 0 }}
        />
      </Drawer>
    </>
  );
};

export default Sidebar;
