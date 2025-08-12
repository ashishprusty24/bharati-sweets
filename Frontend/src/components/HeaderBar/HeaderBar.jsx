"use client";
import React, { useEffect } from "react";
import {
  Layout,
  Typography,
  DatePicker,
  Avatar,
  Button,
  Badge,
  Dropdown,
  Grid,
  Switch,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  BulbOutlined,
} from "@ant-design/icons";

const { Header } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const HeaderBar = ({
  collapsed,
  setCollapsed,
  drawerVisible,
  setDrawerVisible,
  isDark,
  toggleTheme,
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const menuItems = [
    { key: "1", label: <a href="/profile">Profile</a> },
    { key: "2", label: <a href="/settings">Settings</a> },
    { key: "3", label: <a href="/logout">Logout</a> },
  ];

  return (
    <Header
      style={{
        background: "white",
        padding: isMobile ? "0 8px" : "0 24px",
        boxShadow: "0 1px 4px rgba(0,21,41,.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 10,
        height: 64,
      }}
    >
      {/* Left Section */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => {
            if (isMobile) {
              setDrawerVisible(true);
            } else {
              setCollapsed(!collapsed);
            }
          }}
          style={{ marginRight: isMobile ? 0 : 16 }}
        />

        <Title level={4} style={{ margin: 0 }}>
          Dashboard
        </Title>
      </div>

      {/* Right Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 12 : 24, // ✅ reduce gap on mobile
        }}
      >
        {!isMobile && <DatePicker.RangePicker style={{ width: 220 }} />}

        {/* <Switch
          checkedChildren={<BulbOutlined />}
          unCheckedChildren={<BulbOutlined />}
          checked={isDark}
          onChange={toggleTheme}
        /> */}

        <Badge count={5} size="small">
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: 18 }} />}
            size="large"
          />
        </Badge>

        <Dropdown
          menu={{ items: menuItems }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <div
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <Avatar
              style={{ backgroundColor: "#e74c3c", verticalAlign: "middle" }}
              size="default"
            >
              SK
            </Avatar>
            {!isMobile && (
              <div style={{ marginLeft: 8 }}>
                <Text strong>Shop Owner</Text>
                <Text
                  type="secondary"
                  style={{ display: "block", fontSize: 12 }}
                >
                  Admin
                </Text>
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default HeaderBar;
