import React, { useState } from "react";
import { Select, DatePicker, Space } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

const DashboardHeader = ({ period, setPeriod, setCustomRange }) => {
  const [mode, setMode] = useState("preset"); // "preset" | "custom_month" | "custom_range"

  const handleSelectChange = (val) => {
    if (val === "custom_month") {
      setMode("custom_month");
      setPeriod("custom");
    } else if (val === "custom_range") {
      setMode("custom_range");
      setPeriod("custom");
    } else {
      setMode("preset");
      setPeriod(val);
      setCustomRange(null);
    }
  };

  const handleMonthChange = (date) => {
    if (date) {
      const start = date.startOf("month").toISOString();
      const end = dayjs().endOf("day").toISOString();
      setCustomRange({ startDate: start, endDate: end });
    } else {
      setCustomRange(null);
    }
  };

  const handleRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      const start = dates[0].startOf("day").toISOString();
      const end = dates[1].endOf("day").toISOString();
      setCustomRange({ startDate: start, endDate: end });
    } else {
      setCustomRange(null);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginBottom: 16, paddingTop: 4, flexWrap: "wrap" }}>
      {mode === "custom_month" && (
        <Space size={6}>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>From:</span>
          <DatePicker
            picker="month"
            placeholder="Select Month & Year"
            style={{ borderRadius: 10 }}
            onChange={handleMonthChange}
            disabledDate={(current) => current && current > dayjs().endOf("day")}
          />
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>till now</span>
        </Space>
      )}

      {mode === "custom_range" && (
        <RangePicker
          style={{ borderRadius: 10 }}
          onChange={handleRangeChange}
          disabledDate={(current) => current && current > dayjs().endOf("day")}
        />
      )}

      <Select
        value={period === "custom" ? (mode === "custom_month" ? "custom_month" : "custom_range") : period}
        onChange={handleSelectChange}
        style={{ minWidth: 170 }}
        suffixIcon={<CalendarOutlined style={{ color: "#64748b" }} />}
        className="header-select-pill"
      >
        <Option value="30d">Last 30 Days</Option>
        <Option value="today">Today</Option>
        <Option value="6m">Last 6 Months</Option>
        <Option value="1y">Last 1 Year</Option>
        <Option value="2y">Last 2 Years</Option>
        <Option value="all">All Time</Option>
        <Option value="custom_month">📅 Pick Month/Year (Till Now)</Option>
        <Option value="custom_range">📅 Custom Date Range</Option>
      </Select>
    </div>
  );
};

export default DashboardHeader;
