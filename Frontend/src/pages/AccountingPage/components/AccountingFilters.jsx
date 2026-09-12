import React from "react";
import { Select, DatePicker, Button, Typography, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const AccountingFilters = ({
  timeframe,
  dateRange,
  onTimeframeChange,
  onDateRangeChange,
  onRefresh,
}) => {
  const timeframeOptions = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 20,
      }}
    >
      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
          Accounting
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Financial performance &amp; P&amp;L analysis
        </Text>
      </div>

      <Space wrap size={10}>
        <Select
          value={timeframe}
          onChange={onTimeframeChange}
          options={timeframeOptions}
          style={{ width: 140 }}
        />

        <RangePicker
          value={dateRange}
          onChange={onDateRangeChange}
          format="DD MMM YYYY"
          style={{ width: 230 }}
        />

        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          title="Refresh Data"
          style={{ background: "#4a151b", borderColor: "#4a151b" }}
        />
      </Space>
    </div>
  );
};

export default AccountingFilters;
