import React, { useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import DashboardSummary from "./components/DashboardSummary";
import SalesChart from "./components/SalesChart";
import ExpenseChart from "./components/ExpenseChart";
import PopularProducts from "./components/PopularProducts";
import RecentEventOrders from "./components/RecentEventOrders";
import QuickActions from "./components/QuickActions";

import { Row, Col } from "antd";
import "./DashboardPage.css";

const DashboardPage = () => {
  const [period, setPeriod] = useState("30d");

  return (
    <div className="dashboard-container" style={{ background: "#f8fafc", minHeight: "100vh", padding: "16px 24px 40px" }}>
      {/* Top Header */}
      <DashboardHeader period={period} setPeriod={setPeriod} />

      {/* Row 1: 6 Executive KPI Cards */}
      <DashboardSummary period={period} />

      {/* Row 2: Revenue Performance & Expense Mix */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} xl={15}>
          <SalesChart period={period} />
        </Col>
        <Col xs={24} xl={9}>
          <ExpenseChart />
        </Col>
      </Row>

      {/* Row 3: Top Selling Products, Recent Event Orders, Quick Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={8}>
          <PopularProducts />
        </Col>
        <Col xs={24} md={12} lg={8}>
          <RecentEventOrders />
        </Col>
        <Col xs={24} lg={8}>
          <QuickActions />
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
