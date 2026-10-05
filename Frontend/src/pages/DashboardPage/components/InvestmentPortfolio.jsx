import React from "react";
import { Card, Typography, Row, Col, Tag, Button, Table, Space, Progress, Tooltip, Empty, Spin } from "antd";
import {
  FundOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  BankOutlined,
  WalletOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useFetch from "../../../hooks/useFetch";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const TYPE_CONFIG = {
  SIP: { color: "cyan", bg: "#f0fdfa", text: "#0d9488", icon: "📈", label: "SIP / Mutual Fund" },
  FD: { color: "purple", bg: "#faf5ff", text: "#7e22ce", icon: "🏦", label: "Fixed Deposit" },
  "Mutual Fund": { color: "blue", bg: "#eff6ff", text: "#1d4ed8", icon: "📊", label: "Mutual Fund" },
  Gold: { color: "gold", bg: "#fffbeb", text: "#b45309", icon: "🪙", label: "Gold Savings" },
  "PPF / LIC": { color: "green", bg: "#f0fdf4", text: "#15803d", icon: "🛡️", label: "PPF / LIC" },
  Other: { color: "default", bg: "#f8fafc", text: "#475569", icon: "📋", label: "Other Asset" },
};

const InvestmentPortfolio = ({ queryStr = "period=from_corrected" }) => {
  const navigate = useNavigate();
  const { data, loading } = useFetch(`/dashboard/investments?${queryStr}`);

  const periodTotal = Number(data?.periodTotal || 0);
  const allTimeTotal = Number(data?.allTimeTotal || 0);
  const count = Number(data?.count || 0);
  const allTimeCount = Number(data?.allTimeCount || 0);
  const breakdownByType = data?.breakdownByType || [];
  const breakdownByMode = data?.breakdownByMode || { cash: 0, bank: 0 };
  const recentInvestments = data?.recentInvestments || [];

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (val) => (
        <Space orientation="horizontal" size={4}>
          <CalendarOutlined style={{ color: "#94a3b8", fontSize: 12 }} />
          <Text strong style={{ fontSize: 13, color: "#334155" }}>
            {val ? dayjs(val).format("DD MMM YYYY") : "—"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Investment Name & Plan",
      dataIndex: "name",
      key: "name",
      render: (val, record) => (
        <div>
          <Text strong style={{ color: "#0f172a", fontSize: 13, display: "block" }}>
            {val || "Investment"}
          </Text>
          {record.notes && record.notes !== "Recorded in Daily Ledger" && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.notes}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Asset Type",
      dataIndex: "type",
      key: "type",
      width: 140,
      render: (val) => {
        const cfg = TYPE_CONFIG[val] || TYPE_CONFIG.Other;
        return (
          <Tag
            style={{
              borderRadius: 6,
              padding: "2px 8px",
              fontWeight: 600,
              fontSize: 12,
              background: cfg.bg,
              color: cfg.text,
              border: `1px solid ${cfg.text}30`,
            }}
          >
            {cfg.icon} {val || "SIP"}
          </Tag>
        );
      },
    },
    {
      title: "Payment Mode",
      dataIndex: "paymentMode",
      key: "paymentMode",
      width: 120,
      render: (mode) => (
        <Tag
          style={{
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 11,
            background: mode === "bank" ? "#eff6ff" : "#fff7ed",
            color: mode === "bank" ? "#1d4ed8" : "#c2410c",
            border: mode === "bank" ? "1px solid #bfdbfe" : "1px solid #fed7aa",
          }}
        >
          {mode === "bank" ? "🏦 Bank / Net" : "💵 Cash"}
        </Tag>
      ),
    },
    {
      title: "Amount Invested",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 150,
      render: (amount) => (
        <Text strong style={{ color: "#0d9488", fontSize: 15, fontWeight: 700 }}>
          ₹{fmt(amount)}
        </Text>
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        marginBottom: 20,
        overflow: "hidden",
      }}
      bodyStyle={{ padding: "20px 24px" }}
    >
      {/* ─── CARD HEADER ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #0d9488 0%, #047857 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 22,
              boxShadow: "0 4px 12px rgba(13, 148, 136, 0.25)",
            }}
          >
            <FundOutlined />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: "#0f172a", fontSize: 18 }}>
                Investment Portfolio & Tracking
              </Title>
              <Tag
                style={{
                  background: "#f0fdfa",
                  color: "#0f766e",
                  border: "1px solid #99f6e4",
                  fontWeight: 700,
                  fontSize: 11,
                  borderRadius: 6,
                }}
              >
                Auto-Synced from Daily Ledger
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Track wealth accumulation, SIPs, fixed deposits, and long-term business savings
            </Text>
          </div>
        </div>

        <Tooltip title="Investments can be added directly via Daily Ledger entries">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/ledger")}
            style={{
              background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
              borderColor: "#0d9488",
              borderRadius: 10,
              fontWeight: 700,
              height: 38,
              padding: "0 18px",
              boxShadow: "0 2px 8px rgba(13, 148, 136, 0.2)",
            }}
          >
            + Add in Daily Ledger
          </Button>
        </Tooltip>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin tip="Loading investment portfolio..." />
        </div>
      ) : (
        <>
          {/* ─── METRIC STATS BANNER ─── */}
          <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
            {/* Stat 1: Period Investment */}
            <Col xs={24} sm={12} lg={6}>
              <div
                style={{
                  background: "linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)",
                  border: "1px solid #99f6e4",
                  borderRadius: 14,
                  padding: "16px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: "#0f766e", textTransform: "uppercase" }}>
                      Period Invested
                    </Text>
                    <RiseOutlined style={{ color: "#0d9488", fontSize: 16 }} />
                  </div>
                  <Title level={3} style={{ margin: 0, fontWeight: 800, color: "#0f766e", fontSize: 24 }}>
                    ₹{fmt(periodTotal)}
                  </Title>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 11, color: "#047857" }}>
                    {count} {count === 1 ? "entry" : "entries"} in selected timeframe
                  </Text>
                </div>
              </div>
            </Col>

            {/* Stat 2: Lifetime / All-Time Assets */}
            <Col xs={24} sm={12} lg={6}>
              <div
                style={{
                  background: "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)",
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "16px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      All-Time Portfolio
                    </Text>
                    <SafetyCertificateOutlined style={{ color: "#2563eb", fontSize: 16 }} />
                  </div>
                  <Title level={3} style={{ margin: 0, fontWeight: 800, color: "#1e293b", fontSize: 24 }}>
                    ₹{fmt(allTimeTotal)}
                  </Title>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {allTimeCount} total lifetime investment records
                  </Text>
                </div>
              </div>
            </Col>

            {/* Stat 3: Digital / Bank Share */}
            <Col xs={24} sm={12} lg={6}>
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 14,
                  padding: "16px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", textTransform: "uppercase" }}>
                      Bank / Digital Fund
                    </Text>
                    <BankOutlined style={{ color: "#2563eb", fontSize: 16 }} />
                  </div>
                  <Title level={3} style={{ margin: 0, fontWeight: 800, color: "#1d4ed8", fontSize: 24 }}>
                    ₹{fmt(breakdownByMode.bank || 0)}
                  </Title>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: "#3b82f6" }}>
                    Online transfers, auto-debits & SIPs
                  </Text>
                </div>
              </div>
            </Col>

            {/* Stat 4: Cash Investments */}
            <Col xs={24} sm={12} lg={6}>
              <div
                style={{
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: 14,
                  padding: "16px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: "#9a3412", textTransform: "uppercase" }}>
                      Cash Outflow Invested
                    </Text>
                    <WalletOutlined style={{ color: "#ea580c", fontSize: 16 }} />
                  </div>
                  <Title level={3} style={{ margin: 0, fontWeight: 800, color: "#c2410c", fontSize: 24 }}>
                    ₹{fmt(breakdownByMode.cash || 0)}
                  </Title>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: "#ea580c" }}>
                    Physical cash invested from shop drawer
                  </Text>
                </div>
              </div>
            </Col>
          </Row>

          {/* ─── ASSET ALLOCATION BREAKDOWN ─── */}
          {breakdownByType.length > 0 && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #f1f5f9",
                borderRadius: 14,
                padding: "16px 20px",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text strong style={{ fontSize: 13, color: "#334155" }}>
                  Asset Class Breakdown
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Portfolio distribution across plans
                </Text>
              </div>

              <Row gutter={[12, 12]}>
                {breakdownByType.map((b, idx) => {
                  const cfg = TYPE_CONFIG[b.type] || TYPE_CONFIG.Other;
                  return (
                    <Col xs={12} sm={8} md={6} lg={4} key={idx}>
                      <div
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 10,
                          padding: "10px 12px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: cfg.text }}>
                            {cfg.icon} {b.type}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>
                            {b.percent}%
                          </span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                          ₹{fmt(b.amount)}
                        </div>
                        <Progress
                          percent={b.percent}
                          size="small"
                          showInfo={false}
                          strokeColor={cfg.text}
                          trailColor="#f1f5f9"
                          style={{ margin: "4px 0 0 0" }}
                        />
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          )}

          {/* ─── RECENT TRANSACTIONS TABLE ─── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <HistoryOutlined style={{ color: "#64748b", fontSize: 14 }} />
                <Text strong style={{ fontSize: 14, color: "#0f172a" }}>
                  Recent Investment Records
                </Text>
              </div>
              <Button
                type="link"
                onClick={() => navigate("/ledger")}
                icon={<ArrowRightOutlined />}
                style={{ padding: 0, fontSize: 12, fontWeight: 600, color: "#0d9488" }}
              >
                View Full Daily Ledger
              </Button>
            </div>

            {recentInvestments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "36px 16px",
                  background: "#f8fafc",
                  borderRadius: 14,
                  border: "1px dashed #cbd5e1",
                }}
              >
                <FundOutlined style={{ fontSize: 36, color: "#0d9488", opacity: 0.6, marginBottom: 8 }} />
                <Title level={5} style={{ margin: 0, color: "#475569" }}>
                  No Investments Logged Yet
                </Title>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4, maxWidth: 420, margin: "4px auto 14px auto" }}>
                  To record SIP, Fixed Deposits, Gold savings, or Mutual Funds, add an investment row in your Daily Ledger.
                </Text>
                <Button
                  type="primary"
                  onClick={() => navigate("/ledger")}
                  icon={<PlusOutlined />}
                  style={{
                    background: "#0d9488",
                    borderColor: "#0d9488",
                    borderRadius: 8,
                    fontWeight: 600,
                  }}
                >
                  Record in Daily Ledger
                </Button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <Table
                  dataSource={recentInvestments}
                  columns={columns}
                  pagination={false}
                  rowKey={(r, index) => r.id || `${r.date}_${index}`}
                  size="small"
                  style={{ background: "#ffffff" }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

export default InvestmentPortfolio;
