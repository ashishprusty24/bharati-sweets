import React, { useState } from "react";
import DashboardSummary from "./components/DashboardSummary";
import SalesChart from "./components/SalesChart";
import ExpenseChart from "./components/ExpenseChart";
import PopularProducts from "./components/PopularProducts";
import PendingOrders from "./components/PendingOrders";
import OrderReminders from "./components/OrderReminders";
import LowStockDetails from "./components/LowStockDetails";

import { Row, Col, Typography, Space, Switch, Segmented } from "antd";

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [showPending, setShowPending] = useState(true);
  const [showLowStock, setShowLowStock] = useState(true);
  const [period, setPeriod] = useState("30d");

  return (
    <div className="dashboard-container" style={{ padding: "0 24px 40px", maxWidth: 1600, margin: "0 auto" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-end", 
        marginBottom: 48, 
        marginTop: 24,
        paddingBottom: 24,
        borderBottom: "1px solid #f1f5f9"
      }}>
        <div>
          <Title level={1} style={{ 
            margin: 0, 
            fontWeight: 800, 
            fontSize: 42,
            background: "linear-gradient(45deg, #0f172a 30%, #334155 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-1px"
          }}>
            Dashboard
          </Title>
          <Text style={{ color: "#64748b", fontSize: 16, fontWeight: 500 }}>
            Welcome back! Here's what's happening at Bharati Sweets.
          </Text>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 16 }}>
          <Segmented 
            options={[
              { label: "Last 30 Days", value: "30d" },
              { label: "Last 2 Years", value: "2y" }
            ]} 
            value={period}
            onChange={setPeriod}
            style={{ 
              background: "#f1f5f9", 
              borderRadius: "12px", 
              padding: "4px"
            }}
          />
          <div style={{ 
            background: "rgba(255, 255, 255, 0.8)", 
            backdropFilter: "blur(12px)",
            padding: "8px 24px", 
            borderRadius: "20px", 
            border: "1px solid #f1f5f9",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            display: "flex",
            gap: 32
          }}>
            <Space>
              <Text strong style={{ color: "#64748b", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>Low Stock:</Text>
              <Switch checked={showLowStock} onChange={setShowLowStock} size="small" />
            </Space>
            <Space>
              <Text strong style={{ color: "#64748b", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>Deliveries:</Text>
              <Switch checked={showPending} onChange={setShowPending} size="small" />
            </Space>
          </div>
        </div>
      </div>

      <DashboardSummary period={period} />

      <div style={{ marginTop: 64, marginBottom: 32 }}>
        <Title level={2} style={{ fontWeight: 800, margin: 0, fontSize: 28, color: "#1e293b", letterSpacing: "-0.5px" }}>
          Analytics & Insights
        </Title>
      </div>
      
      <Row gutter={[32, 32]}>
        <Col xs={24} xl={16}>
          <SalesChart period={period} />
        </Col>
        <Col xs={24} xl={8}>
          <ExpenseChart />
        </Col>
      </Row>


      <Row gutter={[32, 32]} style={{ marginTop: 32 }}>
        <Col xs={24} lg={showLowStock ? 12 : 24}>
          <OrderReminders />
        </Col>
        {showLowStock && (
          <Col xs={24} lg={12}>
            <LowStockDetails />
          </Col>
        )}
      </Row>

      <Row gutter={[32, 32]} style={{ marginTop: 32 }}>
        <Col xs={24} lg={showPending ? 12 : 24}>
          <PopularProducts />
        </Col>
        {showPending && (
          <Col xs={24} lg={12}>
            <PendingOrders />
          </Col>
        )}
      </Row>
    </div>
  );
};


export default DashboardPage;
