import React from "react";
import { Row, Col, Card, Typography, Space, Tag, Segmented } from "antd";
import ReactECharts from "echarts-for-react";
import {
  PieChartOutlined,
  BarChartOutlined,
  RiseOutlined,
  ShoppingOutlined,
  TeamOutlined,
  HomeOutlined,
  CreditCardOutlined,
  WalletOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

const CATEGORY_COLORS = {
  staff_salary: "#3b82f6",
  supplier_payment: "#f59e0b",
  home_intake: "#ec4899",
  personal: "#8b5cf6",
  credit_card_bill: "#ef4444",
  ingredients: "#10b981",
  packaging: "#06b6d4",
  utilities: "#f97316",
  rent: "#dc2626",
  marketing: "#6366f1",
  other: "#64748b",
};

const AccountingCharts = ({ financialData }) => {
  if (!financialData) return null;

  const totalRevenue = financialData.totalRevenue || 0;
  const totalExpenses = financialData.totalExpenses || 0;
  const ledgerSales = financialData.revenueDistribution?.ledger || 0;
  const eventSales = financialData.revenueDistribution?.event || 0;

  // --- CHART 1: REVENUE DISTRIBUTION DONUT ---
  const revenueDonutOptions = {
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      borderColor: "#334155",
      textStyle: { color: "#fff", fontSize: 13 },
      formatter: (params) => {
        return `
          <div style="font-weight:700; margin-bottom:4px;">${params.name}</div>
          <div>Amount: <strong style="color:#34d399">₹${params.value.toLocaleString("en-IN")}</strong></div>
          <div>Share: <strong>${params.percent}%</strong></div>
        `;
      },
    },
    series: [
      {
        name: "Revenue Channels",
        type: "pie",
        radius: ["55%", "78%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 3,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
            formatter: "{b}\n₹{c}",
          },
          itemStyle: {
            shadowBlur: 15,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },
        data: [
          {
            value: ledgerSales,
            name: "Daily Ledger Sales",
            itemStyle: { color: "#10b981" },
          },
          {
            value: eventSales,
            name: "Event Orders",
            itemStyle: { color: "#3b82f6" },
          },
        ],
      },
    ],
  };

  // --- CHART 2: EXPENSE DISTRIBUTION DONUT ---
  const expenseMap = financialData.expenseDistribution || {};
  const expenseData = Object.entries(expenseMap).map(([key, val]) => ({
    name: key.replace("_", " ").toUpperCase(),
    value: val,
    itemStyle: { color: CATEGORY_COLORS[key] || "#64748b" },
  }));

  const expenseDonutOptions = {
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      borderColor: "#334155",
      textStyle: { color: "#fff", fontSize: 13 },
      formatter: (params) => {
        return `
          <div style="font-weight:700; margin-bottom:4px;">${params.name}</div>
          <div>Amount: <strong style="color:#f87171">₹${params.value.toLocaleString("en-IN")}</strong></div>
          <div>Share: <strong>${params.percent}%</strong></div>
        `;
      },
    },
    series: [
      {
        name: "Expense Categories",
        type: "pie",
        radius: ["50%", "75%"],
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 3,
        },
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },
        data: expenseData.length > 0 ? expenseData : [{ value: 0, name: "No Expenses" }],
      },
    ],
  };

  // --- CHART 3: WEEKLY PROFIT TREND COMBINATION ---
  const trendData = financialData.profitTrend || [];
  const trendOptions = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      borderColor: "#334155",
      textStyle: { color: "#fff", fontSize: 13 },
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const item = params[0];
        const val = item.value;
        const isProfit = val >= 0;
        return `
          <div style="font-weight:700; margin-bottom:4px;">${item.name}</div>
          <div>Net Profit: <strong style="color:${isProfit ? "#34d399" : "#f87171"}">₹${val.toLocaleString("en-IN")}</strong></div>
        `;
      },
    },
    grid: {
      top: "12%",
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: trendData.map((t) => t.period),
      axisLine: { lineStyle: { color: "#cbd5e1" } },
      axisLabel: { color: "#64748b", fontWeight: 600 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { type: "dashed", color: "#f1f5f9" } },
      axisLabel: {
        color: "#64748b",
        formatter: (v) => `₹${v.toLocaleString()}`,
      },
    },
    series: [
      {
        name: "Net Profit",
        type: "bar",
        barWidth: "40%",
        data: trendData.map((t) => t.profit),
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: (params) => (params.value >= 0 ? "#10b981" : "#ef4444"),
        },
      },
    ],
  };

  return (
    <>
      {/* ── ROW 1: REVENUE & EXPENSE DONUTS ── */}
      <Row gutter={[20, 20]}>
        {/* REVENUE DISTRIBUTION CARD */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            style={{
              borderRadius: 22,
              background: "#ffffff",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 700, fontSize: 17, color: "#0f172a" }}>
                  <PieChartOutlined style={{ color: "#10b981", marginRight: 8 }} />
                  Revenue Source Breakdown
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Daily Ledger counter sales vs Event Orders
                </Text>
              </div>
              <Tag color="success" style={{ borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
                ₹{totalRevenue.toLocaleString("en-IN")} Total
              </Tag>
            </div>

            <Row align="middle" gutter={16}>
              <Col xs={24} sm={12}>
                <div style={{ position: "relative" }}>
                  <ReactECharts option={revenueDonutOptions} style={{ height: 230 }} />
                  {/* Center Text Overlay */}
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
                      Gross Revenue
                    </Text>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                      ₹{totalRevenue >= 100000 ? `${(totalRevenue / 100000).toFixed(1)}L` : totalRevenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 14,
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <Text strong style={{ color: "#065f46", fontSize: 13 }}>
                        Daily Ledger Sales
                      </Text>
                      <Tag color="green" style={{ borderRadius: 6 }}>
                        {totalRevenue > 0 ? Math.round((ledgerSales / totalRevenue) * 100) : 0}%
                      </Tag>
                    </div>
                    <Text strong style={{ color: "#047857", fontSize: 18 }}>
                      ₹{ledgerSales.toLocaleString("en-IN")}
                    </Text>
                  </div>

                  <div
                    style={{
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: 14,
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <Text strong style={{ color: "#1e40af", fontSize: 13 }}>
                        Event Orders
                      </Text>
                      <Tag color="blue" style={{ borderRadius: 6 }}>
                        {totalRevenue > 0 ? Math.round((eventSales / totalRevenue) * 100) : 0}%
                      </Tag>
                    </div>
                    <Text strong style={{ color: "#1d4ed8", fontSize: 18 }}>
                      ₹{eventSales.toLocaleString("en-IN")}
                    </Text>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* EXPENSE DISTRIBUTION CARD */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            style={{
              borderRadius: 22,
              background: "#ffffff",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 700, fontSize: 17, color: "#0f172a" }}>
                  <PieChartOutlined style={{ color: "#ef4444", marginRight: 8 }} />
                  Expense Category Distribution
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Operating costs across shop & home expenses
                </Text>
              </div>
              <Tag color="error" style={{ borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
                ₹{totalExpenses.toLocaleString("en-IN")} Total
              </Tag>
            </div>

            <Row align="middle" gutter={16}>
              <Col xs={24} sm={12}>
                <div style={{ position: "relative" }}>
                  <ReactECharts option={expenseDonutOptions} style={{ height: 230 }} />
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
                      Total Expenses
                    </Text>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#991b1b" }}>
                      ₹{totalExpenses >= 100000 ? `${(totalExpenses / 100000).toFixed(1)}L` : totalExpenses.toLocaleString()}
                    </div>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div
                  style={{
                    maxHeight: 210,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    paddingRight: 4,
                  }}
                >
                  {expenseData.length === 0 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      No category expense records found.
                    </Text>
                  )}
                  {expenseData.slice(0, 5).map((item, idx) => {
                    const pct = totalExpenses > 0 ? Math.round((item.value / totalExpenses) * 100) : 0;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justify: "space-between",
                          alignItems: "center",
                          padding: "6px 10px",
                          background: "#f8fafc",
                          borderRadius: 10,
                          border: "1px solid #f1f5f9",
                        }}
                      >
                        <Space size={6}>
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: item.itemStyle.color,
                              display: "inline-block",
                            }}
                          />
                          <Text style={{ fontSize: 11, fontWeight: 600, color: "#334155" }}>{item.name}</Text>
                        </Space>
                        <Text strong style={{ fontSize: 12, color: "#0f172a" }}>
                          ₹{item.value.toLocaleString("en-IN")}{" "}
                          <span style={{ fontSize: 10, color: "#94a3b8" }}>({pct}%)</span>
                        </Text>
                      </div>
                    );
                  })}
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* ── ROW 2: WEEKLY PROFIT TREND CHART ── */}
      <Card
        bordered={false}
        style={{
          borderRadius: 22,
          background: "#ffffff",
          marginTop: 20,
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)",
          border: "1px solid #f1f5f9",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700, fontSize: 17, color: "#0f172a" }}>
              <BarChartOutlined style={{ color: "#6366f1", marginRight: 8 }} />
              Weekly Profit Trend & Performance
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Net financial profit tracked week-by-week
            </Text>
          </div>
          <Tag color="purple" icon={<RiseOutlined />} style={{ borderRadius: 8, padding: "4px 10px", fontWeight: 700 }}>
            Period Profit: ₹{(financialData.netProfit || 0).toLocaleString("en-IN")}
          </Tag>
        </div>

        <ReactECharts option={trendOptions} style={{ height: 280 }} />
      </Card>
    </>
  );
};

export default AccountingCharts;
