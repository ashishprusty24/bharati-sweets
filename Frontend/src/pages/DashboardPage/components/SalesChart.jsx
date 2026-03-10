import React from "react";
import { Card } from "antd";
import ReactECharts from "echarts-for-react";
import useFetch from "../../../hooks/useFetch";
import EmptyState from "./EmptyState";

const SalesChart = ({ period = "30d" }) => {
  const { data: salesData, loading } = useFetch(`/dashboard/sales?period=${period}`);

  const hasData = salesData && salesData.length > 0;

  const option = {
    backgroundColor: "transparent",
    title: { 
      text: "Revenue Performance", 
      left: 0,
      textStyle: {
        color: "#1e293b",
        fontWeight: 700,
        fontSize: 18,
      }
    },
    tooltip: { 
      trigger: "axis", 
      formatter: (params) => {
        const item = params[0];
        const dateStr = period === "2y" 
          ? new Date(item.name).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : item.name;
        return `<div style="padding: 8px;">
          <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${dateStr}</div>
          <div style="font-weight: 700; font-size: 16px; color: #1e293b;">₹${item.value.toLocaleString("en-IN")}</div>
        </div>`;
      },
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderRadius: 12,
      padding: 0,
      borderWidth: 0,
      shadowColor: "rgba(0, 0, 0, 0.1)",
      shadowBlur: 10,
    },
    grid: { left: "1%", right: "1%", bottom: "3%", containLabel: true, top: "20%" },
    xAxis: {
      type: "category",
      data: salesData?.map((item) => {
        const date = new Date(item.date);
        return period === "2y" 
          ? date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
          : date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
      }) || [],
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
      axisLabel: { 
        color: "#94a3b8", 
        fontSize: 11,
        formatter: (value) => `₹${value >= 1000 ? (value / 1000) + "k" : value}`
      },
    },
    series: [
      {
        name: "Revenue",
        type: "line",
        smooth: 0.4,
        symbol: "circle",
        symbolSize: 8,
        showSymbol: false,
        data: salesData?.map((item) => item.amount) || [],
        lineStyle: { width: 4, color: "#3b82f6" },
        itemStyle: { color: "#3b82f6", borderWidth: 2, borderColor: "#fff" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59, 130, 246, 0.2)" },
              { offset: 1, color: "rgba(59, 130, 246, 0.0)" },
            ],
          },
        },
        emphasis: {
          scale: true,
          lineStyle: { width: 5 }
        }
      },
    ],
  };

  return (
    <Card bordered={false} loading={loading} style={{ borderRadius: 24, padding: "20px", height: "100%" }}>
      {!loading && !hasData ? (
        <div style={{ marginTop: 40 }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{ color: "#1e293b", fontWeight: 700, fontSize: 18 }}>Revenue Performance</span>
          </div>
          <EmptyState message="No revenue data recorded for this period" />
        </div>
      ) : (
        <ReactECharts option={option} style={{ height: 350, key: period }} transition={0} />
      )}
    </Card>
  );
};


export default SalesChart;

