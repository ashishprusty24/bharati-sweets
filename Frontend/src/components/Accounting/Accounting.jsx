import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  DatePicker,
  Button,
  Table,
  Tabs,
  Progress,
  Divider,
  Spin,
  message,
  Tag,
} from "antd";
import {
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  BarChartOutlined,
  PieChartOutlined,
  FileTextOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import moment from "moment";
// Importing the ECharts for React component
import ReactECharts from "echarts-for-react";
import { API_BASE_URL } from "../../common/config";

// The original Ant Design components
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const AccountingDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("month");
  const [dateRange, setDateRange] = useState([
    moment().startOf("month"),
    moment().endOf("month"),
  ]);
  const [financialData, setFinancialData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const timeframes = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];

  /**
   * Fetches financial data from a mock backend.
   */
  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Format dates for API request
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      // Fetch accounting summary
      const summaryRes = await fetch(
        `${API_BASE_URL}/accounting/summary?startDate=${startDate}&endDate=${endDate}`
      );
      const summaryData = await summaryRes.json();

      // Fetch transactions
      const transactionsRes = await fetch(
        `${API_BASE_URL}/accounting/transactions?startDate=${startDate}&endDate=${endDate}`
      );
      const transactionsData = await transactionsRes.json();

      setFinancialData(summaryData);
      setTransactions(transactionsData);
      setLoading(false);
    } catch (error) {
      message.error("Failed to fetch financial data");
      console.error("Error fetching financial data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [timeframe, dateRange]);

  const handleTimeframeChange = (value) => {
    setTimeframe(value);
    if (value !== "custom") {
      let start, end;

      switch (value) {
        case "week":
          start = moment().startOf("week");
          end = moment().endOf("week");
          break;
        case "month":
          start = moment().startOf("month");
          end = moment().endOf("month");
          break;
        case "quarter":
          start = moment().startOf("quarter");
          end = moment().endOf("quarter");
          break;
        case "year":
          start = moment().startOf("year");
          end = moment().endOf("year");
          break;
        default:
          start = moment().startOf("month");
          end = moment().endOf("month");
      }

      setDateRange([start, end]);
    }
  };
  console.log("====================================");
  console.log(1);
  console.log("====================================");

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange(dates);
      setTimeframe("custom");
    }
  };

  // Expense categories with colors
  const expenseCategories = {
    ingredients: { label: "Ingredients", color: "#1890ff" },
    packaging: { label: "Packaging", color: "#52c41a" },
    utilities: { label: "Utilities", color: "#faad14" },
    rent: { label: "Rent", color: "#f5222d" },
    salaries: { label: "Salaries", color: "#722ed1" },
    marketing: { label: "Marketing", color: "#13c2c2" },
    equipment: { label: "Equipment", color: "#eb2f96" },
    transportation: { label: "Transportation", color: "#a0d911" },
    other: { label: "Other", color: "#bfbfbf" },
  };

  // Revenue types with colors
  const revenueTypes = {
    regular: { label: "Regular Orders", color: "#52c41a" },
    event: { label: "Event Orders", color: "#1890ff" },
  };

  /**
   * Prepares ECharts options for the expense distribution pie chart.
   * This is a refactored version of the original getExpenseChartData.
   */
  const getExpenseChartOptions = () => {
    if (!financialData || !financialData.expenseDistribution) return {};

    const categories = Object.keys(financialData.expenseDistribution);
    const data = categories.map((cat) => ({
      name: expenseCategories[cat]?.label || cat,
      value: financialData.expenseDistribution[cat],
      itemStyle: {
        color: expenseCategories[cat]?.color || "#bfbfbf",
      },
    }));

    return {
      tooltip: {
        trigger: "item",
        formatter: "{b}: ₹{c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "right",
      },
      series: [
        {
          name: "Expense Distribution",
          type: "pie",
          radius: "50%",
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  };

  /**
   * Prepares ECharts options for the revenue distribution pie chart.
   * This is a refactored version of the original getRevenueChartData.
   */
  const getRevenueChartOptions = () => {
    if (!financialData || !financialData.revenueDistribution) return {};

    const types = Object.keys(financialData.revenueDistribution);
    const data = types.map((type) => ({
      name: revenueTypes[type]?.label || type,
      value: financialData.revenueDistribution[type],
      itemStyle: {
        color: revenueTypes[type]?.color || "#bfbfbf",
      },
    }));

    return {
      tooltip: {
        trigger: "item",
        formatter: "{b}: ₹{c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "right",
      },
      series: [
        {
          name: "Revenue Distribution",
          type: "pie",
          radius: "50%",
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  };

  /**
   * Prepares ECharts options for the profit trend bar chart.
   * This is a refactored version of the original getProfitTrendData.
   */
  const getProfitTrendChartOptions = () => {
    if (!financialData || !financialData.profitTrend) return {};

    const dates = financialData.profitTrend.map((item) => item.period);
    const profits = financialData.profitTrend.map((item) => item.profit);

    return {
      tooltip: {
        trigger: "axis",
        formatter: "Profit: ₹{c}",
        axisPointer: {
          type: "shadow",
        },
      },
      xAxis: {
        type: "category",
        data: dates,
        axisTick: {
          alignWithLabel: true,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: "₹{value}",
        },
      },
      series: [
        {
          name: "Net Profit",
          type: "bar",
          data: profits,
          itemStyle: {
            color: (params) => {
              // Set color based on value (green for positive, red for negative)
              return params.value >= 0
                ? "rgba(75, 192, 192, 0.8)"
                : "rgba(255, 99, 132, 0.8)";
            },
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  };

  // Transaction table columns
  const transactionColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => moment(date).format("MMM D, YYYY"),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Category",
      key: "category",
      render: (record) => {
        if (record.type === "revenue") {
          return (
            <Tag color={revenueTypes[record.category]?.color || "#1890ff"}>
              {revenueTypes[record.category]?.label || record.category}
            </Tag>
          );
        } else {
          return (
            <Tag color={expenseCategories[record.category]?.color || "#bfbfbf"}>
              {expenseCategories[record.category]?.label || record.category}
            </Tag>
          );
        }
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount, record) => (
        <Text strong type={record.type === "revenue" ? "success" : "danger"}>
          ₹{amount.toLocaleString()}
        </Text>
      ),
      align: "right",
      sorter: (a, b) => a.amount - b.amount,
    },
  ];

  // Generate financial reports
  const generateFinancialReport = () => {
    if (!financialData) return;

    const startDate = dateRange[0].format("MMMM D, YYYY");
    const endDate = dateRange[1].format("MMMM D, YYYY");

    // In a real app, this would call the backend to generate a PDF
    const reportContent = `
      Financial Report - ${startDate} to ${endDate}
      =============================================
      
      Total Revenue: ₹${financialData.totalRevenue?.toLocaleString() || 0}
      Total Expenses: ₹${financialData.totalExpenses?.toLocaleString() || 0}
      Net Profit: ₹${financialData.netProfit?.toLocaleString() || 0}
      Profit Margin: ${financialData.profitMargin?.toFixed(2) || 0}%
      
      Expense Distribution:
      ---------------------
      ${
        financialData.expenseDistribution
          ? Object.entries(financialData.expenseDistribution)
              .map(
                ([cat, amount]) =>
                  `• ${
                    expenseCategories[cat]?.label || cat
                  }: ₹${amount.toLocaleString()}`
              )
              .join("\n")
          : "No expense data"
      }
      
      Revenue Distribution:
      ---------------------
      ${
        financialData.revenueDistribution
          ? Object.entries(financialData.revenueDistribution)
              .map(
                ([type, amount]) =>
                  `• ${
                    revenueTypes[type]?.label || type
                  }: ₹${amount.toLocaleString()}`
              )
              .join("\n")
          : "No revenue data"
      }
    `;

    // Create a downloadable file
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial_report_${moment().format("YYYYMMDD")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    message.success("Financial report generated successfully!");
  };

  if (loading && !financialData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <Spin size="large" tip="Loading financial data..." />
      </div>
    );
  }

  return (
    <div className="accounting-dashboard">
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <DollarOutlined /> Accounting Dashboard
          </Title>
          <Text type="secondary">
            {dateRange[0].format("MMM D, YYYY")} to{" "}
            {dateRange[1].format("MMM D, YYYY")}
          </Text>
        </Col>
        <Col>
          <Select
            value={timeframe}
            onChange={handleTimeframeChange}
            style={{ width: 180, marginRight: 16 }}
          >
            {timeframes.map((timeframe) => (
              <Option key={timeframe.value} value={timeframe.value}>
                {timeframe.label}
              </Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{ width: 250 }}
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchFinancialData}
            style={{ marginLeft: 16 }}
          >
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Financial Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {/* Total Revenue Card */}
        <Col span={8}>
          <Card
            style={{
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              border: "none",
              backgroundColor: "#edf9f1", // pastel green background
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div
              style={{
                background: "linear-gradient(90deg, #e3fcef, #b6f3c0)",
                padding: "8px 12px",
                borderRadius: 8,
                marginBottom: 16,
                fontWeight: 600,
                fontSize: 14,
                color: "#3f8600",
              }}
            >
              Total Revenue
            </div>
            <Statistic
              value={financialData?.totalRevenue || 0}
              precision={2}
              valueStyle={{ color: "#3f8600", fontWeight: 700 }}
              prefix={<DollarOutlined />}
              suffix="₹"
            />
            <div style={{ marginTop: 16 }}>
              {financialData?.revenueDistribution && (
                <>
                  <Text type="secondary">
                    Regular Orders: ₹
                    {(
                      financialData.revenueDistribution.regular || 0
                    ).toLocaleString()}
                  </Text>
                  <br />
                  <Text type="secondary">
                    Event Orders: ₹
                    {(
                      financialData.revenueDistribution.event || 0
                    ).toLocaleString()}
                  </Text>
                </>
              )}
            </div>
          </Card>
        </Col>

        {/* Total Expenses Card */}
        <Col span={8}>
          <Card
            style={{
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              border: "none",
              backgroundColor: "#fff4f4", // pastel red background
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div
              style={{
                background: "linear-gradient(90deg, #ffecec, #f8bdbd)",
                padding: "8px 12px",
                borderRadius: 8,
                marginBottom: 16,
                fontWeight: 600,
                fontSize: 14,
                color: "#cf1322",
              }}
            >
              Total Expenses
            </div>
            <Statistic
              value={financialData?.totalExpenses || 0}
              precision={2}
              valueStyle={{ color: "#cf1322", fontWeight: 700 }}
              prefix={<DollarOutlined />}
              suffix="₹"
            />
            <div style={{ marginTop: 16 }}>
              {financialData?.expenseDistribution && (
                <>
                  <Text type="secondary">
                    Largest Expense: ₹
                    {Math.max(
                      ...Object.values(financialData.expenseDistribution)
                    ).toLocaleString()}
                  </Text>
                  <br />
                  <Text type="secondary">
                    Top Category:{" "}
                    {Object.entries(financialData.expenseDistribution).sort(
                      (a, b) => b[1] - a[1]
                    )[0]?.[0] || "N/A"}
                  </Text>
                </>
              )}
            </div>
          </Card>
        </Col>

        {/* Net Profit Card */}
        <Col span={8}>
          <Card
            style={{
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              border: "none",
              backgroundColor:
                financialData?.netProfit >= 0 ? "#edf9f1" : "#fff4f4", // dynamic pastel bg
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div
              style={{
                background:
                  financialData?.netProfit >= 0
                    ? "linear-gradient(90deg, #e3fcef, #b6f3c0)"
                    : "linear-gradient(90deg, #ffecec, #f8bdbd)",
                padding: "8px 12px",
                borderRadius: 8,
                marginBottom: 16,
                fontWeight: 600,
                fontSize: 14,
                color: financialData?.netProfit >= 0 ? "#3f8600" : "#cf1322",
              }}
            >
              Net Profit
            </div>
            <Statistic
              value={financialData?.netProfit || 0}
              precision={2}
              valueStyle={{
                color: financialData?.netProfit >= 0 ? "#3f8600" : "#cf1322",
                fontWeight: 700,
              }}
              prefix={
                financialData?.netProfit >= 0 ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )
              }
              suffix="₹"
            />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Profit Margin</Text>
              {financialData?.profitMargin && (
                <Progress
                  percent={Math.abs(financialData.profitMargin)}
                  status={
                    financialData.netProfit >= 0 ? "success" : "exception"
                  }
                  format={() => `${financialData.profitMargin.toFixed(2)}%`}
                  strokeWidth={10}
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="overview">
        <TabPane
          tab={
            <span>
              <BarChartOutlined /> Overview
            </span>
          }
          key="overview"
        >
          <Row gutter={24} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Card
                title="Expense Distribution"
                extra={
                  <Text strong>
                    Total: ₹
                    {financialData?.totalExpenses?.toLocaleString() || 0}
                  </Text>
                }
              >
                {financialData && financialData.expenseDistribution ? (
                  // Using ReactECharts for the pie chart
                  <ReactECharts
                    option={getExpenseChartOptions()}
                    style={{ height: 300 }}
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: 40 }}>
                    <Text type="secondary">No expense data available</Text>
                  </div>
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card
                title="Revenue Distribution"
                extra={
                  <Text strong>
                    Total: ₹{financialData?.totalRevenue?.toLocaleString() || 0}
                  </Text>
                }
              >
                {financialData && financialData.revenueDistribution ? (
                  // Using ReactECharts for the pie chart
                  <ReactECharts
                    option={getRevenueChartOptions()}
                    style={{ height: 300 }}
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: 40 }}>
                    <Text type="secondary">No revenue data available</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <Card title="Profit Trend" style={{ marginTop: 24 }}>
            {financialData && financialData.profitTrend ? (
              // Using ReactECharts for the bar chart
              <ReactECharts
                option={getProfitTrendChartOptions()}
                style={{ height: 300 }}
              />
            ) : (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Text type="secondary">No profit trend data available</Text>
              </div>
            )}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <FileTextOutlined /> Transactions
            </span>
          }
          key="transactions"
        >
          <Card
            title="Financial Transactions"
            extra={
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={generateFinancialReport}
              >
                Generate Report
              </Button>
            }
          >
            <Table
              columns={transactionColumns}
              dataSource={transactions}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              loading={loading}
              summary={(pageData) => {
                const total = pageData.reduce(
                  (sum, item) =>
                    sum +
                    (item.type === "revenue" ? item.amount : -item.amount),
                  0
                );
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong>Page Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong type={total >= 0 ? "success" : "danger"}>
                          ₹{total.toLocaleString()}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <PieChartOutlined /> Reports
            </span>
          }
          key="reports"
        >
          <Card title="Financial Reports">
            <Row gutter={24}>
              <Col span={12}>
                <Card
                  title="Profit & Loss Statement"
                  style={{ marginBottom: 24 }}
                >
                  {financialData ? (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong>Revenue</Text>
                        <Text style={{ float: "right" }}>
                          ₹{financialData.totalRevenue.toLocaleString()}
                        </Text>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <Text strong>Expenses</Text>
                        <Text style={{ float: "right" }}>
                          ₹{financialData.totalExpenses.toLocaleString()}
                        </Text>
                      </div>

                      <Divider style={{ margin: "16px 0" }} />

                      <div style={{ marginBottom: 16 }}>
                        <Text strong>Net Profit</Text>
                        <Text
                          strong
                          type={
                            financialData.netProfit >= 0 ? "success" : "danger"
                          }
                          style={{ float: "right" }}
                        >
                          ₹{financialData.netProfit.toLocaleString()}
                        </Text>
                      </div>

                      <div>
                        <Text strong>Profit Margin</Text>
                        <Text
                          strong
                          type={
                            financialData.netProfit >= 0 ? "success" : "danger"
                          }
                          style={{ float: "right" }}
                        >
                          {financialData.profitMargin.toFixed(2)}%
                        </Text>
                      </div>
                    </>
                  ) : (
                    <Text type="secondary">No financial data available</Text>
                  )}

                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    style={{ marginTop: 24, width: "100%" }}
                    onClick={generateFinancialReport}
                  >
                    Download P&L Statement
                  </Button>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Balance Sheet" style={{ marginBottom: 24 }}>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Assets</Text>
                    <div style={{ paddingLeft: 16 }}>
                      <div style={{ marginBottom: 8 }}>
                        <Text>Cash & Equivalents</Text>
                        <Text style={{ float: "right" }}>
                          ₹{(financialData?.assets?.cash || 0).toLocaleString()}
                        </Text>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text>Inventory</Text>
                        <Text style={{ float: "right" }}>
                          ₹
                          {(
                            financialData?.assets?.inventory || 0
                          ).toLocaleString()}
                        </Text>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text>Equipment</Text>
                        <Text style={{ float: "right" }}>
                          ₹
                          {(
                            financialData?.assets?.equipment || 0
                          ).toLocaleString()}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Liabilities</Text>
                    <div style={{ paddingLeft: 16 }}>
                      <div style={{ marginBottom: 8 }}>
                        <Text>Accounts Payable</Text>
                        <Text style={{ float: "right" }}>
                          ₹
                          {(
                            financialData?.liabilities?.payables || 0
                          ).toLocaleString()}
                        </Text>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text>Loans Payable</Text>
                        <Text style={{ float: "right" }}>
                          ₹
                          {(
                            financialData?.liabilities?.loans || 0
                          ).toLocaleString()}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Divider style={{ margin: "16px 0" }} />

                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Owner's Equity</Text>
                    <Text style={{ float: "right" }}>
                      ₹{(financialData?.equity || 0).toLocaleString()}
                    </Text>
                  </div>

                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    style={{ marginTop: 24, width: "100%" }}
                    onClick={generateFinancialReport}
                  >
                    Download Balance Sheet
                  </Button>
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AccountingDashboard;
