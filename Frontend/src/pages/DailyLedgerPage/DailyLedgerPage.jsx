import React, { useState, useEffect, useMemo } from "react";
import {
  Card, Row, Col, DatePicker, Table, Button, InputNumber, Input, Select,
  message, Typography, Space, Divider, Tag
} from "antd";
import {
  SaveOutlined, PlusOutlined, DeleteOutlined, WalletOutlined,
  BankOutlined, HomeOutlined, ShoppingCartOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";

const { Title, Text } = Typography;
const { Option } = Select;

const DailyLedgerPage = () => {
  const [date, setDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState({
    openingBalance: 0,
    openingBankBalance: 0,
    otherIncome: 0,
    cashToHome: 0,
    digitalToHome: 0,
    closingBalance: 0,
    closingBankBalance: 0,
    items: [],
  });

  const fetchLedger = async (targetDate) => {
    setLoading(true);
    try {
      const data = await api.get(`/ledger/${targetDate.format("YYYY-MM-DD")}`);
      setLedgerData({
        openingBalance: data.openingBalance || 0,
        openingBankBalance: data.openingBankBalance || 0,
        otherIncome: data.otherIncome || 0,
        cashToHome: data.cashToHome || 0,
        digitalToHome: data.digitalToHome || 0,
        closingBalance: data.closingBalance || 0,
        closingBankBalance: data.closingBankBalance || 0,
        items: data.items || [],
      });
    } catch (error) {
      console.error(error);
      message.error("Failed to fetch ledger data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger(date);
  }, [date]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post(`/ledger/${date.format("YYYY-MM-DD")}`, ledgerData);
      message.success("Ledger saved successfully");
      fetchLedger(date);
    } catch (error) {
      console.error(error);
      message.error("Failed to save ledger");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setLedgerData({
      ...ledgerData,
      items: [
        ...ledgerData.items,
        { description: "", amount: 0, type: "expense", paymentMode: "cash" },
      ],
    });
  };

  const removeItem = (index) => {
    const newItems = [...ledgerData.items];
    newItems.splice(index, 1);
    setLedgerData({ ...ledgerData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...ledgerData.items];
    newItems[index][field] = value;
    setLedgerData({ ...ledgerData, items: newItems });
  };

  // ---------- DERIVED CALCULATIONS ----------
  const totals = useMemo(() => {
    const items = ledgerData.items || [];

    const cashExpenses = items
      .filter((i) => i.type === "expense" && i.paymentMode !== "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const bankExpenses = items
      .filter((i) => i.type === "expense" && i.paymentMode === "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const cashIncome = items
      .filter((i) => i.type === "income" && i.paymentMode !== "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const bankIncome = items
      .filter((i) => i.type === "income" && i.paymentMode === "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const totalExpenses = cashExpenses + bankExpenses;

    const opening = Number(ledgerData.openingBalance || 0);
    const openingBank = Number(ledgerData.openingBankBalance || 0);
    const closing = Number(ledgerData.closingBalance || 0);
    const closingBank = Number(ledgerData.closingBankBalance || 0);
    const cashHome = Number(ledgerData.cashToHome || 0);
    const digitalHome = Number(ledgerData.digitalToHome || 0);
    const otherInc = Number(ledgerData.otherIncome || 0);

    // SELL FORMULA (from client):
    // Cash Sell = Closing Cash + Cash Expenses + Cash to Home − Opening Cash − Other Cash Income
    const derivedCashSell = closing + cashExpenses + cashHome - opening - otherInc - cashIncome;
    // Digital Sell = Closing Digital + Digital Expenses + Digital Home − Opening Digital − Digital Income
    const derivedDigitalSell = closingBank + bankExpenses + digitalHome - openingBank - bankIncome;
    const derivedTotalSell = derivedCashSell + derivedDigitalSell;

    // Has closing been entered? (to decide whether to show sell)
    const hasClosing = closing > 0 || closingBank > 0;

    return {
      cashExpenses,
      bankExpenses,
      totalExpenses,
      derivedCashSell,
      derivedDigitalSell,
      derivedTotalSell,
      cashHome,
      digitalHome,
      hasClosing,
    };
  }, [ledgerData]);

  // ---------- TABLE COLUMNS ----------
  const columns = [
    {
      title: "#",
      width: 45,
      render: (_, __, index) => (
        <Text type="secondary" style={{ fontWeight: 600 }}>{index + 1}</Text>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text, _, index) => (
        <Input
          value={text}
          onChange={(e) => updateItem(index, "description", e.target.value)}
          placeholder="e.g., Staff Meal, Milk, Bharat Gas, SIP, Home Loan..."
        />
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      width: 110,
      render: (type, _, index) => (
        <Select
          value={type}
          onChange={(value) => updateItem(index, "type", value)}
          style={{ width: "100%" }}
        >
          <Option value="expense">Expense</Option>
          <Option value="income">Income</Option>
        </Select>
      ),
    },
    {
      title: "Mode",
      dataIndex: "paymentMode",
      width: 110,
      render: (mode, _, index) => (
        <Select
          value={mode || "cash"}
          onChange={(value) => updateItem(index, "paymentMode", value)}
          style={{ width: "100%" }}
        >
          <Option value="cash">💵 Cash</Option>
          <Option value="bank">🏦 Bank</Option>
        </Select>
      ),
    },
    {
      title: "Amount (₹)",
      dataIndex: "amount",
      width: 140,
      render: (amount, _, index) => (
        <InputNumber
          value={amount}
          onChange={(value) => updateItem(index, "amount", value)}
          style={{ width: "100%" }}
          prefix="₹"
          min={0}
        />
      ),
    },
    {
      title: "",
      width: 45,
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(index)}
        />
      ),
    },
  ];

  // ---------- RENDER ----------
  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

  return (
    <div style={{ padding: "0 8px" }}>
      {/* HEADER */}
      <div
        className="page-header-container"
        style={{
          display: "flex", flexWrap: "wrap", justifyContent: "space-between",
          alignItems: "center", gap: "16px", marginBottom: "24px",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: "1.5rem" }}>
            Daily Ledger
          </Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Enter expenses, closing balance → Sell is auto-calculated.
          </Text>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }} className="header-actions">
          <DatePicker
            value={date}
            onChange={setDate}
            allowClear={false}
            format="DD MMM YYYY (dddd)"
            style={{ width: 250, height: 45, borderRadius: 10 }}
          />
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            style={{ borderRadius: 10, height: 45, padding: "0 24px" }}
          >
            Save
          </Button>
        </div>
      </div>

      {/* ─── OPENING BALANCE ─── */}
      <Card
        bordered={false}
        className="glass-card"
        style={{ borderRadius: 16, marginBottom: 20 }}
      >
        <Row gutter={[20, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Text style={{ fontSize: 13, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Opening Balance
            </Text>
            <Text type="secondary" style={{ display: "block", fontSize: 11 }}>
              Physical cash count (morning)
            </Text>
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <WalletOutlined style={{ color: "#3b82f6" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>Cash</Text>
            </div>
            <InputNumber
              value={ledgerData.openingBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, openingBalance: v || 0 })}
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8 }}
              prefix="₹"
            />
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <BankOutlined style={{ color: "#7c3aed" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>P/P (Digital)</Text>
            </div>
            <InputNumber
              value={ledgerData.openingBankBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, openingBankBalance: v || 0 })}
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8 }}
              prefix="₹"
            />
          </Col>
        </Row>
      </Card>

      {/* ─── DAILY EXPENSES TABLE ─── */}
      <Card
        bordered={false}
        className="glass-card ledger-details-card"
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>Daily Expenses & Income</Title>
              <Text type="secondary" style={{ fontSize: 11 }}>All payments: Staff Meal, Gas, Milk, SIP, Home Loan, Supplier, etc.</Text>
            </div>
            <Button
              type="primary"
              onClick={addItem}
              icon={<PlusOutlined />}
              style={{ borderRadius: 8 }}
            >
              Add Entry
            </Button>
          </div>
        }
        style={{ borderRadius: 20, marginBottom: 20 }}
      >
        <div className="responsive-table-container">
          <Table
            dataSource={ledgerData.items}
            columns={columns}
            pagination={false}
            rowKey={(_, index) => index}
            size="middle"
            footer={() => (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 24 }}>
                <Text type="secondary" style={{ fontWeight: 600 }}>
                  Cash Expenses: <Text strong style={{ color: "#ef4444" }}>₹{fmt(totals.cashExpenses)}</Text>
                </Text>
                <Text type="secondary" style={{ fontWeight: 600 }}>
                  Bank Expenses: <Text strong style={{ color: "#7c3aed" }}>₹{fmt(totals.bankExpenses)}</Text>
                </Text>
                <Text style={{ fontWeight: 700, fontSize: 15 }}>
                  Total: <Text strong style={{ color: "#ef4444", fontSize: 16 }}>₹{fmt(totals.totalExpenses)}</Text>
                </Text>
              </div>
            )}
          />
        </div>
      </Card>

      {/* ─── MAA / CASH TO HOME ─── */}
      <Card
        bordered={false}
        className="glass-card"
        style={{
          borderRadius: 16, marginBottom: 20,
          borderLeft: "4px solid #8b5cf6",
        }}
      >
        <Row gutter={[20, 16]} align="middle">
          <Col xs={24} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <HomeOutlined style={{ fontSize: 20, color: "#8b5cf6" }} />
              <div>
                <Text style={{ fontSize: 13, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Maa / Home
                </Text>
                <Text type="secondary" style={{ display: "block", fontSize: 11 }}>
                  Cash & digital taken home
                </Text>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <WalletOutlined style={{ color: "#8b5cf6" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>Cash to Home</Text>
            </div>
            <InputNumber
              value={ledgerData.cashToHome}
              onChange={(v) => setLedgerData({ ...ledgerData, cashToHome: v || 0 })}
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8, backgroundColor: "#f5f3ff", borderColor: "#c4b5fd" }}
              prefix="₹"
            />
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <BankOutlined style={{ color: "#8b5cf6" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>Account to Home</Text>
            </div>
            <InputNumber
              value={ledgerData.digitalToHome}
              onChange={(v) => setLedgerData({ ...ledgerData, digitalToHome: v || 0 })}
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8, backgroundColor: "#f5f3ff", borderColor: "#c4b5fd" }}
              prefix="₹"
            />
          </Col>
        </Row>
      </Card>

      {/* ─── CLOSING BALANCE (Physical Count) ─── */}
      <Card
        bordered={false}
        className="glass-card"
        style={{
          borderRadius: 16, marginBottom: 20,
          borderLeft: "4px solid #f59e0b",
        }}
      >
        <Row gutter={[20, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Text style={{ fontSize: 13, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Closing Balance
            </Text>
            <Text type="secondary" style={{ display: "block", fontSize: 11 }}>
              Physical cash count (evening)
            </Text>
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <WalletOutlined style={{ color: "#f59e0b" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>Cash</Text>
            </div>
            <InputNumber
              value={ledgerData.closingBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, closingBalance: v || 0 })}
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8, backgroundColor: "#fffbeb", borderColor: "#fcd34d" }}
              prefix="₹"
            />
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <BankOutlined style={{ color: "#f59e0b" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>P/P (Digital)</Text>
            </div>
            <InputNumber
              value={ledgerData.closingBankBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, closingBankBalance: v || 0 })}
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8, backgroundColor: "#fffbeb", borderColor: "#fcd34d" }}
              prefix="₹"
            />
          </Col>
        </Row>
      </Card>

      {/* ─── ★ DERIVED SELL ★ ─── */}
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          background: totals.hasClosing
            ? "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)"
            : "#f1f5f9",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        {totals.hasClosing && (
          <>
            <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(59,130,246,0.08)" }} />
            <div style={{ position: "absolute", bottom: -20, left: 40, width: 100, height: 100, borderRadius: "50%", background: "rgba(16,185,129,0.06)" }} />
          </>
        )}

        <div style={{ position: "relative", zIndex: 1, padding: "8px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <ShoppingCartOutlined style={{ fontSize: 24, color: totals.hasClosing ? "#60a5fa" : "#94a3b8" }} />
            <Title level={3} style={{ margin: 0, color: totals.hasClosing ? "white" : "#64748b", fontWeight: 800, letterSpacing: 1 }}>
              TODAY'S SELL
            </Title>
          </div>

          {!totals.hasClosing ? (
            <Text style={{ color: "#94a3b8", fontSize: 14 }}>
              Enter Closing Balance (evening physical count) to see today's sell.
            </Text>
          ) : (
            <>
              <Row gutter={[24, 20]}>
                <Col xs={24} sm={8}>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <WalletOutlined style={{ color: "#10b981" }} />
                      <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Cash Sell</Text>
                    </div>
                    <Title level={2} style={{ margin: 0, color: "#10b981", fontWeight: 800 }}>
                      ₹{fmt(totals.derivedCashSell)}
                    </Title>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <BankOutlined style={{ color: "#818cf8" }} />
                      <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>P/P Sell</Text>
                    </div>
                    <Title level={2} style={{ margin: 0, color: "#818cf8", fontWeight: 800 }}>
                      ₹{fmt(totals.derivedDigitalSell)}
                    </Title>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ background: "rgba(16,185,129,0.12)", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <ShoppingCartOutlined style={{ color: "#fbbf24" }} />
                      <Text style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Total Sell</Text>
                    </div>
                    <Title level={1} style={{ margin: 0, color: "#ffffff", fontWeight: 900, fontSize: 36 }}>
                      ₹{fmt(totals.derivedTotalSell)}
                    </Title>
                  </div>
                </Col>
              </Row>

              {/* Formula explanation */}
              <div style={{ marginTop: 16, padding: "10px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                <Text style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>
                  Sell = Closing ({fmt(ledgerData.closingBalance)}+{fmt(ledgerData.closingBankBalance)}) + Expenses ({fmt(totals.totalExpenses)}) + Home ({fmt(totals.cashHome)}+{fmt(totals.digitalHome)}) − Opening ({fmt(ledgerData.openingBalance)}+{fmt(ledgerData.openingBankBalance)})
                </Text>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DailyLedgerPage;
