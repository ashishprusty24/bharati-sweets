import React, { useState } from "react";
import { Select, DatePicker, Button, Row, Col, Typography } from "antd";
import { ReloadOutlined, DollarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AccountingFilters = ({ timeframe, dateRange, onTimeframeChange, onDateRangeChange, onRefresh }) => {
  const timeframes = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];

  return (
    <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: 24 }}>
      <Col xs={24} lg={12}>
        <Title level={3} style={{ margin: 0, fontSize: "clamp(18px, 4vw, 24px)" }}>
          <DollarOutlined /> Accounting Dashboard
        </Title>
        <Text type="secondary">
          {dateRange[0].format("MMM D, YYYY")} to {dateRange[1].format("MMM D, YYYY")}
        </Text>
      </Col>
      <Col xs={24} lg={12} style={{ textAlign: "right", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "flex-end" }}>
        <Select
          value={timeframe}
          onChange={onTimeframeChange}
          style={{ width: "100%", maxWidth: 180, height: 45 }}
          dropdownStyle={{ borderRadius: 12 }}
        >
          {timeframes.map((tf) => (
            <Select.Option key={tf.value} value={tf.value}>
              {tf.label}
            </Select.Option>
          ))}
        </Select>
        <RangePicker
          value={dateRange}
          onChange={onDateRangeChange}
          style={{ width: "100%", maxWidth: 280, height: 45, borderRadius: 12 }}
        />
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          size="large"
          style={{ height: 45, borderRadius: 10 }}
        >
          Refresh
        </Button>
      </Col>
    </Row>
  );
};

export default AccountingFilters;
