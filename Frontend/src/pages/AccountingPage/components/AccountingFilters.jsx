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
    <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
      <Col>
        <Title level={3} style={{ margin: 0 }}>
          <DollarOutlined /> Accounting Dashboard
        </Title>
        <Text type="secondary">
          {dateRange[0].format("MMM D, YYYY")} to {dateRange[1].format("MMM D, YYYY")}
        </Text>
      </Col>
      <Col>
        <Select
          value={timeframe}
          onChange={onTimeframeChange}
          style={{ width: 180, marginRight: 16 }}
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
          style={{ width: 250 }}
        />
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          style={{ marginLeft: 16 }}
        >
          Refresh
        </Button>
      </Col>
    </Row>
  );
};

export default AccountingFilters;
