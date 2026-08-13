import React from "react";
import { Select } from "antd";
import { CalendarOutlined } from "@ant-design/icons";

const { Option } = Select;

const DashboardHeader = ({ period, setPeriod }) => {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 16, paddingTop: 4 }}>
      <Select
        value={period}
        onChange={setPeriod}
        style={{ width: 150 }}
        suffixIcon={<CalendarOutlined style={{ color: "#64748b" }} />}
        className="header-select-pill"
      >
        <Option value="30d">Last 30 Days</Option>
        <Option value="today">Today</Option>
        <Option value="2y">Last 2 Years</Option>
      </Select>
    </div>
  );
};

export default DashboardHeader;
