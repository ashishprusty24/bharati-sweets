"use client";

import React, { useState, useEffect } from "react";
import { Card } from "antd";
import ReactECharts from "echarts-for-react";
import EmptyState from "./EmptyState";

const ExpenseChart = () => {
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/expenses")
      .then((res) => res.json())
      .then((data) => setExpenseData(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hasData = expenseData && expenseData.length > 0;

  const colors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
    "#ec4899", "#06b6d4", "#f97316", "#64748b"
  ];

  const option = {
    backgroundColor: "transparent",
    title: { 
      text: "Expense Mix", 
      left: 0,
      textStyle: {
        color: "#1e293b",
        fontWeight: 700,
        fontSize: 18,
      }
    },
    tooltip: { 
      trigger: "item", 
      formatter: (params) => {
        return `<div style="padding: 8px;">
          <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${params.name}</div>
          <div style="font-weight: 700; font-size: 16px; color: #1e293b;">₹${params.value.toLocaleString("en-IN")} <span style="font-weight: 500; font-size: 12px; color: #94a3b8">(${params.percent}%)</span></div>
        </div>`;
      },
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderRadius: 12,
      padding: 0,
      borderWidth: 0,
      shadowColor: "rgba(0, 0, 0, 0.1)",
      shadowBlur: 10,
    },
    legend: { 
      orient: "horizontal", 
      bottom: 0, 
      left: "center",
      itemWidth: 8,
      itemHeight: 8,
      icon: "circle",
      textStyle: { color: "#64748b", fontSize: 11 }
    },
    series: [
      {
        name: "Expenses",
        type: "pie",
        radius: ["50%", "80%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        itemStyle: { 
          borderRadius: 12, 
          borderColor: "#fff", 
          borderWidth: 4 
        },
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 10,
          itemStyle: {
            shadowBlur: 20,
            shadowColor: "rgba(0, 0, 0, 0.1)"
          }
        },
        data: expenseData?.map((item, index) => ({
          value: item.amount,
          name: item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "Other",
          itemStyle: { color: colors[index % colors.length] },
        })) || [],
      },
    ],
  };

  return (
    <Card variant="borderless" loading={loading} style={{ borderRadius: 24, padding: "20px", height: "100%" }}>
      {!loading && !hasData ? (
        <div style={{ marginTop: 40 }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{ color: "#1e293b", fontWeight: 700, fontSize: 18 }}>Expense Mix</span>
          </div>
          <EmptyState message="No expenses recorded for this period" />
        </div>
      ) : (
        <ReactECharts option={option} style={{ height: 350 }} />
      )}
    </Card>
  );
};

export default ExpenseChart;
