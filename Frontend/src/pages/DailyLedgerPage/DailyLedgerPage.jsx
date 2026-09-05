import React, { useState, useEffect, useMemo } from "react";
import {
  Card, Row, Col, DatePicker, Table, Button, InputNumber, Input, Select,
  message, Typography, Space, Tag, Tooltip, AutoComplete, Grid
} from "antd";
import {
  SaveOutlined, PlusOutlined, DeleteOutlined, WalletOutlined,
  BankOutlined, HomeOutlined, ShoppingCartOutlined,
  GiftOutlined, StarOutlined, ExperimentOutlined, TrophyOutlined, FileTextOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";
import FestivalAnalyticsModal from "./components/FestivalAnalyticsModal";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const FESTIVALS = [
  "Rakhi Purnima", "Diwali", "Dussehra / Vijaya Dashami", "Durga Puja",
  "Chhath Puja", "Holi", "Christmas", "New Year", "Eid", "Ganesh Chaturthi",
  "Janmashtami", "Onam", "Raja Sankranti", "Nuakhai", "Kumar Purnima",
  "Kartik Purnima", "Makar Sankranti",
];

const SWEET_NAMES = [
  "Rasgolla", "Gulab Jamun", "Chhena Poda", "Kheer Mohan", "Sandesh",
  "Ladoo", "Barfi", "Kaju Katli", "Halwa", "Jalebi", "Imarti",
  "Rasmalai", "Pantua", "Ledikeni", "Chhena Gaja",
];

const DailyLedgerPage = () => {
  const screens = useBreakpoint();
  const isMobile = screens.md === false;
  const [date, setDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [ledgerData, setLedgerData] = useState({
    openingBalance: 0,
    openingBankBalance: 0,
    otherIncome: 0,
    cashToHome: 0,
    digitalToHome: 0,
    closingBalance: 0,
    closingBankBalance: 0,
    festival: "",
    notes: "",
    sweetProduction: [],
    items: [],
  });

  const isCCItem = (item) => {
    const cat = String(item?.category || "").toLowerCase().trim();
    const desc = String(item?.description || "").toLowerCase().trim();
    const src = String(item?.paymentSource || "").toLowerCase().trim();
    return (
      src === "cc_loan" ||
      src === "credit_card" ||
      cat === "cc_loan" ||
      cat === "cc_loan_repayment" ||
      cat === "credit_card_bill" ||
      desc.startsWith("cc loan:") ||
      desc.startsWith("cc loan -")
    );
  };

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
        festival: data.festival || "",
        notes: data.notes || "",
        sweetProduction: data.sweetProduction || [],
        items: (data.items || []).filter((item) => !isCCItem(item)),
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
      const payload = {
        ...ledgerData,
        items: (ledgerData.items || []).filter((item) => !isCCItem(item)),
      };
      await api.post(`/ledger/${date.format("YYYY-MM-DD")}`, payload);
      message.success("Ledger saved successfully");
      fetchLedger(date);
    } catch (error) {
      console.error(error);
      message.error("Failed to save ledger");
    } finally {
      setLoading(false);
    }
  };

  // ── Ledger items ──────────────────────────────────────────────────
  const addItem = () => {
    setLedgerData({
      ...ledgerData,
      items: [
        ...ledgerData.items,
        { description: "", amount: null, type: "expense", paymentMode: "cash" },
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

  // ── Sweet production ──────────────────────────────────────────────
  const addSweetRow = () => {
    setLedgerData({
      ...ledgerData,
      sweetProduction: [
        ...ledgerData.sweetProduction,
        { sweetName: "", quantity: null, unit: "ghan", actualSold: null, notes: "" },
      ],
    });
  };

  const removeSweetRow = (index) => {
    const arr = [...ledgerData.sweetProduction];
    arr.splice(index, 1);
    setLedgerData({ ...ledgerData, sweetProduction: arr });
  };

  const updateSweetRow = (index, field, value) => {
    const arr = [...ledgerData.sweetProduction];
    arr[index][field] = value;
    setLedgerData({ ...ledgerData, sweetProduction: arr });
  };

  // ── Derived calculations ──────────────────────────────────────────
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

    // Cash Sell = Closing Cash + Cash Expenses + Cash to Home − Opening Cash − Other Cash Income
    const derivedCashSell = closing + cashExpenses + cashHome - opening - otherInc - cashIncome;
    // Digital Sell = Closing Digital + Digital Expenses + Digital Home − Opening Digital − Digital Income
    const derivedDigitalSell = closingBank + bankExpenses + digitalHome - openingBank - bankIncome;
    const derivedTotalSell = derivedCashSell + derivedDigitalSell;
    const hasClosing = closing > 0 || closingBank > 0;

    return {
      cashExpenses, bankExpenses, totalExpenses,
      derivedCashSell, derivedDigitalSell, derivedTotalSell,
      cashHome, digitalHome, hasClosing,
    };
  }, [ledgerData]);

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

  // ── Table columns ─────────────────────────────────────────────────
  const columns = [
    {
      title: "#",
      width: 50,
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
      width: 120,
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
      width: 120,
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
      width: 150,
      render: (amount, _, index) => (
        <InputNumber
          value={amount === 0 ? null : amount}
          onChange={(value) => updateItem(index, "amount", value)}
          style={{ width: "100%" }}
          prefix="₹"
          min={0}
          precision={0}
          placeholder="0"
          controls={false}
        />
      ),
    },
    {
      title: "",
      width: 50,
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

  const sweetColumns = [
    {
      title: "#",
      width: 50,
      render: (_, __, i) => <Text type="secondary" style={{ fontWeight: 600 }}>{i + 1}</Text>,
    },
    {
      title: "Sweet Name",
      dataIndex: "sweetName",
      render: (val, _, i) => (
        <AutoComplete
          options={SWEET_NAMES.map(s => ({ value: s }))}
          value={val}
          onChange={(v) => updateSweetRow(i, "sweetName", v)}
          placeholder="e.g. Rasgolla, Gulab Jamun..."
          filterOption={(inp, opt) => opt.value.toLowerCase().includes(inp.toLowerCase())}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Qty Made",
      dataIndex: "quantity",
      width: 130,
      render: (val, _, i) => (
        <InputNumber
          value={val === 0 ? null : val}
          onChange={(v) => updateSweetRow(i, "quantity", v)}
          style={{ width: "100%" }}
          min={0}
          precision={0}
          placeholder="0"
          controls={false}
        />
      ),
    },
    {
      title: "Unit",
      dataIndex: "unit",
      width: 100,
      render: (val, _, i) => (
        <Select
          value={val || "ghan"}
          onChange={(v) => updateSweetRow(i, "unit", v)}
          style={{ width: "100%" }}
        >
          <Option value="ghan">Ghan</Option>
          <Option value="kg">Kg</Option>
          <Option value="pcs">Pcs</Option>
          <Option value="litre">Litre</Option>
        </Select>
      ),
    },
    {
      title: "Actual Sold",
      dataIndex: "actualSold",
      width: 130,
      render: (val, _, i) => (
        <Tooltip title="How much was actually sold (helps next year planning)">
          <InputNumber
            value={val === 0 ? null : val}
            onChange={(v) => updateSweetRow(i, "actualSold", v)}
            style={{ width: "100%" }}
            min={0}
            precision={0}
            placeholder="0"
            controls={false}
          />
        </Tooltip>
      ),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      render: (val, _, i) => (
        <Input
          value={val}
          onChange={(e) => updateSweetRow(i, "notes", e.target.value)}
          placeholder="e.g. Special order notes..."
        />
      ),
    },
    {
      title: "Status & Suggestion",
      key: "statusSuggestion",
      width: 220,
      render: (_, record) => {
        const made = Number(record.quantity) || 0;
        const sold = Number(record.actualSold) || 0;
        const unit = record.unit || "ghan";
        if (made === 0 && sold === 0) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;

        if (made > sold) {
          const surplus = made - sold;
          return (
            <Tag color="orange" style={{ borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>
              📦 Surplus: {surplus} {unit} (Decrease next year)
            </Tag>
          );
        } else if (sold > made) {
          const shortage = sold - made;
          return (
            <Tag color="red" style={{ borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>
              ⚠️ Shortage: {shortage} {unit} (Increase next year)
            </Tag>
          );
        } else if (made > 0 && sold === made) {
          return (
            <Tag color="green" style={{ borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>
              ✅ 100% Sold Out
            </Tag>
          );
        }
        return null;
      },
    },
    {
      title: "",
      width: 45,
      render: (_, __, i) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeSweetRow(i)} />
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? "0" : "0 8px" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          gap: isMobile ? 12 : 16,
          marginBottom: isMobile ? 16 : 24,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: isMobile ? "1.35rem" : "1.5rem" }}>
            Daily Ledger
          </Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Enter expenses, closing balance → Sell is auto-calculated.
          </Text>
        </div>

        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            <div style={{ display: "flex", gap: 8, width: "100%" }}>
              <DatePicker
                value={date}
                onChange={setDate}
                allowClear={false}
                format="DD MMM YYYY (ddd)"
                style={{ flex: 1, height: 42, borderRadius: 10 }}
              />
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={loading}
                style={{ borderRadius: 10, height: 42, padding: "0 18px", fontWeight: 700 }}
              >
                Save
              </Button>
            </div>
            <Button
              onClick={() => setAnalyticsModalOpen(true)}
              icon={<TrophyOutlined style={{ color: "#f59e0b" }} />}
              style={{
                width: "100%",
                height: 40,
                borderRadius: 10,
                fontWeight: 700,
                background: "#fffbeb",
                borderColor: "#fde68a",
                color: "#b45309",
              }}
            >
              🏆 Festival Intelligence (YoY)
            </Button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Button
              onClick={() => setAnalyticsModalOpen(true)}
              icon={<TrophyOutlined style={{ color: "#f59e0b" }} />}
              style={{
                height: 45,
                borderRadius: 10,
                fontWeight: 700,
                background: "#fffbeb",
                borderColor: "#fde68a",
                color: "#b45309",
              }}
            >
              🏆 Festival Intelligence (YoY)
            </Button>

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
        )}
      </div>

      {/* ─── FESTIVAL TAG CARD ─── */}
      <Card
        bordered={false}
        className="glass-card"
        style={{
          borderRadius: 16,
          marginBottom: 16,
          borderLeft: "4px solid #f59e0b",
          background: ledgerData.festival ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)" : undefined,
        }}
        bodyStyle={{ padding: isMobile ? "14px 16px" : "20px 24px" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
          <GiftOutlined style={{ fontSize: 20, color: "#f59e0b", marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Festival / Occasion Tag
              </Text>
              {ledgerData.festival && (
                <Tag
                  color="gold"
                  icon={<StarOutlined />}
                  style={{ fontWeight: 700, fontSize: 11, padding: "2px 10px", borderRadius: 12, margin: 0 }}
                >
                  {ledgerData.festival}
                </Tag>
              )}
            </div>
            <Text type="secondary" style={{ display: "block", fontSize: 11, marginTop: 2 }}>
              Tag this day for year-over-year comparison (e.g. "Rakhi Purnima 2026")
            </Text>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center" }}>
          <AutoComplete
            options={FESTIVALS.map(f => ({ value: f }))}
            value={ledgerData.festival}
            onChange={(v) => setLedgerData({ ...ledgerData, festival: v })}
            placeholder="Select or type festival name... (e.g. Rakhi Purnima, Diwali)"
            filterOption={(inp, opt) => opt.value.toLowerCase().includes(inp.toLowerCase())}
            style={{ width: "100%", maxWidth: isMobile ? "100%" : 400 }}
            allowClear
          />
          <Button
            size={isMobile ? "middle" : "small"}
            icon={<TrophyOutlined />}
            onClick={() => setAnalyticsModalOpen(true)}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              background: "#fef3c7",
              color: "#b45309",
              borderColor: "#fcd34d",
              width: isMobile ? "100%" : "auto"
            }}
          >
            Compare YoY History
          </Button>
        </div>
      </Card>

      {/* ─── OPENING BALANCE ─── */}
      <Card
        bordered={false}
        className="glass-card"
        style={{ borderRadius: 16, marginBottom: 16 }}
        bodyStyle={{ padding: isMobile ? "14px 16px" : "20px 24px" }}
      >
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Text style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Opening Balance
              </Text>
              <Tag color="blue" style={{ fontSize: 10, borderRadius: 10, margin: 0, padding: "0 6px" }}>Auto-synced</Tag>
            </div>
            <Text type="secondary" style={{ display: "block", fontSize: 11, marginTop: 2 }}>
              Auto-carried from previous day's closing count
            </Text>
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <WalletOutlined style={{ color: "#3b82f6" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>Cash</Text>
            </div>
            <InputNumber
              value={ledgerData.openingBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, openingBalance: v || 0 })}
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8 }}
              prefix="₹" min={0} precision={0} controls={false}
            />
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <BankOutlined style={{ color: "#7c3aed" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>P/P (Digital)</Text>
            </div>
            <InputNumber
              value={ledgerData.openingBankBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, openingBankBalance: v || 0 })}
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8 }}
              prefix="₹" min={0} precision={0} controls={false}
            />
          </Col>
        </Row>
      </Card>

      {/* ─── DAILY EXPENSES TABLE ─── */}
      <Card
        bordered={false}
        className="glass-card ledger-details-card"
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <Title level={4} style={{ margin: 0, fontSize: isMobile ? "1.1rem" : "1.25rem" }}>Daily Expenses & Income</Title>
              <Text type="secondary" style={{ fontSize: 11 }}>All payments: Staff Meal, Gas, Milk, SIP, Home Loan, Supplier, etc.</Text>
            </div>
            <Button type="primary" onClick={addItem} icon={<PlusOutlined />} style={{ borderRadius: 8 }}>
              Add Entry
            </Button>
          </div>
        }
        style={{ borderRadius: 20, marginBottom: 16 }}
        bodyStyle={{ padding: isMobile ? "12px 14px" : "20px 24px" }}
      >
        {!isMobile ? (
          <div className="responsive-table-container">
            <Table
              dataSource={ledgerData.items}
              columns={columns}
              pagination={false}
              rowKey={(_, index) => index}
              size="middle"
              scroll={{ x: 700 }}
              footer={() => (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, flexWrap: "wrap" }}>
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
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ledgerData.items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
                <Text type="secondary">No expense or income entries yet. Tap "+ Add Entry" above.</Text>
              </div>
            ) : (
              ledgerData.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: item.type === "income" ? "#f0fdf4" : "#ffffff",
                    border: item.type === "income" ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "10px 12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* Top Control Line: Index badge, Type, Mode, Delete */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                      <span style={{
                        background: "#f1f5f9",
                        color: "#475569",
                        fontWeight: 700,
                        fontSize: 11,
                        padding: "2px 6px",
                        borderRadius: 6,
                        minWidth: 26,
                        textAlign: "center"
                      }}>
                        #{index + 1}
                      </span>
                      <Select
                        size="small"
                        value={item.type || "expense"}
                        onChange={(value) => updateItem(index, "type", value)}
                        style={{ width: 95 }}
                      >
                        <Option value="expense">Expense</Option>
                        <Option value="income">Income</Option>
                      </Select>
                      <Select
                        size="small"
                        value={item.paymentMode || "cash"}
                        onChange={(value) => updateItem(index, "paymentMode", value)}
                        style={{ width: 95 }}
                      >
                        <Option value="cash">💵 Cash</Option>
                        <Option value="bank">🏦 Bank</Option>
                      </Select>
                    </div>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                      onClick={() => removeItem(index)}
                      style={{ width: 30, height: 30, borderRadius: 6, background: "#fef2f2" }}
                    />
                  </div>

                  {/* Bottom Line: Description & Amount */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder="e.g. Milk, Gas, Staff..."
                      style={{ flex: 1, borderRadius: 8, fontSize: 13 }}
                    />
                    <InputNumber
                      value={item.amount === 0 ? null : item.amount}
                      onChange={(value) => updateItem(index, "amount", value)}
                      placeholder="0"
                      prefix="₹"
                      controls={false}
                      min={0}
                      precision={0}
                      style={{ width: 115, borderRadius: 8, fontWeight: 700, fontSize: 15 }}
                    />
                  </div>
                </div>
              ))
            )}

            <Button
              type="dashed"
              onClick={addItem}
              icon={<PlusOutlined />}
              block
              style={{
                height: 40,
                borderRadius: 10,
                fontWeight: 600,
                color: "#2563eb",
                borderColor: "#93c5fd",
                background: "#eff6ff",
                marginTop: 4
              }}
            >
              Add Entry
            </Button>

            {/* Mobile Summary Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 10,
              padding: 10,
              background: "#f8fafc",
              borderRadius: 12,
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ background: "#fef2f2", padding: "8px 10px", borderRadius: 8, border: "1px solid #fecaca" }}>
                <div style={{ fontSize: 10, color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>Cash Expenses</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#ef4444", marginTop: 2 }}>₹{fmt(totals.cashExpenses)}</div>
              </div>
              <div style={{ background: "#f5f3ff", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd6fe" }}>
                <div style={{ fontSize: 10, color: "#5b21b6", fontWeight: 700, textTransform: "uppercase" }}>Bank Expenses</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#7c3aed", marginTop: 2 }}>₹{fmt(totals.bankExpenses)}</div>
              </div>
              <div style={{
                gridColumn: "1 / -1",
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                padding: "10px 14px",
                borderRadius: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "#fff"
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#94a3b8" }}>Total Expenses</span>
                <span style={{ fontSize: 17, fontWeight: 900, color: "#f87171" }}>₹{fmt(totals.totalExpenses)}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ─── MAA / HOME ─── */}
      <Card
        bordered={false}
        className="glass-card"
        style={{ borderRadius: 16, marginBottom: 16, borderLeft: "4px solid #8b5cf6" }}
        bodyStyle={{ padding: isMobile ? "14px 16px" : "20px 24px" }}
      >
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <HomeOutlined style={{ fontSize: 20, color: "#8b5cf6" }} />
              <div>
                <Text style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Maa / Home
                </Text>
                <Text type="secondary" style={{ display: "block", fontSize: 11 }}>
                  Cash & digital taken home (auto-synced from Home Expenses)
                </Text>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <WalletOutlined style={{ color: "#8b5cf6" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>Cash to Home</Text>
            </div>
            <InputNumber
              value={ledgerData.cashToHome}
              onChange={(v) => setLedgerData({ ...ledgerData, cashToHome: v || 0 })}
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8, backgroundColor: "#f5f3ff", borderColor: "#c4b5fd" }}
              prefix="₹" min={0} precision={0} controls={false}
            />
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <BankOutlined style={{ color: "#8b5cf6" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>Account to Home</Text>
            </div>
            <InputNumber
              value={ledgerData.digitalToHome}
              onChange={(v) => setLedgerData({ ...ledgerData, digitalToHome: v || 0 })}
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8, backgroundColor: "#f5f3ff", borderColor: "#c4b5fd" }}
              prefix="₹" min={0} precision={0} controls={false}
            />
          </Col>
        </Row>
      </Card>

      {/* ─── CLOSING BALANCE ─── */}
      <Card
        bordered={false}
        className="glass-card"
        style={{ borderRadius: 16, marginBottom: 16, borderLeft: "4px solid #f59e0b" }}
        bodyStyle={{ padding: isMobile ? "14px 16px" : "20px 24px" }}
      >
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={8}>
            <Text style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Closing Balance
            </Text>
            <Text type="secondary" style={{ display: "block", fontSize: 11 }}>Physical cash count (evening)</Text>
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <WalletOutlined style={{ color: "#f59e0b" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>Cash</Text>
            </div>
            <InputNumber
              value={ledgerData.closingBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, closingBalance: v || 0 })}
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8, backgroundColor: "#fffbeb", borderColor: "#fcd34d" }}
              prefix="₹" min={0} precision={0} controls={false}
            />
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <BankOutlined style={{ color: "#f59e0b" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>P/P (Digital)</Text>
            </div>
            <InputNumber
              value={ledgerData.closingBankBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, closingBankBalance: v || 0 })}
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8, backgroundColor: "#fffbeb", borderColor: "#fcd34d" }}
              prefix="₹" min={0} precision={0} controls={false}
            />
          </Col>
        </Row>
      </Card>

      {/* ─── TODAY'S SELL ─── */}
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          background: totals.hasClosing
            ? "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)"
            : "#f1f5f9",
          overflow: "hidden",
          position: "relative",
          marginBottom: 16,
        }}
        bodyStyle={{ padding: isMobile ? "14px 16px" : "20px 24px" }}
      >
        {totals.hasClosing && (
          <>
            <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(59,130,246,0.08)" }} />
            <div style={{ position: "absolute", bottom: -20, left: 40, width: 100, height: 100, borderRadius: "50%", background: "rgba(16,185,129,0.06)" }} />
          </>
        )}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <ShoppingCartOutlined style={{ fontSize: 22, color: totals.hasClosing ? "#60a5fa" : "#94a3b8" }} />
            <Title level={3} style={{ margin: 0, color: totals.hasClosing ? "white" : "#64748b", fontWeight: 800, letterSpacing: 1, fontSize: isMobile ? "1.2rem" : "1.5rem" }}>
              TODAY'S SELL
            </Title>
            {ledgerData.festival && totals.hasClosing && (
              <Tag icon={<GiftOutlined />} color="gold" style={{ marginLeft: "auto", fontWeight: 700, fontSize: 11, borderRadius: 20, margin: 0 }}>
                {ledgerData.festival}
              </Tag>
            )}
          </div>

          {!totals.hasClosing ? (
            <Text style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5, display: "block" }}>
              Enter Closing Balance (evening physical count) to see today's sell.
            </Text>
          ) : (
            <>
              <Row gutter={[12, 12]}>
                <Col xs={12} sm={8}>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: isMobile ? "12px 14px" : "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <WalletOutlined style={{ color: "#10b981" }} />
                      <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Cash Sell</Text>
                    </div>
                    <Title level={isMobile ? 3 : 2} style={{ margin: 0, color: "#10b981", fontWeight: 800, fontSize: isMobile ? "1.3rem" : "1.75rem" }}>
                      ₹{fmt(totals.derivedCashSell)}
                    </Title>
                  </div>
                </Col>
                <Col xs={12} sm={8}>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: isMobile ? "12px 14px" : "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <BankOutlined style={{ color: "#818cf8" }} />
                      <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>P/P Sell</Text>
                    </div>
                    <Title level={isMobile ? 3 : 2} style={{ margin: 0, color: "#818cf8", fontWeight: 800, fontSize: isMobile ? "1.3rem" : "1.75rem" }}>
                      ₹{fmt(totals.derivedDigitalSell)}
                    </Title>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ background: "rgba(16,185,129,0.12)", borderRadius: 12, padding: isMobile ? "14px 16px" : "16px 20px", border: "1px solid rgba(16,185,129,0.25)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <ShoppingCartOutlined style={{ color: "#fbbf24" }} />
                      <Text style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Sell</Text>
                    </div>
                    <Title level={1} style={{ margin: 0, color: "#ffffff", fontWeight: 900, fontSize: isMobile ? 26 : 34 }}>
                      ₹{fmt(totals.derivedTotalSell)}
                    </Title>
                  </div>
                </Col>
              </Row>
              <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, wordBreak: "break-word" }}>
                <Text style={{ color: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}>
                  Sell = Closing ({fmt(ledgerData.closingBalance)}+{fmt(ledgerData.closingBankBalance)}) + Expenses ({fmt(totals.totalExpenses)}) + Home ({fmt(totals.cashHome)}+{fmt(totals.digitalHome)}) − Opening ({fmt(ledgerData.openingBalance)}+{fmt(ledgerData.openingBankBalance)})
                </Text>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* ─── DAILY NOTES & REMARKS ─── */}
      <Card
        bordered={false}
        className="glass-card"
        style={{ borderRadius: 16, marginBottom: 16, borderLeft: "4px solid #0284c7" }}
        bodyStyle={{ padding: isMobile ? "14px 16px" : "20px 24px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <FileTextOutlined style={{ fontSize: 18, color: "#0284c7" }} />
          <div>
            <Text style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Daily Notes & Remarks
            </Text>
            <Text type="secondary" style={{ display: "block", fontSize: 11 }}>
              Record special instructions, weather notes, staff updates, or general daily remarks.
            </Text>
          </div>
        </div>
        <Input.TextArea
          rows={3}
          value={ledgerData.notes}
          onChange={(e) => setLedgerData({ ...ledgerData, notes: e.target.value })}
          placeholder="e.g., Heavy rain in afternoon, extra 50kg samosa prepared for evening rush, staff advance given..."
          style={{ borderRadius: 10, fontSize: 13, padding: "10px 14px" }}
        />
      </Card>

      {/* ─── SWEET PRODUCTION TABLE ─── */}
      <Card
        bordered={false}
        className="glass-card"
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ExperimentOutlined style={{ fontSize: 18, color: "#6366f1" }} />
              <div>
                <Title level={4} style={{ margin: 0, fontSize: isMobile ? "1.1rem" : "1.25rem" }}>Sweet Production Log</Title>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Record how much you made today — helps plan quantities for next year's same festival.
                </Text>
              </div>
            </div>
            <Button
              onClick={addSweetRow}
              icon={<PlusOutlined />}
              style={{
                borderRadius: 8,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff",
                border: "none",
                fontWeight: 600,
              }}
            >
              Add Sweet
            </Button>
          </div>
        }
        style={{ borderRadius: 20, marginBottom: 16, borderLeft: "4px solid #6366f1" }}
        bodyStyle={{ padding: isMobile ? "12px 14px" : "20px 24px" }}
      >
        {ledgerData.sweetProduction.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
            <ExperimentOutlined style={{ fontSize: 30, marginBottom: 8, display: "block" }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              No sweets logged yet. Click "Add Sweet" to record production for{" "}
              {ledgerData.festival ? (
                <Text strong style={{ color: "#f59e0b" }}>{ledgerData.festival}</Text>
              ) : "today"}.
            </Text>
          </div>
        ) : !isMobile ? (
          <Table
            dataSource={ledgerData.sweetProduction}
            columns={sweetColumns}
            pagination={false}
            rowKey={(_, index) => index}
            size="middle"
            scroll={{ x: 750 }}
            footer={() => {
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Text strong style={{ fontSize: 13, color: "#475569", borderBottom: "1px dashed #cbd5e1", paddingBottom: 4 }}>
                    Sweet-wise Production &amp; Demand Breakdown:
                  </Text>
                  {ledgerData.sweetProduction.map((item, idx) => {
                    const name = item.sweetName || `Sweet #${idx + 1}`;
                    const made = Number(item.quantity) || 0;
                    const sold = Number(item.actualSold) || 0;
                    const unit = item.unit || "ghan";
                    let statusTag = null;

                    if (made > sold) {
                      statusTag = (
                        <Text strong style={{ color: "#d97706" }}>
                          📦 Surplus: {made - sold} {unit} (Decrease next year)
                        </Text>
                      );
                    } else if (sold > made) {
                      statusTag = (
                        <Text strong style={{ color: "#dc2626" }}>
                          ⚠️ Shortage: {sold - made} {unit} (Increase next year)
                        </Text>
                      );
                    } else if (made > 0 && sold === made) {
                      statusTag = (
                        <Text strong style={{ color: "#16a34a" }}>
                          ✅ 100% Sold Out
                        </Text>
                      );
                    }

                    return (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: 13 }}>
                        <Text strong style={{ color: "#1e293b", minWidth: 140 }}>{name}:</Text>
                        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                          <Text type="secondary">Made: <strong style={{ color: "#4f46e5" }}>{made} {unit}</strong></Text>
                          <Text type="secondary">Sold: <strong style={{ color: "#059669" }}>{sold} {unit}</strong></Text>
                          {statusTag}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ledgerData.sweetProduction.map((item, i) => {
              const made = Number(item.quantity) || 0;
              const sold = Number(item.actualSold) || 0;
              const unit = item.unit || "ghan";
              let statusTag = null;

              if (made > sold && made > 0) {
                statusTag = (
                  <Tag color="orange" style={{ borderRadius: 6, padding: "2px 8px", fontSize: 11, margin: 0 }}>
                    📦 Surplus: {made - sold} {unit} (Decrease next year)
                  </Tag>
                );
              } else if (sold > made && sold > 0) {
                statusTag = (
                  <Tag color="red" style={{ borderRadius: 6, padding: "2px 8px", fontSize: 11, margin: 0 }}>
                    ⚠️ Shortage: {sold - made} {unit} (Increase next year)
                  </Tag>
                );
              } else if (made > 0 && sold === made) {
                statusTag = (
                  <Tag color="green" style={{ borderRadius: 6, padding: "2px 8px", fontSize: 11, margin: 0 }}>
                    ✅ 100% Sold Out
                  </Tag>
                );
              }

              return (
                <div
                  key={i}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e0e7ff",
                    borderRadius: 12,
                    padding: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                  }}
                >
                  {/* Row 1: Index + Sweet Name + Delete */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{
                      background: "#e0e7ff",
                      color: "#4338ca",
                      fontWeight: 700,
                      fontSize: 11,
                      padding: "2px 6px",
                      borderRadius: 6,
                      minWidth: 26,
                      textAlign: "center"
                    }}>
                      #{i + 1}
                    </span>
                    <AutoComplete
                      options={SWEET_NAMES.map(s => ({ value: s }))}
                      value={item.sweetName}
                      onChange={(v) => updateSweetRow(i, "sweetName", v)}
                      placeholder="e.g. Rasgolla, Gulab Jamun..."
                      filterOption={(inp, opt) => opt.value.toLowerCase().includes(inp.toLowerCase())}
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                      onClick={() => removeSweetRow(i)}
                      style={{ width: 30, height: 30, borderRadius: 6, background: "#fef2f2" }}
                    />
                  </div>

                  {/* Row 2: Qty Made, Unit, Actual Sold */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 85px 1fr", gap: 6, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>Qty Made</div>
                      <InputNumber
                        value={item.quantity === 0 ? null : item.quantity}
                        onChange={(v) => updateSweetRow(i, "quantity", v)}
                        style={{ width: "100%", borderRadius: 6 }}
                        min={0}
                        precision={0}
                        placeholder="0"
                        controls={false}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>Unit</div>
                      <Select
                        value={item.unit || "ghan"}
                        onChange={(v) => updateSweetRow(i, "unit", v)}
                        style={{ width: "100%" }}
                      >
                        <Option value="ghan">Ghan</Option>
                        <Option value="kg">Kg</Option>
                        <Option value="pcs">Pcs</Option>
                        <Option value="litre">Litre</Option>
                      </Select>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>Actual Sold</div>
                      <InputNumber
                        value={item.actualSold === 0 ? null : item.actualSold}
                        onChange={(v) => updateSweetRow(i, "actualSold", v)}
                        style={{ width: "100%", borderRadius: 6 }}
                        min={0}
                        precision={0}
                        placeholder="0"
                        controls={false}
                      />
                    </div>
                  </div>

                  {/* Row 3: Status / Suggestion Tag */}
                  {statusTag && (
                    <div style={{ marginBottom: 8 }}>{statusTag}</div>
                  )}

                  {/* Row 4: Notes */}
                  <Input
                    value={item.notes}
                    onChange={(e) => updateSweetRow(i, "notes", e.target.value)}
                    placeholder="e.g. Special order notes or remarks..."
                    style={{ borderRadius: 6, fontSize: 12 }}
                  />
                </div>
              );
            })}

            <Button
              type="dashed"
              onClick={addSweetRow}
              icon={<PlusOutlined />}
              block
              style={{
                height: 40,
                borderRadius: 10,
                fontWeight: 600,
                color: "#6366f1",
                borderColor: "#c7d2fe",
                background: "#eef2ff",
                marginTop: 4
              }}
            >
              Add Sweet
            </Button>

            {/* Mobile Sweet Summary Breakdown */}
            <div style={{
              marginTop: 10,
              padding: 10,
              background: "#f8fafc",
              borderRadius: 12,
              border: "1px solid #e2e8f0"
            }}>
              <Text strong style={{ fontSize: 12, color: "#475569", display: "block", marginBottom: 8, borderBottom: "1px dashed #cbd5e1", paddingBottom: 4 }}>
                Demand &amp; Production Summary:
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ledgerData.sweetProduction.map((item, idx) => {
                  const name = item.sweetName || `Sweet #${idx + 1}`;
                  const made = Number(item.quantity) || 0;
                  const sold = Number(item.actualSold) || 0;
                  const unit = item.unit || "ghan";
                  let tag = null;
                  if (made > sold && made > 0) tag = <Text strong style={{ color: "#d97706", fontSize: 11 }}>Surplus: {made - sold} {unit}</Text>;
                  else if (sold > made && sold > 0) tag = <Text strong style={{ color: "#dc2626", fontSize: 11 }}>Shortage: {sold - made} {unit}</Text>;
                  else if (made > 0 && sold === made) tag = <Text strong style={{ color: "#16a34a", fontSize: 11 }}>100% Sold</Text>;

                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                      <Text strong style={{ color: "#1e293b" }}>{name}</Text>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: "#64748b" }}>{made} / {sold} {unit}</span>
                        {tag}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ─── FESTIVAL ANALYTICS MODAL ─── */}
      <FestivalAnalyticsModal
        open={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
        defaultFestival={ledgerData.festival || "Rakhi Purnima"}
      />
    </div>
  );
};

export default DailyLedgerPage;
