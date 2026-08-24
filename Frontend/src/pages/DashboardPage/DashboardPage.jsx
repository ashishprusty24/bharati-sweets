import React, { useState, useMemo } from "react";
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
  const [customRange, setCustomRange] = useState(null);

  const queryStr = useMemo(() => {
    if (period === "custom" && customRange?.startDate) {
      const startParam = encodeURIComponent(customRange.startDate);
      const endParam = customRange.endDate ? `&endDate=${encodeURIComponent(customRange.endDate)}` : "";
      return `period=custom&startDate=${startParam}${endParam}`;
    }
    return `period=${period}`;
  }, [period, customRange]);

  return (
    <div className="dashboard-container" style={{ background: "#f8fafc", minHeight: "100vh", padding: "16px 24px 40px" }}>
      {/* Top Header */}
      <DashboardHeader period={period} setPeriod={setPeriod} setCustomRange={setCustomRange} />

      {/* Row 1: 6 Executive KPI Cards */}
      <DashboardSummary queryStr={queryStr} />

      {/* Row 2: Revenue Performance & Expense Mix */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} xl={15}>
          <SalesChart queryStr={queryStr} period={period} />
        </Col>
        <Col xs={24} xl={9}>
          <ExpenseChart queryStr={queryStr} />
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
