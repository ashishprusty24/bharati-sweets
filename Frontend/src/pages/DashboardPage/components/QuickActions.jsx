import React from "react";
import { Card, Typography, Row, Col, Button } from "antd";
import {
  CalendarOutlined,
  FileTextOutlined,
  InboxOutlined,
  BookOutlined,
  UserAddOutlined,
  NotificationOutlined,
  DownloadOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const actions = [
  { label: "New Event Order", path: "/event-orders", icon: <CalendarOutlined />, color: "#8b5cf6", bg: "#f3e8ff" },
  { label: "Add Expense", path: "/expenses", icon: <FileTextOutlined />, color: "#10b981", bg: "#d1fae5" },
  { label: "Inventory Entry", path: "/inventory", icon: <InboxOutlined />, color: "#3b82f6", bg: "#dbeafe" },
  { label: "Daily Ledger", path: "/daily-ledger", icon: <BookOutlined />, color: "#ef4444", bg: "#fee2e2" },
  { label: "Add Vendor", path: "/vendors", icon: <UserAddOutlined />, color: "#f97316", bg: "#ffedd5" },
  { label: "Marketing Campaign", path: "/marketing", icon: <NotificationOutlined />, color: "#ec4899", bg: "#fce7f3" },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <Card 
      bordered={false}
      style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.03)", background: "#ffffff", border: "1px solid #f1f5f9", height: "100%" }}
      bodyStyle={{ padding: 20 }}
    >
      <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 18, marginBottom: 16 }}>
        Quick Actions
      </Title>

      <Row gutter={[10, 10]}>
        {actions.map((act, idx) => (
          <Col span={8} key={idx}>
            <div 
              onClick={() => navigate(act.path)}
              style={{
                background: "#f8fafc",
                border: "1px solid #f1f5f9",
                borderRadius: 14,
                padding: "12px 6px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = act.color;
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#f1f5f9";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: act.bg,
                color: act.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16
              }}>
                {act.icon}
              </div>
              <Text strong style={{ fontSize: 11, color: "#334155", lineHeight: 1.2, textAlign: "center" }}>
                {act.label}
              </Text>
            </div>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Button 
          type="text" 
          icon={<DownloadOutlined style={{ color: "#8b5cf6" }} />} 
          onClick={() => navigate("/accounting")}
          style={{ color: "#8b5cf6", fontWeight: 600, fontSize: 12 }}
        >
          Download Reports
        </Button>
      </div>
    </Card>
  );
};

export default QuickActions;
