import React from "react";
import { Row, Col, Card, Progress, Typography, Space, Tag } from "antd";
import {
  DollarOutlined,
  ArrowDownOutlined,
  ShopOutlined,
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

const AccountingSummary = ({ financialData }) => {
  if (!financialData) return null;

  const totalRevenue = financialData.totalRevenue || 0;
  const totalExpenses = financialData.totalExpenses || 0;
  const netProfit = financialData.netProfit || 0;
  const profitMargin = financialData.profitMargin || 0;

  const ledgerSales = financialData.revenueDistribution?.ledger || 0;
  const eventSales = financialData.revenueDistribution?.event || 0;

  const ledgerPct = totalRevenue > 0 ? Math.round((ledgerSales / totalRevenue) * 100) : 0;
  const eventPct = totalRevenue > 0 ? Math.round((eventSales / totalRevenue) * 100) : 0;

  const maxExpenseCategory = Object.entries(financialData.expenseDistribution || {}).sort(
    (a, b) => b[1] - a[1]
  )[0];

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} sm={12} lg={8}>
        <Card
          bordered={false}
          style={{
            borderRadius: 22,
            background: "#ffffff",
            boxShadow: "0 8px 30px rgba(16, 185, 129, 0.08)",
            border: "1px solid #d1fae5",
            position: "relative",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "#059669",
                }}
              >
                Total Gross Revenue
              </Text>
              <Title
                level={2}
                style={{ margin: "4px 0 0 0", color: "#065f46", fontWeight: 800, fontSize: 30 }}
              >
                ₹{totalRevenue.toLocaleString("en-IN")}
              </Title>
            </div>
            <span
              style={{
                background: "#ecfdf5",
                color: "#10b981",
                padding: 12,
                borderRadius: 16,
                display: "inline-flex",
                border: "1px solid #a7f3d0",
              }}
            >
              <DollarOutlined style={{ fontSize: 24 }} />
            </span>
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f0fdf4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <Space size={4}>
                <ShopOutlined style={{ color: "#10b981" }} />
                <Text style={{ color: "#374151", fontWeight: 600 }}>Daily Ledger Sales:</Text>
              </Space>
              <Text strong style={{ color: "#065f46" }}>
                ₹{ledgerSales.toLocaleString("en-IN")}{" "}
                <span style={{ color: "#6b7280", fontWeight: 400 }}>({ledgerPct}%)</span>
              </Text>
            </div>
            <Progress
              percent={ledgerPct}
              strokeColor="#10b981"
              trailColor="#e5e7eb"
              showInfo={false}
              size="small"
              style={{ marginBottom: 12 }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <Space size={4}>
                <CalendarOutlined style={{ color: "#3b82f6" }} />
                <Text style={{ color: "#374151", fontWeight: 600 }}>Event Orders:</Text>
              </Space>
              <Text strong style={{ color: "#1e40af" }}>
                ₹{eventSales.toLocaleString("en-IN")}{" "}
                <span style={{ color: "#6b7280", fontWeight: 400 }}>({eventPct}%)</span>
              </Text>
            </div>
            <Progress percent={eventPct} strokeColor="#3b82f6" trailColor="#e5e7eb" showInfo={false} size="small" />
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Card
          bordered={false}
          style={{
            borderRadius: 22,
            background: "#ffffff",
            boxShadow: "0 8px 30px rgba(239, 68, 68, 0.08)",
            border: "1px solid #fee2e2",
            position: "relative",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "linear-gradient(90deg, #ef4444 0%, #f87171 100%)",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "#dc2626",
                }}
              >
                Total Operating Expenses
              </Text>
              <Title
                level={2}
                style={{ margin: "4px 0 0 0", color: "#991b1b", fontWeight: 800, fontSize: 30 }}
              >
                ₹{totalExpenses.toLocaleString("en-IN")}
              </Title>
            </div>
            <span
              style={{
                background: "#fef2f2",
                color: "#ef4444",
                padding: 12,
                borderRadius: 16,
                display: "inline-flex",
                border: "1px solid #fca5a5",
              }}
            >
              <ArrowDownOutlined style={{ fontSize: 24 }} />
            </span>
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #fff1f2" }}>
            {maxExpenseCategory ? (
              <div>
                <Text style={{ color: "#6b7280", fontSize: 12, display: "block", marginBottom: 6 }}>
                  Largest Cost Category:
                </Text>
                <div
                  style={{
                    display: "flex",
                    justify: "space-between",
                    alignItems: "center",
                    background: "#fef2f2",
                    padding: "8px 12px",
                    borderRadius: 12,
                    border: "1px solid #fecaca",
                  }}
                >
                  <Tag color="error" style={{ borderRadius: 6, fontWeight: 700, textTransform: "capitalize" }}>
                    {maxExpenseCategory[0].replace("_", " ")}
                  </Tag>
                  <Text strong style={{ color: "#991b1b", fontSize: 15, fontWeight: 700 }}>
                    ₹{Number(maxExpenseCategory[1]).toLocaleString("en-IN")}
                  </Text>
                </div>
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                No expenses recorded for this period.
              </Text>
            )}

            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Expense-to-Revenue Ratio:
              </Text>
              <Tag color={totalRevenue > 0 && totalExpenses / totalRevenue > 0.7 ? "warning" : "default"}>
                {totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : 0}%
              </Tag>
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={24} lg={8}>
        <Card
          bordered={false}
          style={{
            borderRadius: 22,
            background:
              netProfit >= 0
                ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
                : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            boxShadow: "0 8px 30px rgba(59, 130, 246, 0.1)",
            border: netProfit >= 0 ? "1px solid #bfdbfe" : "1px solid #fde68a",
            position: "relative",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: netProfit >= 0 ? "#1d4ed8" : "#b45309",
                }}
              >
                Net Business Profit
              </Text>
              <Title
                level={2}
                style={{
                  margin: "4px 0 0 0",
                  color: netProfit >= 0 ? "#1e3a8a" : "#78350f",
                  fontWeight: 800,
                  fontSize: 30,
                }}
              >
                ₹{netProfit.toLocaleString("en-IN")}
              </Title>
            </div>
            <span
              style={{
                background: "#ffffff",
                color: netProfit >= 0 ? "#2563eb" : "#d97706",
                padding: 12,
                borderRadius: 16,
                display: "inline-flex",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            >
              {netProfit >= 0 ? <RiseOutlined style={{ fontSize: 24 }} /> : <FallOutlined style={{ fontSize: 24 }} />}
            </span>
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text strong style={{ color: netProfit >= 0 ? "#1e40af" : "#92400e", fontSize: 13 }}>
                Net Margin Efficiency
              </Text>
              <Tag
                color={netProfit >= 0 ? "blue" : "warning"}
                style={{ borderRadius: 10, padding: "2px 10px", fontWeight: 800, fontSize: 13 }}
              >
                {profitMargin.toFixed(1)}% Margin
              </Tag>
            </div>

            <Progress
              percent={Math.min(100, Math.max(0, profitMargin))}
              strokeColor={netProfit >= 0 ? "#2563eb" : "#d97706"}
              trailColor="rgba(255,255,255,0.6)"
              strokeWidth={10}
              showInfo={false}
            />

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 11 }}>
              <Text type="secondary">Cash Reserve Asset</Text>
              <Text strong style={{ color: "#1e3a8a" }}>
                ₹{(financialData.assets?.cash || 125000).toLocaleString("en-IN")}
              </Text>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default AccountingSummary;
