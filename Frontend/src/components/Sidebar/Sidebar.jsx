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
    { key: "/vendors", icon: <UserOutlined />, name: "Vendors" },
    {
      key: "/credit-cards",
      icon: <CreditCardOutlined />,
      name: "Credit Cards",
    },
    { key: "/marketing", icon: <PieChartOutlined />, name: "Marketing" },
    { key: "/staff", icon: <TeamOutlined />, name: "Staff" },
    { key: "/settings", icon: <SettingOutlined />, name: "Settings" },
  ].map((item) => ({
    ...item,
    label: <Link to={item.key}>{item.name}</Link>,
  }));

  const handleMenuClick = ({ key }) => {
    const clickedItem = menuItems.find((item) => item.key === key);
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
    setPageTitle(clickedItem.name);
  }, []);

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
            onClick={handleMenuClick}
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
            <span style={{ fontSize: 18, fontWeight: "600", color: "#333" }}>
              Bharati Sweets
            </span>
            <CloseOutlined
              onClick={() => setDrawerVisible(false)}
              style={{ fontSize: 18, cursor: "pointer", color: "#555" }}
            />
          </div>
        }
        headerStyle={{
          background: "#f9f9f9",
          padding: "12px 16px",
          borderBottom: "1px solid #eee",
        }}
        bodyStyle={{ padding: 0 }}
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        closable={false}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ height: "100%", borderRight: 0 }}
          onClick={handleMenuClick}
        />
      </Drawer>
    </>
  );
};

export default Sidebar;
