"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tabs, Spin, message, Divider, Card, Typography, Button } from "antd";
import { BarChartOutlined, FileTextOutlined, PieChartOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import AccountingSummary from "./AccountingSummary";
import AccountingFilters from "./AccountingFilters";
import AccountingCharts from "./AccountingCharts";
import TransactionTable from "./TransactionTable";

const { Text, Title } = Typography;

export default function AccountingView() {
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

      const [sRes, tRes] = await Promise.all([
        fetch(`/api/accounting/summary?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/accounting/transactions?startDate=${startDate}&endDate=${endDate}`),
      ]);
      const sData = await sRes.json();
      const tData = await tRes.json();

      setFinancialData(sData);
      setTransactions(tData || []);
    } catch (error) {
      console.error(error);
      message.error("Failed to fetch financial data");
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
      Financial Report - ${startDate} to ${endDate}
      =============================================
      
      Total Revenue: ₹${financialData.totalRevenue?.toLocaleString() || 0}
      Total Expenses: ₹${financialData.totalExpenses?.toLocaleString() || 0}
      Net Profit: ₹${financialData.netProfit?.toLocaleString() || 0}
      Profit Margin: ${financialData.profitMargin?.toFixed(2) || 0}%
      
      Generated on ${dayjs().format("MMMM D, YYYY")}
    `;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial_report_${dayjs().format("YYYYMMDD")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    message.success("Financial report generated successfully!");
  };

  return (
    <div style={{ padding: "0 8px" }}>
      <div className="page-header-container">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Accounting</Title>
          <Text type="secondary">In-depth financial analysis, revenue tracking, and reports.</Text>
        </div>
      </div>

      <Card variant="borderless" className="glass-card" style={{ borderRadius: 20, marginBottom: 24 }}>
        <AccountingFilters
          timeframe={timeframe}
          dateRange={dateRange}
          onTimeframeChange={handleTimeframeChange}
          onDateRangeChange={handleDateRangeChange}
          onRefresh={fetchFinancialData}
        />
      </Card>

      {loading && !financialData ? (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" tip="Analyzing data..." />
        </div>
      ) : (
        <>
          <AccountingSummary financialData={financialData} />

          <div style={{ marginTop: 32 }}>
            <Tabs defaultActiveKey="overview" type="line" size="large" items={[
              {
                key: "overview",
                label: <span><BarChartOutlined /> Overview</span>,
                children: <AccountingCharts financialData={financialData} />
              },
              {
                key: "transactions",
                label: <span><FileTextOutlined /> Transactions</span>,
                children: <TransactionTable transactions={transactions} loading={loading} onGenerateReport={generateFinancialReport} />
              },
              {
                key: "reports",
                label: <span><PieChartOutlined /> Reports</span>,
                children: (
                  <div style={{ marginTop: 16, maxWidth: 600 }}>
                    <Card variant="borderless" className="glass-card" title="Financial Performance Summary" style={{ borderRadius: 20 }}>
                      {financialData ? (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                            <Text type="secondary" strong>Total Revenue</Text>
                            <Text strong style={{ fontSize: 18 }}>₹{financialData.totalRevenue?.toLocaleString()}</Text>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                            <Text type="secondary" strong>Operating Expenses</Text>
                            <Text strong style={{ fontSize: 18, color: "#ef4444" }}>- ₹{financialData.totalExpenses?.toLocaleString()}</Text>
                          </div>
                          <Divider />
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <Title level={4} style={{ margin: 0 }}>Net Profit</Title>
                            <Title level={4} style={{ margin: 0, color: financialData.netProfit >= 0 ? "#10b981" : "#ef4444" }}>
                              ₹{financialData.netProfit?.toLocaleString()}
                            </Title>
                          </div>
                          <Text type="secondary">Generated on {dayjs().format("MMMM D, YYYY")}</Text>
                          
                          <div style={{ marginTop: 32 }}>
                            <Button 
                              type="primary" 
                              size="large" 
                              icon={<FileTextOutlined />} 
                              block
                              onClick={generateFinancialReport}
                              style={{ borderRadius: 10, height: 45 }}
                            >
                              Export Full Analysis
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Text type="secondary">No data available for the selected period.</Text>
                      )}
                    </Card>
                  </div>
                )
              }
            ]} />
          </div>
        </>
      )}
    </div>
  );
}
