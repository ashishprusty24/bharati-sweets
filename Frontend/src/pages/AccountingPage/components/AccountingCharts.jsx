import React from "react";
import { Row, Col, Card, Typography } from "antd";
import ReactECharts from "echarts-for-react";

const { Text } = Typography;

const AccountingCharts = ({ financialData }) => {
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

  const revenueTypes = {
    regular: { label: "Regular Orders", color: "#52c41a" },
    event: { label: "Event Orders", color: "#1890ff" },
  };

  const getPieOptions = (title, dataMap, config) => {
    if (!dataMap) return {};
    const data = Object.keys(dataMap).map((key) => ({
      name: config[key]?.label || key,
      value: dataMap[key],
      itemStyle: { color: config[key]?.color || "#bfbfbf" },
    }));

    return {
      tooltip: { trigger: "item", formatter: "{b}: ₹{c} ({d}%)" },
      legend: { orient: "vertical", left: "right" },
      series: [
        {
          name: title,
          type: "pie",
          radius: "50%",
          data,
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

  const getProfitTrendOptions = () => {
    if (!financialData?.profitTrend) return {};
    return {
      tooltip: {
        trigger: "axis",
        formatter: "Profit: ₹{c}",
        axisPointer: { type: "shadow" },
      },
      xAxis: {
        type: "category",
        data: financialData.profitTrend.map((item) => item.period),
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "₹{value}" },
      },
      series: [
        {
          name: "Net Profit",
          type: "bar",
          data: financialData.profitTrend.map((item) => item.profit),
          itemStyle: {
            color: (params) => (params.value >= 0 ? "#52c41a" : "#f5222d"),
          },
        },
      ],
    };
  };

  return (
    <>
      <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Expense Distribution"
            extra={<Text strong className="mobile-hide">Total: ₹{financialData?.totalExpenses?.toLocaleString() || 0}</Text>}
          >
            <ReactECharts
              option={getPieOptions("Expenses", financialData?.expenseDistribution, expenseCategories)}
              style={{ height: 300 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Revenue Distribution"
            extra={<Text strong className="mobile-hide">Total: ₹{financialData?.totalRevenue?.toLocaleString() || 0}</Text>}
          >
            <ReactECharts
              option={getPieOptions("Revenue", financialData?.revenueDistribution, revenueTypes)}
              style={{ height: 300 }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Profit Trend" style={{ marginTop: 24 }}>
        <ReactECharts option={getProfitTrendOptions()} style={{ height: 300 }} />
      </Card>
    </>
  );
};

export default AccountingCharts;
