import React from "react";
import { Button, DatePicker, Typography, Tag } from "antd";
import { CalendarOutlined, CloseOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const PRESETS = [
  { key: "this_month", label: "This Month" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This Week" },
  { key: "last_month", label: "Last Month" },
];

const DateFilterBar = ({
  datePreset,
  dateRange,
  onPresetChange,
  onDateRangeChange,
  style = {},
}) => {
  const getActiveRangeText = () => {
    if (!dateRange || dateRange.length !== 2 || !dateRange[0] || !dateRange[1]) {
      return null;
    }
    return `${dateRange[0].format("DD MMM YYYY")} - ${dateRange[1].format("DD MMM YYYY")}`;
  };

  const activeText = getActiveRangeText();

  return (
    <div
      style={{
        background: "#f8fafc",
        padding: "10px 14px",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {/* Horizontal Swipeable Preset Pills Bar */}
        <div className="date-presets-scroll-container">
          <Text strong style={{ fontSize: 13, marginRight: 2, color: "#475569", flexShrink: 0 }}>
            <CalendarOutlined /> Date Filter:
          </Text>
          {PRESETS.map((p) => {
            const isActive = datePreset === p.key;
            return (
              <Button
                key={p.key}
                size="small"
                type={isActive ? "primary" : "default"}
                onClick={() => onPresetChange(p.key)}
                style={{
                  borderRadius: 16,
                  height: 32,
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? "0 2px 6px rgba(99, 102, 241, 0.25)" : "none",
                }}
              >
                {p.label}
              </Button>
            );
          })}
        </div>

        {/* Inline RangePicker (Mobile & Desktop) */}
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            onDateRangeChange(dates);
          }}
          style={{ height: 38, borderRadius: 10, flex: 1, minWidth: 220, maxWidth: "100%" }}
          format="DD MMM YYYY"
          placeholder={["Start date", "End date"]}
        />
      </div>

      {/* Active Filter Date Summary Tag */}
      {activeText && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Tag color="purple" style={{ borderRadius: 10, padding: "2px 10px", fontSize: 12, margin: 0 }}>
            Range: <strong>{activeText}</strong>
          </Tag>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => onPresetChange("this_month")}
            style={{ fontSize: 11, color: "#64748b", height: 22, padding: "0 6px" }}
          >
            Reset
          </Button>
        </div>
      )}
    </div>
  );
};

export default DateFilterBar;
