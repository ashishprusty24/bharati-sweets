import React from "react";
import { Row, Col, Card, Statistic, Progress, Typography } from "antd";
import {
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

const AccountingSummary = ({ financialData }) => {
  if (!financialData) return null;

  const cardStyles = [
    { 
      title: "Total Revenue", 
      value: `₹${financialData.totalRevenue?.toLocaleString() || 0}`, 
      desc: "Gross sales volume",
      icon: <DollarOutlined />, 
      color: "#10b981",
      bg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
      details: [
        { label: "Regular", value: `₹${(financialData.revenueDistribution?.regular || 0).toLocaleString()}` },
        { label: "Event", value: `₹${(financialData.revenueDistribution?.event || 0).toLocaleString()}` }
      ]
    },
    { 
      title: "Total Expenses", 
      value: `₹${financialData.totalExpenses?.toLocaleString() || 0}`, 
      desc: "Operating costs",
      icon: <ArrowDownOutlined />, 
      color: "#ef4444",
      bg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
      details: [
        { label: "Largest", value: `₹${Math.max(...Object.values(financialData.expenseDistribution || { zero: 0 })).toLocaleString()}` }
      ]
    },
    { 
      title: "Net Profit", 
      value: `₹${financialData.netProfit?.toLocaleString() || 0}`, 
      desc: `${financialData.profitMargin?.toFixed(1)}% margin`,
      icon: financialData.netProfit >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />, 
      color: financialData.netProfit >= 0 ? "#3b82f6" : "#f59e0b",
      bg: financialData.netProfit >= 0 ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
      progress: Math.abs(financialData.profitMargin || 0)
    },
  ];

  return (
    <Row gutter={[24, 24]}>
      {cardStyles.map((item, idx) => (
        <Col xs={24} md={8} key={idx}>
          <Card 
            bordered={false} 
            className="glass-card"
            style={{ borderRadius: 20, overflow: "hidden" }}
            bodyStyle={{ padding: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{
                background: item.bg,
                padding: "12px",
                borderRadius: "14px",
                display: "flex",
                color: item.color,
                fontSize: "24px",
              }}>
                {item.icon}
              </div>
            </div>
            
            <div style={{ marginTop: 20 }}>
              <Text style={{ color: "#64748b", fontWeight: 500, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {item.title}
              </Text>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: 28 }}>
                  {item.value}
                </Title>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
            </div>

            {item.details && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                {item.details.map((detail, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{detail.label}</Text>
                    <Text strong style={{ fontSize: 12 }}>{detail.value}</Text>
                  </div>
                ))}
              </div>
            )}

            {item.progress !== undefined && (
              <div style={{ marginTop: 24 }}>
                <Progress
                  percent={item.progress}
                  status={financialData.netProfit >= 0 ? "success" : "exception"}
                  format={() => `${item.progress.toFixed(1)}% Margin`}
                  strokeWidth={8}
                  strokeColor={item.color}
                />
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default AccountingSummary;
