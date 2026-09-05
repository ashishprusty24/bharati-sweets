import React, { useState, useEffect } from "react";
import {
  Modal, Select, Table, Card, Row, Col, Typography, Space, Tag, Empty, Spin, Tooltip, Badge, Grid
} from "antd";
import {
  GiftOutlined, TrophyOutlined, ShoppingCartOutlined, ArrowUpOutlined,
  ExperimentOutlined, CalendarOutlined, InfoCircleOutlined, CheckCircleOutlined,
  WarningOutlined, BoxPlotOutlined
} from "@ant-design/icons";
import api from "../../../services/api";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const FESTIVALS_PRESETS = [
  "Rakhi Purnima",
  "Diwali",
  "Dussehra / Vijaya Dashami",
  "Durga Puja",
  "Chhath Puja",
  "Holi",
  "Christmas",
  "New Year",
  "Eid",
  "Ganesh Chaturthi",
  "Janmashtami",
  "Onam",
  "Raja Sankranti",
  "Nuakhai",
  "Kumar Purnima",
  "Kartik Purnima",
  "Makar Sankranti",
];

export default function FestivalAnalyticsModal({ open, onClose, defaultFestival = "Rakhi Purnima" }) {
  const screens = useBreakpoint();
  const [selectedFestival, setSelectedFestival] = useState(defaultFestival || "Rakhi Purnima");
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [festivalList, setFestivalList] = useState([]);

  const fetchFestivalList = async () => {
    try {
      const data = await api.get("/festivals/list");
      setFestivalList(data || FESTIVALS_PRESETS.map((f) => ({ value: f })));
    } catch (e) {
      setFestivalList(FESTIVALS_PRESETS.map((f) => ({ value: f })));
    }
  };

  const fetchAnalytics = async (festivalName) => {
    if (!festivalName) return;
    setLoading(true);
    try {
      const data = await api.get(`/festivals/analytics?festival=${encodeURIComponent(festivalName)}`);
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFestivalList();
      setSelectedFestival(defaultFestival || "Rakhi Purnima");
      fetchAnalytics(defaultFestival || "Rakhi Purnima");
    }
  }, [open, defaultFestival]);

  const handleFestivalChange = (val) => {
    setSelectedFestival(val);
    fetchAnalytics(val);
  };

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

  const sweetColumns = [
    {
      title: "Sweet Name",
      dataIndex: "sweetName",
      key: "sweetName",
      render: (text) => <Text strong style={{ fontSize: 14, color: "#1e293b" }}>{text}</Text>,
    },
    {
      title: "Year-by-Year Log",
      dataIndex: "history",
      key: "history",
      render: (history) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {(history || []).map((h, idx) => (
            <div
              key={idx}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "6px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div>
                <Tag color="purple" style={{ fontWeight: 700, borderRadius: 6 }}>{h.year}</Tag>
                <Text type="secondary" style={{ fontSize: 11 }}>({h.dateFormatted})</Text>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <Text style={{ fontSize: 12 }}>
                  Made: <Text strong style={{ color: "#6366f1" }}>{h.quantity} {h.unit}</Text>
                </Text>
                <Text style={{ fontSize: 12 }}>
                  Sold: <Text strong style={{ color: "#10b981" }}>{h.actualSold} {h.unit}</Text>
                </Text>
                {h.actualSold > 0 && (
                  <Tag
                    color={h.diff > 0 ? "warning" : "error"}
                    style={{ fontWeight: 700, borderRadius: 6 }}
                  >
                    {h.diff > 0 ? `📦 Surplus: ${h.diff} ${h.unit}` : `⚠️ Sold Out / Shortage`}
                  </Tag>
                )}

              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Next Year Planning Guidance",
      dataIndex: "latestRecommendation",
      key: "latestRecommendation",
      width: 260,
      render: (rec) => (
        <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "8px 12px", borderRadius: 8 }}>
          <Text style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>{rec}</Text>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: "#fef3c7", color: "#f59e0b", padding: "8px 12px", borderRadius: 10 }}>
            <TrophyOutlined style={{ fontSize: 20 }} />
          </span>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
              Festival Intelligence & YoY Production Planner
            </Title>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Compare sales & sweet production quantities year-over-year (2025 vs 2026 vs 2027)
            </Text>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={screens.md ? 900 : "95vw"}
      destroyOnClose
      style={{ borderRadius: 20, maxWidth: "95vw", top: screens.md ? 100 : 20 }}
    >
      <div style={{ marginTop: 16 }}>
        {/* Festival Selector Header */}
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", padding: "20px 24px", borderRadius: 16, color: "#fff", marginBottom: 20 }}>
          <Text style={{ color: "#cbd5e1", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, display: "block", marginBottom: 8 }}>
            Select Festival to Compare:
          </Text>
          <Select
            showSearch
            value={selectedFestival}
            onChange={handleFestivalChange}
            placeholder="Select or search festival (e.g. Rakhi Purnima)..."
            options={festivalList}
            filterOption={(input, option) => option.value.toLowerCase().includes(input.toLowerCase())}
            style={{ width: "100%", maxWidth: 400, height: 42 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Spin size="large" />
            <Text style={{ display: "block", marginTop: 12, color: "#64748b" }}>
              Analyzing festival sales & production history...
            </Text>
          </div>
        ) : !analytics || !analytics.years || analytics.years.length === 0 ? (
          <Empty
            description={
              <span>
                No historical ledger records found for <Text strong style={{ color: "#f59e0b" }}>"{selectedFestival}"</Text>.
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tag this festival on your Daily Ledger date to start tracking Year-over-Year insights.
                </Text>
              </span>
            }
            style={{ padding: "40px 0" }}
          />
        ) : (
          <>
            {/* Sales Comparison Cards */}
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ fontSize: 14, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 12 }}>
                📊 Year-over-Year Counter Sales Performance
              </Text>
              <Row gutter={[16, 16]}>
                {analytics.years.map((yr, idx) => (
                  <Col xs={24} sm={12} md={8} key={idx}>
                    <Card
                      bordered={false}
                      style={{
                        borderRadius: 14,
                        background: idx === analytics.years.length - 1
                          ? "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)"
                          : "#f8fafc",
                        border: idx === analytics.years.length - 1 ? "none" : "1px solid #e2e8f0",
                        color: idx === analytics.years.length - 1 ? "#fff" : "#1e293b",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <Tag color={idx === analytics.years.length - 1 ? "gold" : "blue"} style={{ fontWeight: 800, fontSize: 12, borderRadius: 6 }}>
                          {yr.year}
                        </Tag>
                        <Text style={{ fontSize: 11, color: idx === analytics.years.length - 1 ? "#94a3b8" : "#64748b" }}>
                          {yr.dateFormatted}
                        </Text>
                      </div>
                      <Text style={{ fontSize: 11, textTransform: "uppercase", color: idx === analytics.years.length - 1 ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                        Total Counter Sales
                      </Text>
                      <Title level={3} style={{ margin: "4px 0 0 0", color: idx === analytics.years.length - 1 ? "#34d399" : "#10b981", fontWeight: 900 }}>
                        ₹{fmt(yr.totalSales)}
                      </Title>
                      <div style={{ marginTop: 8, fontSize: 11, color: idx === analytics.years.length - 1 ? "#cbd5e1" : "#64748b" }}>
                        Cash: ₹{fmt(yr.cashSales)} | P/P: ₹{fmt(yr.digitalSales)}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            {/* Sweet Production Intelligence Table */}
            <div>
              <Text strong style={{ fontSize: 14, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 12 }}>
                🍬 Sweet Production & Shortage / Surplus History
              </Text>
              <Table
                dataSource={analytics.sweetAnalytics}
                columns={sweetColumns}
                rowKey="sweetName"
                pagination={false}
                size="middle"
                scroll={{ x: 650 }}
                style={{ background: "#fff", borderRadius: 14, overflow: "hidden" }}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
