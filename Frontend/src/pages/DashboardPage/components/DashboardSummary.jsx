import React from "react";
import { Row, Col, Card, Typography, Spin, Tag } from "antd";
import {
  DollarCircleOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import useFetch from "../../../hooks/useFetch";

const { Title, Text } = Typography;

const DashboardSummary = ({ period = "30d" }) => {
  const { data: summary, loading } = useFetch(`/dashboard/summary?period=${period}`);

  const statCards = [
    { 
      title: "Total Revenue", 
      value: `₹${(summary?.totalSales || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 
      subValue: period === "2y" ? "Last 2 years total" : "+12.5% from last month",
      icon: <DollarCircleOutlined />, 
      color: "#1d4ed8",
      trend: period === "2y" ? "neutral" : "up",
      gradient: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"
    },
    { 
      title: "Net Profit", 
      value: `₹${(summary?.netProfit || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 
      subValue: "After all expenses",
      icon: <RiseOutlined />, 
      color: "#047857",
      trend: period === "2y" ? "neutral" : "up",
      gradient: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
    },
    { 
      title: "Pending Orders", 
      value: summary?.pendingOrders || 0, 
      subValue: "Requires fulfillment",
      icon: <ShoppingCartOutlined />, 
      color: "#b45309",
      trend: "neutral",
      gradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
    },
    { 
      title: "Low Stock", 
      value: summary?.lowStockItems || 0, 
      subValue: "Items to restock",
      icon: <WarningOutlined />, 
      color: "#b91c1c",
      trend: "down",
      gradient: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)"
    },
  ];

  if (loading) return <Spin style={{ width: "100%", padding: 60 }} />;

  return (
    <Row gutter={[24, 24]}>
      {statCards.map((item, idx) => (
        <Col xs={24} sm={12} lg={6} key={idx}>
          <Card 
            bordered={false} 
            className="stat-card premium-shadow"
            style={{ 
              borderRadius: 24,
              overflow: "hidden",
              background: "#ffffff",
              border: "1px solid #f1f5f9"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{
                background: item.gradient,
                padding: "12px",
                borderRadius: "16px",
                color: item.color,
                fontSize: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
              }}>
                {item.icon}
              </div>
              <Tag color={item.trend === "up" ? "success" : item.trend === "down" ? "error" : "warning"} bordered={false} style={{ borderRadius: 12, fontWeight: 600 }}>
                {item.trend === "up" ? "↑ 12%" : item.trend === "down" ? "Action Needed" : item.trend === "neutral" ? "Active" : "Stable"}
              </Tag>
            </div>
            <div style={{ marginTop: 20 }}>
              <Text style={{ color: "#64748b", fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                {item.title}
              </Text>
              <div style={{ marginTop: 4 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800, fontSize: 28, color: "#1e293b" }}>
                  {item.value}
                </Title>
              </div>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 4, display: "block" }}>{item.subValue}</Text>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default DashboardSummary;
