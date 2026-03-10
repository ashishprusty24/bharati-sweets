import React from "react";
import { Card } from "antd";
import { PieChartOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";

const ExpenseChart = ({ data, categories }) => {
  const categoryTotals = {};
  categories.forEach((cat) => (categoryTotals[cat.value] = 0));
  data.forEach((exp) => {
    if (categoryTotals[exp.category] !== undefined) {
      categoryTotals[exp.category] += exp.amount;
    }
  });

  const pieData = Object.keys(categoryTotals)
    .filter((key) => categoryTotals[key] > 0)
    .map((key) => ({
      name: categories.find((cat) => cat.value === key)?.label || key,
      value: categoryTotals[key],
      itemStyle: { color: categories.find((cat) => cat.value === key)?.color },
    }));

  const options = {
    tooltip: { trigger: "item", formatter: "{a} <br/>{b}: ₹{c} ({d}%)" },
    legend: { orient: "vertical", left: "right" },
    series: [
      {
        name: "Expense by Category",
        type: "pie",
        radius: "50%",
        center: ["40%", "50%"],
        data: pieData,
      },
    ],
  };

  return (
    <Card
      title={<div><PieChartOutlined style={{ marginRight: 8 }} /> Expense Distribution</div>}
      style={{ marginBottom: 24 }}
    >
      <div style={{ height: 300 }}>
        <ReactECharts option={options} style={{ height: "100%" }} />
      </div>
    </Card>
  );
};

export default ExpenseChart;
