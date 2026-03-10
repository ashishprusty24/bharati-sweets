import React from "react";
import { Card, Row, Col, Typography, Space, Tabs, Statistic, Spin } from "antd";
import {
  SendOutlined, TeamOutlined, BarChartOutlined,
  RiseOutlined, MessageOutlined, AimOutlined
} from "@ant-design/icons";
import useFetch from "../../hooks/useFetch";
import CustomerListTab from "./components/CustomerListTab";
import SocialAdsTab from "./components/SocialAdsTab";
import TemplatesTab from "./components/TemplatesTab";
import "./MarketingPage.css";

const { Title, Text } = Typography;

// ─────────────────────────────────────────────
// Stats Cards (API-driven)
// ─────────────────────────────────────────────
const STAT_ICONS = [
  { key: "messagesSent", title: "Messages Sent", suffix: "this month", icon: <SendOutlined />, color: "#25D366", bg: "linear-gradient(135deg,#dcfce7,#bbf7d0)" },
  { key: "totalContacts", title: "Customer Reach", suffix: "total contacts", icon: <TeamOutlined />, color: "#3b82f6", bg: "linear-gradient(135deg,#dbeafe,#bfdbfe)" },
  { key: "openRate", title: "Open Rate", suffix: "campaign open rate", icon: <BarChartOutlined />, color: "#f59e0b", bg: "linear-gradient(135deg,#fef3c7,#fde68a)", isPercent: true },
  { key: "newContacts", title: "New Contacts", suffix: "added this month", icon: <RiseOutlined />, color: "#8b5cf6", bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)" },
];

const MarketingPage = () => {
  const { data: stats, loading: statsLoading } = useFetch("/marketing/stats", { silent: true });

  return (
    <div className="marketing-page">
      {/* Header */}
      <div className="marketing-header">
        <Title level={1} className="marketing-title">Marketing Hub</Title>
        <Text className="marketing-subtitle">
          Message customers, run local ads, and grow Bharati Sweets' digital presence.
        </Text>
      </div>

      {/* Stats Row */}
      <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
        {STAT_ICONS.map((s) => {
          const value = stats?.[s.key] ?? 0;
          return (
            <Col xs={24} sm={12} lg={6} key={s.key}>
              <Card bordered={false} className="stat-card">
                <div className="stat-card-icon" style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <Text className="stat-card-label">{s.title}</Text>
                {statsLoading ? (
                  <Spin size="small" />
                ) : s.isPercent ? (
                  <Title level={2} className="stat-card-value">{value}%</Title>
                ) : (
                  <Statistic value={value} valueStyle={{ fontWeight: 800, fontSize: 28, color: "#1e293b" }} />
                )}
                <Text className="stat-card-suffix">{s.suffix}</Text>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Tabs */}
      <Tabs
        defaultActiveKey="customers"
        size="large"
        style={{ fontWeight: 600 }}
        items={[
          {
            key: "customers",
            label: <Space><TeamOutlined />Customer WhatsApp</Space>,
            children: <CustomerListTab />,
          },
          {
            key: "social-ads",
            label: <Space><AimOutlined />Local FB & Instagram Ads</Space>,
            children: <SocialAdsTab />,
          },
          {
            key: "templates",
            label: <Space><MessageOutlined />Templates & Broadcast</Space>,
            children: <TemplatesTab />,
          },
        ]}
      />
    </div>
  );
};

export default MarketingPage;
