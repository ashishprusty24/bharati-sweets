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
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: isMobile ? "0 16px" : "0 28px",
        paddingTop: "env(safe-area-inset-top, 0px)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 10,
        height: "calc(64px + env(safe-area-inset-top, 0px))",
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
          gap: isMobile ? 12 : 16,
        }}
      >
        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: isMobile ? 16 : 18, color: "#1e293b" }} />}
          onClick={() => {
            if (isMobile) {
              setDrawerVisible(true);
            } else {
              setCollapsed(!collapsed);
            }
          }}
          style={{
            width: isMobile ? 36 : 40,
            height: isMobile ? 36 : 40,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.05)",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
        />

        <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center" }}>
          <Title
            level={3}
            className="header-page-title"
            style={{
              margin: 0,
              fontSize: isMobile ? "22px" : "22px",
              fontWeight: 800,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: "#0f172a",
              letterSpacing: "-0.3px",
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
          gap: isMobile ? 8 : 14,
          flexShrink: 0,
        }}
      >
        {/* Search button - desktop only */}
        {!isMobile && (
          <Button
            type="text"
            icon={<SearchOutlined style={{ fontSize: 18, color: "#64748b" }} />}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15, 23, 42, 0.05)",
              border: "1px solid rgba(15, 23, 42, 0.08)",
            }}
          />
        )}

        {/* Notification bell */}
        <Badge count={5} size="small" offset={[-2, 2]}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: isMobile ? 16 : 18, color: "#475569" }} />}
            onClick={() => navigate("/working-on-it")}
            style={{
              width: isMobile ? 36 : 40,
              height: isMobile ? 36 : 40,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15, 23, 42, 0.05)",
              border: "1px solid rgba(15, 23, 42, 0.08)",
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
              gap: 8,
              padding: isMobile ? "2px" : "4px 12px 4px 4px",
              borderRadius: 10,
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
                boxShadow: "0 2px 6px rgba(231, 76, 60, 0.3)",
              }}
              size={isMobile ? 34 : 40}
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
