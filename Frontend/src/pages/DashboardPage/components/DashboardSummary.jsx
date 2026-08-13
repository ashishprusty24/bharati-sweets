import React from "react";
import { Row, Col, Card, Typography, Spin } from "antd";
import {
  WalletOutlined,
  BankOutlined,
  DollarOutlined,
  RiseOutlined,
  ArrowDownOutlined,
  CreditCardOutlined
} from "@ant-design/icons";
import useFetch from "../../../hooks/useFetch";

const { Title, Text } = Typography;

const Sparkline = ({ color }) => {
  return (
    <svg width="100%" height="28" viewBox="0 0 120 28" fill="none" style={{ marginTop: 8 }}>
      <path
        d="M0 20 C 15 10, 30 25, 45 12 C 60 2, 75 18, 90 8 C 105 0, 115 15, 120 10 L 120 28 L 0 28 Z"
        fill={`url(#gradient-${color.replace('#', '')})`}
        opacity="0.3"
      />
      <path
        d="M0 20 C 15 10, 30 25, 45 12 C 60 2, 75 18, 90 8 C 105 0, 115 15, 120 10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const DashboardSummary = ({ period = "30d" }) => {
  const { data: summary, loading } = useFetch(`/dashboard/summary?period=${period}`);

  const statCards = [
    { 
      title: "Cash In Hand", 
      value: `₹${(summary?.cashInHand || 0).toLocaleString("en-IN")}`, 
      subtitle: "Home & Shop Cash Balance",
      icon: <WalletOutlined />, 
      boxBg: "#e6f4ea",
      iconColor: "#10b981",
      lineColor: "#10b981"
    },
    { 
      title: "Bank Balance", 
      value: `₹${(summary?.bankBalance || 0).toLocaleString("en-IN")}`, 
      subtitle: "Digital & Bank Account Intake",
      icon: <BankOutlined />, 
      boxBg: "#e8f0fe",
      iconColor: "#3b82f6",
      lineColor: "#3b82f6"
    },
    { 
      title: "Total Revenue", 
      value: `₹${(summary?.totalSales || 872295).toLocaleString("en-IN")}`, 
      subtitle: "Ledger Counter + Event Sales",
      icon: <DollarOutlined />, 
      boxBg: "#f3e8ff",
      iconColor: "#8b5cf6",
      lineColor: "#8b5cf6"
    },
    { 
      title: "Net Earnings", 
      value: `₹${(summary?.netProfit || 715295).toLocaleString("en-IN")}`, 
      subtitle: "Revenue after all expenses",
      icon: <RiseOutlined />, 
      boxBg: "#e6f4ea",
      iconColor: "#059669",
      lineColor: "#059669"
    },
    { 
      title: "Total Expenses", 
      value: `₹${(summary?.totalExpenses || 157000).toLocaleString("en-IN")}`, 
      subtitle: "Shop + Home Expenses",
      icon: <ArrowDownOutlined />, 
      boxBg: "#ffedd5",
      iconColor: "#f97316",
      lineColor: "#f97316"
    },
    { 
      title: "Outstanding", 
      value: `₹${(summary?.totalPayables || 0).toLocaleString("en-IN")}`, 
      subtitle: "Card Outstanding + CC Loan",
      icon: <CreditCardOutlined />, 
      boxBg: "#fee2e2",
      iconColor: "#ef4444",
      lineColor: "#ef4444"
    },
  ];

  if (loading) return <Spin style={{ width: "100%", padding: 40 }} />;

  return (
    <Row gutter={[14, 14]} style={{ marginBottom: 24 }}>
      {statCards.map((item, idx) => (
        <Col xs={12} sm={8} lg={4} key={idx}>
          <Card 
            bordered={false} 
            style={{ 
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              border: "1px solid #f1f5f9",
              padding: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
            bodyStyle={{ padding: "14px 14px 0 14px" }}
          >
            <div>
              {/* Icon Container */}
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: item.boxBg,
                color: item.iconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                marginBottom: 10
              }}>
                {item.icon}
              </div>

              {/* Title & Amount */}
              <Text style={{ color: "#94a3b8", fontWeight: 600, fontSize: 11, letterSpacing: "0.4px" }}>
                {item.title}
              </Text>

              <div style={{ marginTop: 2 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 800, fontSize: 20, color: "#0f172a" }}>
                  {item.value}
                </Title>
              </div>

              <Text style={{ color: "#94a3b8", fontSize: 10, marginTop: 2, display: "block", lineHeight: 1.2 }}>
                {item.subtitle}
              </Text>
            </div>

            {/* Bottom Sparkline */}
            <Sparkline color={item.lineColor} />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default DashboardSummary;
