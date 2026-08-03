"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  CreditCardOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;
const { useBreakpoint } = Grid;

const Sidebar = ({ collapsed, setCollapsed, drawerVisible, setDrawerVisible }) => {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const pathname = usePathname();

  const menuItems = [
    { key: "/", icon: <DashboardOutlined />, name: "Dashboard" },
    { key: "/event-orders", icon: <CalendarOutlined />, name: "Event Orders" },
    { key: "/inventory", icon: <InboxOutlined />, name: "Inventory" },
    { key: "/accounting", icon: <DollarOutlined />, name: "Accounting" },
    { key: "/ledger", icon: <WalletOutlined />, name: "Daily Ledger" },
    { key: "/credit-cards", icon: <CreditCardOutlined />, name: "Credit Cards" },
    { key: "/marketing", icon: <ShareAltOutlined />, name: "Marketing" },
    { key: "/vendors", icon: <UserOutlined />, name: "Vendors" },
    { key: "/staff", icon: <TeamOutlined />, name: "Staff" },
  ].map((item) => ({
    ...item,
    label: <Link href={item.key}>{item.name}</Link>,
  }));

  const renderMenu = () => (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[pathname]}
      items={menuItems}
      style={{ background: "transparent", borderRight: 0, padding: "0 8px" }}
      inlineIndent={16}
    />
  );

  return (
    <>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          collapsedWidth={80}
          width={240}
          trigger={null}
          style={{
            background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ padding: collapsed ? "20px 8px" : "24px 20px", color: "white", textAlign: "center", fontWeight: 700, fontSize: 18 }}>
            {collapsed ? "BS" : "Bharati Sweets"}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>{renderMenu()}</div>
        </Sider>
      )}
    </>
  );
};

export default Sidebar;
