import React, { useState, useEffect, useCallback } from "react";
import { Tabs, Spin, message, Divider, Card, Typography, Button, Row, Col, Progress, Tag, Space } from "antd";
import {
  BarChartOutlined,
  FileTextOutlined,
  PieChartOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import AccountingSummary from "./components/AccountingSummary";
import AccountingFilters from "./components/AccountingFilters";
import AccountingCharts from "./components/AccountingCharts";
import TransactionTable from "./components/TransactionTable";
import api from "../../services/api";

const { Text, Title } = Typography;

const AccountingPage = () => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("month");
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [financialData, setFinancialData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const fetchFinancialData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const [summaryData, transactionsData] = await Promise.all([
        api.get(`/accounting/summary?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/accounting/transactions?startDate=${startDate}&endDate=${endDate}`),
      ]);

      setFinancialData(summaryData);
      setTransactions(transactionsData);
    } catch (error) {
      message.error("Failed to fetch financial data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const handleTimeframeChange = (value) => {
    setTimeframe(value);
    if (value !== "custom") {
      let start, end;
      switch (value) {
        case "week":
          start = dayjs().startOf("week");
          end = dayjs().endOf("week");
          break;
        case "month":
          start = dayjs().startOf("month");
          end = dayjs().endOf("month");
          break;
        case "quarter":
          start = dayjs().startOf("quarter");
          end = dayjs().endOf("quarter");
          break;
        case "year":
          start = dayjs().startOf("year");
          end = dayjs().endOf("year");
          break;
        default:
          start = dayjs().startOf("month");
          end = dayjs().endOf("month");
      }
      setDateRange([start, end]);
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange(dates);
      setTimeframe("custom");
    }
  };

  const generateFinancialReport = () => {
    if (!financialData) return;

    const startDate = dateRange[0].format("MMMM D, YYYY");
    const endDate = dateRange[1].format("MMMM D, YYYY");

    const reportContent = `
      =============================================
      BHARATI SWEETS — FINANCIAL PERFORMANCE REPORT
      =============================================
      Period: ${startDate} to ${endDate}
      Generated On: ${dayjs().format("MMMM D, YYYY — HH:mm")}
      
      FINANCIAL SUMMARY
      -----------------
      Gross Revenue: ₹${financialData.totalRevenue?.toLocaleString() || 0}
      - Daily Ledger Sales: ₹${(financialData.revenueDistribution?.ledger || 0).toLocaleString()}
      - Event Orders Revenue: ₹${(financialData.revenueDistribution?.event || 0).toLocaleString()}

      Operating Expenses: ₹${financialData.totalExpenses?.toLocaleString() || 0}

      Net Profit: ₹${financialData.netProfit?.toLocaleString() || 0}
      Profit Margin: ${financialData.profitMargin?.toFixed(2) || 0}%

      EXPENSE BREAKDOWN
      -----------------
      ${Object.entries(financialData.expenseDistribution || {})
        .map(([cat, amt]) => `${cat.toUpperCase()}: ₹${amt.toLocaleString()}`)
        .join("\n      ")}
    `;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial_analysis_${dayjs().format("YYYYMMDD")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    message.success("Financial report downloaded successfully!");
  };

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Hero Banner with Filters */}
      <div style={{ marginBottom: 24 }}>
        <AccountingFilters
          timeframe={timeframe}
          dateRange={dateRange}
          onTimeframeChange={handleTimeframeChange}
          onDateRangeChange={handleDateRangeChange}
          onRefresh={fetchFinancialData}
        />
      </div>

      {loading && !financialData ? (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" tip="Computing financial intelligence analytics..." />
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <AccountingSummary financialData={financialData} />

          {/* Navigation Tabs & Views */}
          <div style={{ marginTop: 24 }}>
            <Tabs
              defaultActiveKey="overview"
              type="card"
              size="large"
              tabBarStyle={{ marginBottom: 16 }}
              items={[
                {
                  key: "overview",
                  label: (
                    <span style={{ fontWeight: 700, padding: "4px 8px" }}>
                      <BarChartOutlined /> Visual Analytics
                    </span>
                  ),
                  children: <AccountingCharts financialData={financialData} />,
                },
                {
                  key: "transactions",
                  label: (
                    <span style={{ fontWeight: 700, padding: "4px 8px" }}>
                      <FileTextOutlined /> Transactions ({transactions.length})
                    </span>
                  ),
                  children: (
                    <TransactionTable
                      transactions={transactions}
                      loading={loading}
                      onGenerateReport={generateFinancialReport}
                    />
                  ),
                },
                {
                  key: "reports",
                  label: (
                    <span style={{ fontWeight: 700, padding: "4px 8px" }}>
                      <PieChartOutlined /> Performance Audit
                    </span>
                  ),
                  children: (
                    <Row gutter={[20, 20]} style={{ marginTop: 8 }}>
                      <Col xs={24} lg={12}>
                        <Card
                          bordered={false}
                          style={{
                            borderRadius: 22,
                            background: "#ffffff",
                            boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                            border: "1px solid #f1f5f9",
                          }}
                          title={
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <SafetyCertificateOutlined style={{ color: "#10b981", fontSize: 20 }} />
                              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                                Statement of Profit & Loss
                              </Title>
                            </div>
                          }
                        >
                          {financialData ? (
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                                <Text style={{ color: "#64748b", fontWeight: 600 }}>Gross Business Sales</Text>
                                <Text strong style={{ fontSize: 18, color: "#059669" }}>
                                  ₹{financialData.totalRevenue?.toLocaleString("en-IN")}
                                </Text>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                                <Text style={{ color: "#64748b", fontWeight: 600 }}>Total Operating Costs</Text>
                                <Text strong style={{ fontSize: 18, color: "#ef4444" }}>
                                  - ₹{financialData.totalExpenses?.toLocaleString("en-IN")}
                                </Text>
                              </div>
                              <Divider style={{ margin: "16px 0" }} />
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                                  Net Profit
                                </Title>
                                <Title
                                  level={3}
                                  style={{
                                    margin: 0,
                                    fontWeight: 800,
                                    color: financialData.netProfit >= 0 ? "#10b981" : "#ef4444",
                                  }}
                                >
                                  ₹{financialData.netProfit?.toLocaleString("en-IN")}
                                </Title>
                              </div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Audit calculated for {dateRange[0]?.format("DD MMM YYYY")} to{" "}
                                {dateRange[1]?.format("DD MMM YYYY")}
                              </Text>

                              <div style={{ marginTop: 28 }}>
                                <Button
                                  type="primary"
                                  size="large"
                                  icon={<DownloadOutlined />}
                                  block
                                  onClick={generateFinancialReport}
                                  style={{
                                    borderRadius: 14,
                                    height: 48,
                                    fontWeight: 700,
                                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                    border: "none",
                                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                                  }}
                                >
                                  Export Full Audit Analysis (.TXT)
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Text type="secondary">No data available for the selected period.</Text>
                          )}
                        </Card>
                      </Col>

                      <Col xs={24} lg={12}>
                        <Card
                          bordered={false}
                          style={{
                            borderRadius: 22,
                            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                            border: "1px solid #e2e8f0",
                          }}
                          title={<span style={{ fontWeight: 700, fontSize: 16 }}>Financial Health Indicators</span>}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <Text strong style={{ color: "#334155" }}>Profit Margin Ratio</Text>
                                <Tag color={financialData?.profitMargin >= 20 ? "success" : "warning"}>
                                  {financialData?.profitMargin?.toFixed(1)}%
                                </Tag>
                              </div>
                              <Progress
                                percent={Math.min(100, Math.max(0, financialData?.profitMargin || 0))}
                                strokeColor="#10b981"
                                showInfo={false}
                              />
                            </div>

                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <Text strong style={{ color: "#334155" }}>Daily Ledger Channel Share</Text>
                                <Tag color="blue">
                                  {financialData?.totalRevenue > 0
                                    ? Math.round(
                                        ((financialData.revenueDistribution?.ledger || 0) /
                                          financialData.totalRevenue) *
                                          100
                                      )
                                    : 0}
                                  %
                                </Tag>
                              </div>
                              <Progress
                                percent={
                                  financialData?.totalRevenue > 0
                                    ? Math.round(
                                        ((financialData.revenueDistribution?.ledger || 0) /
                                          financialData.totalRevenue) *
                                          100
                                      )
                                    : 0
                                }
                                strokeColor="#3b82f6"
                                showInfo={false}
                              />
                            </div>

                            <div
                              style={{
                                background: "#ffffff",
                                padding: 16,
                                borderRadius: 14,
                                border: "1px solid #cbd5e1",
                                marginTop: 8,
                              }}
                            >
                              <Space align="start">
                                <CheckCircleOutlined style={{ color: "#10b981", fontSize: 18, marginTop: 2 }} />
                                <div>
                                  <Text strong style={{ color: "#0f172a", display: "block" }}>
                                    Ledger & Expense Auto-Synchronization Active
                                  </Text>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    All counter sales and home expenses are verified and dynamically calculated.
                                  </Text>
                                </div>
                              </Space>
                            </div>
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  ),
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AccountingPage;
