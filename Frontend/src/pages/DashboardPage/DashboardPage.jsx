import React, { useState } from "react";
import DashboardSummary from "./components/DashboardSummary";
import SalesChart from "./components/SalesChart";
import ExpenseChart from "./components/ExpenseChart";
import PopularProducts from "./components/PopularProducts";
import PendingOrders from "./components/PendingOrders";
import OrderReminders from "./components/OrderReminders";
import LowStockDetails from "./components/LowStockDetails";

import { Row, Col, Typography, Space, Switch, Segmented } from "antd";
import "./DashboardPage.css";

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [showPending, setShowPending] = useState(true);
  const [showLowStock, setShowLowStock] = useState(true);
  const [period, setPeriod] = useState("30d");

  return (
    <div className="dashboard-container">
      <Row justify="space-between" align="bottom" className="dashboard-header" gutter={[16, 24]}>
        <Col xs={24} md={14} lg={16}>
          <Title level={1} className="dashboard-title">
            Dashboard
          </Title>
          <Text className="dashboard-subtitle">
            Welcome back! Here's what's happening at Bharati Sweets.
          </Text>
        </Col>
        <Col xs={24} md={10} lg={8} className="header-controls">
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
          <div className="header-switches">
            <Space>
              <Text strong style={{ color: "#64748b", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>Low Stock:</Text>
              <Switch checked={showLowStock} onChange={setShowLowStock} size="small" />
            </Space>
            <Space>
              <Text strong style={{ color: "#64748b", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>Deliveries:</Text>
              <Switch checked={showPending} onChange={setShowPending} size="small" />
            </Space>
          </div>
        </Col>
      </Row>

      <DashboardSummary period={period} />

      <div style={{ marginTop: 64, marginBottom: 32 }}>
        <Title level={2} className="analytics-title" style={{ fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
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
