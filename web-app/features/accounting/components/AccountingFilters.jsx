import React from "react";
import { DatePicker, Button, Typography, Grid } from "antd";
import {
  ReloadOutlined,
  DollarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const AccountingFilters = ({
  timeframe,
  dateRange,
  onTimeframeChange,
  onDateRangeChange,
  onRefresh,
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const presets = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
        borderRadius: 24,
        padding: isMobile ? "20px 16px" : "28px 32px",
        color: "#fff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.2)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: "-50px",
          top: "-50px",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(0,0,0,0) 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          justify: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                padding: "8px 12px",
                borderRadius: 14,
                display: "inline-flex",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <DollarOutlined style={{ fontSize: 22, color: "#34d399" }} />
            </span>
            <Title
              level={2}
              style={{
                color: "#fff",
                margin: 0,
                fontWeight: 800,
                fontSize: isMobile ? "1.4rem" : "1.8rem",
                letterSpacing: "-0.5px",
              }}
            >
              Financial Intelligence & Accounting
            </Title>
          </div>
          <Text style={{ color: "#cbd5e1", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <CalendarOutlined style={{ color: "#a78bfa" }} />
            Active Period:{" "}
            <strong style={{ color: "#f8fafc" }}>
              {dateRange[0]?.format("DD MMM YYYY")} — {dateRange[1]?.format("DD MMM YYYY")}
            </strong>
          </Text>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            width: isMobile ? "100%" : "auto",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              padding: 4,
              borderRadius: 14,
              display: "flex",
              gap: 4,
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              width: isMobile ? "100%" : "auto",
              overflowX: "auto",
            }}
          >
            {presets.map((p) => {
              const isActive = timeframe === p.value;
              return (
                <Button
                  key={p.value}
                  type={isActive ? "primary" : "text"}
                  onClick={() => onTimeframeChange(p.value)}
                  style={{
                    borderRadius: 10,
                    height: 36,
                    fontSize: 12,
                    fontWeight: 600,
                    color: isActive ? "#fff" : "#cbd5e1",
                    background: isActive
                      ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                      : "transparent",
                    border: "none",
                  }}
                >
                  {p.label}
                </Button>
              );
            })}
          </div>

          <RangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            format="DD MMM YYYY"
            style={{
              height: 44,
              borderRadius: 14,
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#fff",
              width: isMobile ? "100%" : 240,
            }}
          />

          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 14,
              fontWeight: 700,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              border: "none",
            }}
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountingFilters;
