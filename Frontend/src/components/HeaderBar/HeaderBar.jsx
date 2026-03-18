"use client";
import React from "react";
import {
  Layout,
  Typography,
  Avatar,
  Button,
  Badge,
  Dropdown,
  Grid,
} from "antd";
import {
  MenuOutlined,
  BellOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

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
  pageTitle,
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const navigate = useNavigate();

  const menuItems = [
    {
      key: "1",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => navigate("/working-on-it"),
    },
    {
      key: "2",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => navigate("/working-on-it"),
    },
    { type: "divider" },
    {
      key: "3",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: () => navigate("/login"), // Note: Assumes logout leads to login, but kept the text label pattern
      danger: true,
    },
  ];

  return (
    <Header
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: isMobile ? "0 12px" : "0 28px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 10,
        height: isMobile ? 56 : 64,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Left Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          minWidth: 0,
          gap: isMobile ? 10 : 16,
        }}
      >
        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: isMobile ? 18 : 16 }} />}
          onClick={() => {
            if (isMobile) {
              setDrawerVisible(true);
            } else {
              setCollapsed(!collapsed);
            }
          }}
          style={{
            width: isMobile ? 40 : 38,
            height: isMobile ? 40 : 38,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.04)",
            border: "none",
            transition: "all 0.2s ease",
          }}
        />

        <div style={{ minWidth: 0, flex: 1 }}>
          <Title
            level={4}
            style={{
              margin: 0,
              fontSize: isMobile ? "17px" : "20px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: "#0f172a",
              letterSpacing: "-0.3px",
              lineHeight: isMobile ? "56px" : "64px",
            }}
          >
            {pageTitle}
          </Title>
        </div>
      </div>

      {/* Right Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 6 : 12,
          flexShrink: 0,
        }}
      >
        {/* Search button - desktop only */}
        {!isMobile && (
          <Button
            type="text"
            icon={<SearchOutlined style={{ fontSize: 16, color: "#64748b" }} />}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15, 23, 42, 0.04)",
              border: "none",
            }}
          />
        )}

        {/* Notification bell */}
        <Badge count={5} size="small" offset={[-2, 2]}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: isMobile ? 18 : 17, color: "#64748b" }} />}
            onClick={() => navigate("/working-on-it")}
            style={{
              width: isMobile ? 40 : 38,
              height: isMobile ? 40 : 38,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15, 23, 42, 0.04)",
              border: "none",
            }}
          />
        </Badge>

        {/* User avatar dropdown */}
        <Dropdown
          menu={{ items: menuItems }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              gap: 10,
              padding: isMobile ? "4px" : "4px 12px 4px 4px",
              borderRadius: 12,
              transition: "all 0.2s ease",
              background: "transparent",
              marginLeft: isMobile ? 2 : 4,
            }}
          >
            <Avatar
              style={{
                background: "linear-gradient(135deg, #e74c3c, #c0392b)",
                verticalAlign: "middle",
                fontWeight: 700,
                fontSize: 13,
                boxShadow: "0 2px 8px rgba(231, 76, 60, 0.3)",
              }}
              size={isMobile ? 34 : 36}
            >
              SK
            </Avatar>
            {!isMobile && (
              <div style={{ lineHeight: 1.3 }}>
                <Text
                  strong
                  style={{
                    fontSize: 13,
                    display: "block",
                    color: "#1e293b",
                  }}
                >
                  Shop Owner
                </Text>
                <Text
                  type="secondary"
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "#94a3b8",
                    lineHeight: 1.2,
                  }}
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
