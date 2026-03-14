import React from "react";
import { Card, Statistic } from "antd";
import { DollarOutlined } from "@ant-design/icons";

const ExpenseStats = ({ stats }) => {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
      <Card bordered={false} style={{ flex: 1, background: "#f0f5ff" }}>
        <Statistic
          title="Total Expenses"
          value={stats.total}
          precision={2}
          valueStyle={{ color: "#3f8600" }}
          prefix={<DollarOutlined />}
          suffix="₹"
        />
      </Card>
      <Card bordered={false} style={{ flex: 1, background: "#fff7e6" }}>
        <Statistic
          title="Monthly Expenses"
          value={stats.monthly}
          precision={2}
          valueStyle={{ color: "#faad14" }}
          prefix={<DollarOutlined />}
          suffix="₹"
        />
      </Card>
      <Card bordered={false} style={{ flex: 1, background: "#fff1f0" }}>
        <Statistic
          title="Weekly Expenses"
          value={stats.weekly}
          precision={2}
          valueStyle={{ color: "#cf1322" }}
          prefix={<DollarOutlined />}
          suffix="₹"
        />
      </Card>
    </div>
  );
};

export default ExpenseStats;
