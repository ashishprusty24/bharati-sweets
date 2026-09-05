import React from "react";
import { Card, Typography, Row, Col, Tag, Space } from "antd";
import { BulbOutlined, RiseOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import useFetch from "../../../hooks/useFetch";

const { Title, Text } = Typography;

const ExpenseChart = ({ queryStr = "period=30d" }) => {
  const { data: expenseData, loading } = useFetch(`/dashboard/expenses?${queryStr}`);

  const rawCategories = expenseData && expenseData.length > 0 ? expenseData : [];

  const totalExpense = rawCategories.reduce((s, c) => s + c.amount, 0);

  const categoryConfig = {
    raw_materials: { label: "Raw Materials", color: "#8b5cf6" },
    staff_salary: { label: "Salaries", color: "#3b82f6" },
    utilities: { label: "Utilities", color: "#10b981" },
    logistics: { label: "Logistics", color: "#f97316" },
    supplier_payment: { label: "Suppliers", color: "#f59e0b" },
    personal: { label: "Personal", color: "#ec4899" },
    other: { label: "Others", color: "#ff85c0" },
  };

  const chartData = rawCategories.map(item => {
    const key = item.category?.toLowerCase() || "other";
    const cfg = categoryConfig[key] || { label: item.category || "Others", color: "#64748b" };
    return {
      name: cfg.label,
      value: item.amount,
      color: cfg.color,
      percent: Math.round((item.amount / Math.max(1, totalExpense)) * 100),
    };
  });

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: ₹{c} ({d}%)",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: 8,
    },
    series: [
      {
        name: "Expense Mix",
        type: "pie",
        radius: ["58%", "82%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: "center",
          formatter: () => `{total|Total Expense}\n{val|₹${totalExpense.toLocaleString("en-IN")}}`,
          rich: {
            total: { fontSize: 11, color: "#94a3b8", fontWeight: 500, lineHeight: 18 },
            val: { fontSize: 16, color: "#0f172a", fontWeight: 800, lineHeight: 22 },
          },
        },
        data: chartData.map(d => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color },
        })),
      },
    ],
  };

  return (
    <Card 
      bordered={false}
      style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.03)", background: "#ffffff", border: "1px solid #f1f5f9", height: "100%" }}
      loading={loading}
      bodyStyle={{ padding: 20 }}
    >
      <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 18, marginBottom: 12 }}>
        Expense Mix
      </Title>

      <Row align="middle" gutter={16}>
        <Col span={11}>
          <ReactECharts option={option} style={{ height: 180, width: "100%" }} />
        </Col>

        <Col span={13}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {chartData.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <Space size={6}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, display: "inline-block" }} />
                  <Text style={{ color: "#475569", fontWeight: 500 }}>{item.name}</Text>
                </Space>
                <Space size={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{item.percent}%</Text>
                  <Text strong style={{ color: "#0f172a", fontSize: 12, minWidth: 55, textAlign: "right" }}>
                    ₹{item.value.toLocaleString("en-IN")}
                  </Text>
                </Space>
              </div>
            ))}
          </div>
        </Col>
      </Row>

      {/* Footer Metrics Row */}
      <div style={{ background: "#f8fafc", borderRadius: 14, padding: "10px 14px", marginTop: 24, border: "1px solid #f1f5f9" }}>
        <Row gutter={12} align="middle">
          <Col span={12}>
            <Space size={8}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f3e8ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BulbOutlined style={{ fontSize: 13 }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 10, display: "block" }}>Expense Ratio</Text>
                <Text strong style={{ fontSize: 12, color: "#8b5cf6" }}>18.0% of Revenue</Text>
              </div>
            </Space>
          </Col>

          <Col span={12}>
            <Space size={8}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RiseOutlined style={{ fontSize: 13 }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 10, display: "block" }}>vs Last 30 Days</Text>
                <Text strong style={{ fontSize: 12, color: "#059669" }}>-2.4% Improved</Text>
              </div>
            </Space>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

export default ExpenseChart;
