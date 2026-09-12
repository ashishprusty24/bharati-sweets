import React from "react";
import { Row, Col, Card, Progress, Typography, Space, Tag, Tooltip } from "antd";
import {
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShopOutlined,
  CalendarOutlined,
  WalletOutlined,
  CheckCircleOutlined,
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
      {/* ── CARD 1: TOTAL REVENUE ── */}
      <Col xs={24} sm={12} lg={8}>
        <Card
          bordered={false}
          style={{
            borderRadius: 20,
            background: "#ffffff",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            border: "1px solid #f1f5f9",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Total Gross Revenue
              </Text>
              <Title
                level={2}
                style={{ margin: "4px 0 0 0", color: "#0f172a", fontWeight: 700, fontSize: 28 }}
              >
                ₹{totalRevenue.toLocaleString("en-IN")}
              </Title>
            </div>
            <span
              style={{
                background: "#ecfdf5",
                color: "#10b981",
                padding: 10,
                borderRadius: 14,
                display: "inline-flex",
              }}
            >
              <DollarOutlined style={{ fontSize: 20 }} />
            </span>
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <Space size={4}>
                <ShopOutlined style={{ color: "#10b981" }} />
                <Text style={{ color: "#475569", fontWeight: 500 }}>Daily Ledger Sales:</Text>
              </Space>
              <Text strong style={{ color: "#0f172a" }}>
                ₹{ledgerSales.toLocaleString("en-IN")}{" "}
                <span style={{ color: "#64748b", fontWeight: 400 }}>({ledgerPct}%)</span>
              </Text>
            </div>
            <Progress
              percent={ledgerPct}
              strokeColor="#10b981"
              trailColor="#f1f5f9"
              showInfo={false}
              size="small"
              style={{ marginBottom: 12 }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <Space size={4}>
                <CalendarOutlined style={{ color: "#3b82f6" }} />
                <Text style={{ color: "#475569", fontWeight: 500 }}>Event Orders:</Text>
              </Space>
              <Text strong style={{ color: "#0f172a" }}>
                ₹{eventSales.toLocaleString("en-IN")}{" "}
                <span style={{ color: "#64748b", fontWeight: 400 }}>({eventPct}%)</span>
              </Text>
            </div>
            <Progress percent={eventPct} strokeColor="#3b82f6" trailColor="#f1f5f9" showInfo={false} size="small" />
          </div>
        </Card>
      </Col>

      {/* ── CARD 2: TOTAL EXPENSES ── */}
      <Col xs={24} sm={12} lg={8}>
        <Card
          bordered={false}
          style={{
            borderRadius: 20,
            background: "#ffffff",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            border: "1px solid #f1f5f9",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Total Operating Expenses
              </Text>
              <Title
                level={2}
                style={{ margin: "4px 0 0 0", color: "#0f172a", fontWeight: 700, fontSize: 28 }}
              >
                ₹{totalExpenses.toLocaleString("en-IN")}
              </Title>
            </div>
            <span
              style={{
                background: "#fef2f2",
                color: "#ef4444",
                padding: 10,
                borderRadius: 14,
                display: "inline-flex",
              }}
            >
              <ArrowDownOutlined style={{ fontSize: 20 }} />
            </span>
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
            {maxExpenseCategory ? (
              <div>
                <Text style={{ color: "#64748b", fontSize: 12, display: "block", marginBottom: 6 }}>
                  Largest Cost Category:
                </Text>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#f8fafc",
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Tag color="default" style={{ borderRadius: 6, fontWeight: 600, textTransform: "capitalize" }}>
                    {maxExpenseCategory[0].replace("_", " ")}
                  </Tag>
                  <Text strong style={{ color: "#0f172a", fontSize: 14 }}>
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
              <Text type="secondary" style={{ fontSize: 12 }}>
                Expense-to-Revenue Ratio:
              </Text>
              <Tag color={totalRevenue > 0 && totalExpenses / totalRevenue > 0.7 ? "warning" : "default"}>
                {totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : 0}%
              </Tag>
            </div>
          </div>
        </Card>
      </Col>

      {/* ── CARD 3: NET PROFIT & MARGIN ── */}
      <Col xs={24} sm={24} lg={8}>
        <Card
          bordered={false}
          style={{
            borderRadius: 20,
            background: "#ffffff",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            border: "1px solid #f1f5f9",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Net Business Profit
              </Text>
              <Title
                level={2}
                style={{
                  margin: "4px 0 0 0",
                  color: netProfit >= 0 ? "#10b981" : "#ef4444",
                  fontWeight: 700,
                  fontSize: 28,
                }}
              >
                ₹{netProfit.toLocaleString("en-IN")}
              </Title>
            </div>
            <span
              style={{
                background: netProfit >= 0 ? "#ecfdf5" : "#fef2f2",
                color: netProfit >= 0 ? "#10b981" : "#ef4444",
                padding: 10,
                borderRadius: 14,
                display: "inline-flex",
              }}
            >
              {netProfit >= 0 ? <RiseOutlined style={{ fontSize: 20 }} /> : <FallOutlined style={{ fontSize: 20 }} />}
            </span>
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text strong style={{ color: "#475569", fontSize: 12 }}>
                Net Margin Efficiency
              </Text>
              <Tag
                color={netProfit >= 0 ? "success" : "error"}
                style={{ borderRadius: 8, padding: "2px 8px", fontWeight: 700, fontSize: 12 }}
              >
                {profitMargin.toFixed(1)}% Margin
              </Tag>
            </div>

            <Progress
              percent={Math.min(100, Math.max(0, profitMargin))}
              strokeColor={netProfit >= 0 ? "#10b981" : "#ef4444"}
              trailColor="#f1f5f9"
              strokeWidth={8}
              showInfo={false}
            />

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12 }}>
              <Text type="secondary">Cash Reserve Asset</Text>
              <Text strong style={{ color: "#0f172a" }}>
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
