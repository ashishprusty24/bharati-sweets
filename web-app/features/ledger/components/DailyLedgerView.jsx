"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card, Row, Col, DatePicker, Table, Button, InputNumber, AutoComplete, Select,
  message, Typography, Space, Divider, Tag, Input, Tooltip, Modal, Form
} from "antd";
import {
  SaveOutlined, PlusOutlined, DeleteOutlined, WalletOutlined,
  BankOutlined, HomeOutlined, ShoppingCartOutlined, StarOutlined,
  GiftOutlined, ExperimentOutlined, TrophyOutlined, FileTextOutlined,
  FundOutlined, SettingOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import FestivalAnalyticsModal from "./FestivalAnalyticsModal";

const { Title, Text } = Typography;
const { Option } = Select;

const COMMON_PREDICTIONS = [
  "Vegetables and Bread",
  "Maheswar (Chenna Supplier)",
  "Milk Purchase",
  "Kaju & Dry Fruits",
  "Bharat Gas Cylinder",
  "Staff Meal & Tea",
  "Packaging Boxes & Bags",
  "Electrical & Maintenance",
  "Home Loan EMI",
  "SIP Investment",
  "Transport & Auto Fare",
];

const FESTIVALS = [
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

const SWEET_NAMES = [
  "Rasgolla",
  "Gulab Jamun",
  "Chhena Poda",
  "Kheer Mohan",
  "Sandesh",
  "Ladoo",
  "Barfi",
  "Kaju Katli",
  "Halwa",
  "Jalebi",
  "Imarti",
  "Rasmalai",
  "Pantua",
  "Ledikeni",
  "Chhena Gaja",
];

export default function DailyLedgerView() {
  const [date, setDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [homeIntakePeriod, setHomeIntakePeriod] = useState("month");
  const [homeIntakeSummary, setHomeIntakeSummary] = useState(null);
  const [allTimeHomeIntakeSummary, setAllTimeHomeIntakeSummary] = useState(null);
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
    investments: [],
    items: [],
  });

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/vendors");
      const data = await res.json();
      setVendors(data || []);
    } catch (e) {
      console.error(e);
    }
  };

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
      const res = await fetch(`/api/ledger/${targetDate.format("YYYY-MM-DD")}`);
      const data = await res.json();
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
        investments: data.investments || [],
        items: (data.items || []).filter((item) => !isCCItem(item)),
      });

      if (data.homeIntakeSummary) setHomeIntakeSummary(data.homeIntakeSummary);
      if (data.allTimeHomeIntakeSummary) setAllTimeHomeIntakeSummary(data.allTimeHomeIntakeSummary);

      try {
        const startOfMonth = targetDate.startOf("month").format("YYYY-MM-DD");
        const endOfMonth = targetDate.endOf("month").format("YYYY-MM-DD");
        const [monthRes, allRes] = await Promise.all([
          fetch(`/api/expenses/summary?startDate=${startOfMonth}&endDate=${endOfMonth}`).then((r) => r.json()),
          fetch(`/api/expenses/summary?allTime=true`).then((r) => r.json()),
        ]);
        if (monthRes?.homeIntakeSummary) setHomeIntakeSummary(monthRes.homeIntakeSummary);
        if (allRes?.homeIntakeSummary) setAllTimeHomeIntakeSummary(allRes.homeIntakeSummary);
      } catch (sumErr) {
        // Fallback to ledger endpoint summary
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to fetch ledger data");
    } finally {
      setLoading(false);
    }
  };

  const [openingBalanceModalOpen, setOpeningBalanceModalOpen] = useState(false);
  const [openingBalanceForm] = Form.useForm();
  const [savingOpeningBalance, setSavingOpeningBalance] = useState(false);

  const handleOpenOpeningBalanceModal = async () => {
    try {
      const res = await fetch("/api/expenses/opening-balance").then((r) => r.json());
      if (res) {
        openingBalanceForm.setFieldsValue({
          cashOpeningBalance: res.cashOpeningBalance || 0,
          bankOpeningBalance: res.bankOpeningBalance || 0,
          effectiveDate: res.effectiveDate ? dayjs(res.effectiveDate) : dayjs("2026-10-01"),
          notes: res.notes || "",
        });
      }
    } catch (e) {
      const currentOp = activeHomeIntakeSummary?.openingBalance;
      openingBalanceForm.setFieldsValue({
        cashOpeningBalance: currentOp?.cash || 0,
        bankOpeningBalance: currentOp?.bank || 0,
        effectiveDate: currentOp?.effectiveDate ? dayjs(currentOp.effectiveDate) : dayjs("2026-10-01"),
        notes: currentOp?.notes || "",
      });
    }
    setOpeningBalanceModalOpen(true);
  };

  const handleSaveOpeningBalance = async () => {
    try {
      const values = await openingBalanceForm.validateFields();
      setSavingOpeningBalance(true);
      const payload = {
        cashOpeningBalance: values.cashOpeningBalance || 0,
        bankOpeningBalance: values.bankOpeningBalance || 0,
        effectiveDate: values.effectiveDate ? values.effectiveDate.format("YYYY-MM-DD") : "2026-10-01",
        notes: values.notes || "",
      };
      await fetch("/api/expenses/opening-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      message.success("Home Intake Opening Balance updated successfully!");
      setOpeningBalanceModalOpen(false);
      fetchLedger(date);
    } catch (err) {
      console.error("Error saving opening balance:", err);
      message.error(err.message || "Failed to save opening balance");
    } finally {
      setSavingOpeningBalance(false);
    }
  };

  const activeHomeIntakeSummary = homeIntakePeriod === "all_time"
    ? (allTimeHomeIntakeSummary || homeIntakeSummary)
    : (homeIntakeSummary || allTimeHomeIntakeSummary);

  useEffect(() => {
    fetchLedger(date);
    fetchVendors();
  }, [date]);

  const predictionOptions = useMemo(() => {
    const vendorNames = (vendors || []).map(v => `${v.name}${v.category ? ` (${v.category})` : ''}`);
    const uniqueList = Array.from(new Set([...COMMON_PREDICTIONS, ...vendorNames]));
    return uniqueList.map(item => ({ value: item }));
  }, [vendors]);

  const festivalOptions = FESTIVALS.map(f => ({ value: f }));
  const sweetOptions = SWEET_NAMES.map(s => ({ value: s }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...ledgerData,
        items: (ledgerData.items || []).filter((item) => !isCCItem(item)),
        investments: ledgerData.investments || [],
      };
      await fetch(`/api/ledger/${date.format("YYYY-MM-DD")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      message.success("Ledger & Vendor accounts synced successfully!");
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

  // ── Investments ───────────────────────────────────────────────────
  const addInvestmentRow = () => {
    setLedgerData({
      ...ledgerData,
      investments: [
        ...(ledgerData.investments || []),
        { name: "", amount: null, type: "SIP", notes: "" },
      ],
    });
  };

  const removeInvestmentRow = (index) => {
    const arr = [...(ledgerData.investments || [])];
    arr.splice(index, 1);
    setLedgerData({ ...ledgerData, investments: arr });
  };

  const updateInvestmentRow = (index, field, value) => {
    const arr = [...(ledgerData.investments || [])];
    arr[index][field] = value;
    setLedgerData({ ...ledgerData, investments: arr });
  };

  // ── Totals ────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const items = ledgerData.items || [];

    const cashExpenses = items
      .filter((i) => (i.type === "expense" || !i.type) && i.paymentMode !== "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const bankExpenses = items
      .filter((i) => (i.type === "expense" || !i.type) && i.paymentMode === "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const cashInvestments = items
      .filter((i) => i.type === "investment" && i.paymentMode !== "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const bankInvestments = items
      .filter((i) => i.type === "investment" && i.paymentMode === "bank")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const totalExpenses = cashExpenses + bankExpenses;
    const totalInvestments = cashInvestments + bankInvestments;
    const totalOutflows = totalExpenses + totalInvestments;

    const opening = Number(ledgerData.openingBalance || 0);
    const openingBank = Number(ledgerData.openingBankBalance || 0);
    const closing = Number(ledgerData.closingBalance || 0);
    const closingBank = Number(ledgerData.closingBankBalance || 0);
    const cashHome = Number(ledgerData.cashToHome || 0);
    const digitalHome = Number(ledgerData.digitalToHome || 0);
    const otherInc = Number(ledgerData.otherIncome || 0);

    const cashOutflows = cashExpenses + cashInvestments;
    const bankOutflows = bankExpenses + bankInvestments;

    const derivedCashSell = closing + cashOutflows + cashHome - opening - otherInc;
    const derivedDigitalSell = closingBank + bankOutflows + digitalHome - openingBank;
    const derivedTotalSell = derivedCashSell + derivedDigitalSell;

    const hasClosing = closing > 0 || closingBank > 0;

    return {
      cashExpenses,
      bankExpenses,
      totalExpenses,
      cashInvestments,
      bankInvestments,
      totalInvestments,
      totalOutflows,
      derivedCashSell,
      derivedDigitalSell,
      derivedTotalSell,
      cashHome,
      digitalHome,
      hasClosing,
    };
  }, [ledgerData]);

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

  // ── Columns ───────────────────────────────────────────────────────
  const columns = [
    {
      title: "#",
      width: 45,
      render: (_, __, index) => (
        <Text type="secondary" style={{ fontWeight: 600 }}>{index + 1}</Text>
      ),
    },
    {
      title: "Description (Auto-Prediction)",
      dataIndex: "description",
      render: (text, _, index) => (
        <AutoComplete
          options={predictionOptions}
          value={text}
          onChange={(val) => updateItem(index, "description", val)}
          placeholder="Type description (e.g. Veg -> Vegetables & Bread, Mah -> Maheswar)..."
          filterOption={(inputValue, option) =>
            option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
          }
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      width: 130,
      render: (type, _, index) => (
        <Select
          value={type || "expense"}
          onChange={(value) => updateItem(index, "type", value)}
          style={{ width: "100%" }}
        >
          <Option value="expense">💸 Expense</Option>
          <Option value="investment">💰 Investment</Option>
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

  const sweetColumns = [
    {
      title: "#",
      width: 40,
      render: (_, __, i) => <Text type="secondary" style={{ fontWeight: 600 }}>{i + 1}</Text>,
    },
    {
      title: "Sweet Name",
      dataIndex: "sweetName",
      render: (val, _, i) => (
        <AutoComplete
          options={sweetOptions}
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
    <div style={{ padding: "0 8px" }}>
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
            Smart predictions enabled. Auto-syncs vendor payments upon saving.
          </Text>
        </div>
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
            Save & Sync Vendors
          </Button>
        </div>
      </div>

      {/* ── FESTIVAL TAG CARD ── */}
      <Card
        variant="borderless"
        style={{
          borderRadius: 16, marginBottom: 20,
          borderLeft: "4px solid #f59e0b",
          background: ledgerData.festival ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)" : undefined,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <GiftOutlined style={{ fontSize: 20, color: "#f59e0b" }} />
          <div>
            <Text style={{ fontSize: 13, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Festival / Occasion Tag
            </Text>
            <Text type="secondary" style={{ display: "block", fontSize: 11 }}>
              Tag this day for year-over-year comparison (e.g. "Rakhi Purnima 2026")
            </Text>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <Button
              size="small"
              icon={<TrophyOutlined />}
              onClick={() => setAnalyticsModalOpen(true)}
              style={{ borderRadius: 6, fontWeight: 600, background: "#fef3c7", color: "#b45309", borderColor: "#fcd34d" }}
            >
              Compare YoY History
            </Button>
            {ledgerData.festival && (
              <Tag
                color="gold"
                icon={<StarOutlined />}
                style={{ fontWeight: 700, fontSize: 13, padding: "4px 12px", borderRadius: 20 }}
              >
                {ledgerData.festival}
              </Tag>
            )}
          </div>
        </div>
        <AutoComplete
          options={festivalOptions}
          value={ledgerData.festival}
          onChange={(v) => setLedgerData({ ...ledgerData, festival: v })}
          placeholder="Select or type festival name... (e.g. Rakhi Purnima, Diwali)"
          filterOption={(inp, opt) => opt.value.toLowerCase().includes(inp.toLowerCase())}
          style={{ width: "100%", maxWidth: 400 }}
          allowClear
        />
      </Card>

      {/* ── OPENING BALANCE ── */}
      <Card variant="borderless" style={{ borderRadius: 16, marginBottom: 20 }}>
        <Row gutter={[20, 16]} align="middle">
          <Col xs={24} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Text style={{ fontSize: 13, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Opening Balance
              </Text>
              <Tag color="blue" style={{ fontSize: 10, borderRadius: 10, margin: 0, padding: "0 6px" }}>Auto-synced</Tag>
            </div>
            <Text type="secondary" style={{ display: "block", fontSize: 11, marginTop: 2 }}>
              Auto-carried from previous day's closing count
            </Text>
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <WalletOutlined style={{ color: "#3b82f6" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>Cash</Text>
            </div>
            <InputNumber
              value={ledgerData.openingBalance === 0 ? null : ledgerData.openingBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, openingBalance: v ?? 0 })}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8 }}
              prefix="₹"
              min={0}
              precision={0}
            />
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <BankOutlined style={{ color: "#7c3aed" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>P/P (Digital)</Text>
            </div>
            <InputNumber
              value={ledgerData.openingBankBalance === 0 ? null : ledgerData.openingBankBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, openingBankBalance: v ?? 0 })}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8 }}
              prefix="₹"
              min={0}
              precision={0}
            />
          </Col>
        </Row>
      </Card>

      {/* ── DAILY EXPENSES & INVESTMENTS TABLE ── */}
      <Card
        variant="borderless"
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>Daily Expenses & Investments</Title>
              <Text type="secondary" style={{ fontSize: 11 }}>Type vendor name or items to trigger smart predictions. Select Investment to auto-track in investments ledger.</Text>
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
        <Table
          dataSource={ledgerData.items}
          columns={columns}
          pagination={false}
          rowKey={(_, index) => index}
          size="middle"
          footer={() => (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, flexWrap: "wrap" }}>
              <Text type="secondary" style={{ fontWeight: 600 }}>
                Expenses: <Text strong style={{ color: "#ef4444" }}>₹{fmt(totals.totalExpenses)}</Text>
              </Text>
              {totals.totalInvestments > 0 && (
                <Text type="secondary" style={{ fontWeight: 600 }}>
                  Investments: <Text strong style={{ color: "#0d9488" }}>₹{fmt(totals.totalInvestments)}</Text>
                </Text>
              )}
              <Text style={{ fontWeight: 700, fontSize: 15 }}>
                Total Outflow: <Text strong style={{ color: "#ef4444", fontSize: 16 }}>₹{fmt(totals.totalOutflows)}</Text>
              </Text>
            </div>
          )}
        />
      </Card>

      {/* ── MAA / HOME & HOME INTAKE BALANCE ── */}
      <Card
        variant="borderless"
        style={{
          borderRadius: 16,
          marginBottom: 20,
          borderLeft: "4px solid #8b5cf6",
          background: "#ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <Row gutter={[20, 16]} align="stretch">
          {/* Left Column: Today's Home Intake Transfer */}
          <Col xs={24} lg={13} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f3e8ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    <HomeOutlined />
                  </div>
                  <div>
                    <Text style={{ fontSize: 13, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Maa / Home Intake
                    </Text>
                    <Text type="secondary" style={{ display: "block", fontSize: 11 }}>
                      Cash & digital taken home today (auto-synced from Home Expenses)
                    </Text>
                  </div>
                </div>
                {((Number(ledgerData.cashToHome) || 0) + (Number(ledgerData.digitalToHome) || 0)) > 0 && (
                  <Tag color="purple" style={{ borderRadius: 10, fontWeight: 700, fontSize: 12, padding: "2px 10px", margin: 0 }}>
                    Today: ₹{fmt((Number(ledgerData.cashToHome) || 0) + (Number(ledgerData.digitalToHome) || 0))}
                  </Tag>
                )}
              </div>

              <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
                <Col xs={12}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <WalletOutlined style={{ color: "#8b5cf6" }} />
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>Cash to Home</Text>
                  </div>
                  <InputNumber
                    value={ledgerData.cashToHome === 0 ? null : ledgerData.cashToHome}
                    onChange={(v) => setLedgerData({ ...ledgerData, cashToHome: v ?? 0 })}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8, backgroundColor: "#f5f3ff", borderColor: "#c4b5fd" }}
                    prefix="₹"
                    min={0}
                    precision={0}
                  />
                </Col>
                <Col xs={12}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <BankOutlined style={{ color: "#8b5cf6" }} />
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>Account to Home</Text>
                  </div>
                  <InputNumber
                    value={ledgerData.digitalToHome === 0 ? null : ledgerData.digitalToHome}
                    onChange={(v) => setLedgerData({ ...ledgerData, digitalToHome: v ?? 0 })}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8, backgroundColor: "#f5f3ff", borderColor: "#c4b5fd" }}
                    prefix="₹"
                    min={0}
                    precision={0}
                  />
                </Col>
              </Row>
            </div>

            <div style={{ marginTop: 12, padding: "8px 12px", background: "#faf5ff", borderRadius: 8, border: "1px dashed #e9d5ff" }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                💡 Any amount entered here auto-updates the Home Intake ledger upon saving.
              </Text>
            </div>
          </Col>

          {/* Right Column: HOME INTAKE BALANCE CARD (Exact match to Expense page) */}
          <Col xs={24} lg={11}>
            <Card
              bordered={false}
              style={{
                borderRadius: 14,
                background: "linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)",
                boxShadow: "0 2px 10px rgba(236, 72, 153, 0.08)",
                border: "1px solid #fce7f3",
                height: "100%",
              }}
              bodyStyle={{ padding: "14px 16px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fce7f3", color: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    <HomeOutlined />
                  </div>
                  <div>
                    <Text style={{ color: "#ec4899", fontWeight: 700, fontSize: 11, letterSpacing: "0.4px" }}>
                      HOME INTAKE BALANCE
                    </Text>
                    <Text type="secondary" style={{ display: "block", fontSize: 10 }}>
                      {homeIntakePeriod === "all_time" ? "All-Time Overall" : `Period: ${date.format("MMMM YYYY")}`}
                    </Text>
                  </div>
                </div>

                {/* Period Selector & Settings Button */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ background: "#fdf2f8", padding: 2, borderRadius: 12, border: "1px solid #fbcfe8", display: "flex", gap: 2 }}>
                    <Button
                      size="small"
                      type={homeIntakePeriod === "month" ? "primary" : "text"}
                      onClick={() => setHomeIntakePeriod("month")}
                      style={{
                        height: 24,
                        padding: "0 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 10,
                        background: homeIntakePeriod === "month" ? "#ec4899" : "transparent",
                        borderColor: homeIntakePeriod === "month" ? "#ec4899" : "transparent",
                      }}
                    >
                      {date.format("MMM")}
                    </Button>
                    <Button
                      size="small"
                      type={homeIntakePeriod === "all_time" ? "primary" : "text"}
                      onClick={() => setHomeIntakePeriod("all_time")}
                      style={{
                        height: 24,
                        padding: "0 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 10,
                        background: homeIntakePeriod === "all_time" ? "#ec4899" : "transparent",
                        borderColor: homeIntakePeriod === "all_time" ? "#ec4899" : "transparent",
                      }}
                    >
                      All Time
                    </Button>
                  </div>

                  <Tooltip title="Set / Reconcile Home Intake Opening Balance">
                    <Button
                      size="small"
                      icon={<SettingOutlined />}
                      onClick={handleOpenOpeningBalanceModal}
                      style={{
                        height: 26,
                        width: 26,
                        padding: 0,
                        borderRadius: 8,
                        background: "#fce7f3",
                        color: "#ec4899",
                        borderColor: "#fbcfe8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                  </Tooltip>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <Title
                    level={3}
                    style={{
                      margin: 0,
                      fontWeight: 800,
                      fontSize: 24,
                      color: (activeHomeIntakeSummary?.remaining?.total || 0) >= 0 ? "#0f172a" : "#e11d48",
                    }}
                  >
                    ₹{fmt(activeHomeIntakeSummary?.remaining?.total || 0)}
                  </Title>
                  <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: 500 }}>Remaining Balance</Text>
                </div>
                {activeHomeIntakeSummary?.openingBalance?.total > 0 && (
                  <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Tag color="magenta" style={{ fontSize: 10, borderRadius: 8, padding: "1px 6px", margin: 0, fontWeight: 600 }}>
                      Base from {dayjs(activeHomeIntakeSummary.openingBalance.effectiveDate).format("DD MMM")}: 💵 ₹{fmt(activeHomeIntakeSummary.openingBalance.cash)} | 🏦 ₹{fmt(activeHomeIntakeSummary.openingBalance.bank)}
                    </Tag>
                  </div>
                )}
              </div>

              <div style={{ borderTop: "1px dashed #fbcfe8", marginTop: 10, paddingTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>
                    📥 Received: ₹{fmt(activeHomeIntakeSummary?.totalReceived || 0)}
                  </span>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>
                    📤 Spent: ₹{fmt(activeHomeIntakeSummary?.totalSpent || 0)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: (activeHomeIntakeSummary?.remaining?.cash || 0) >= 0 ? "#10b981" : "#e11d48", fontWeight: 600 }}>
                    💵 Cash: ₹{fmt(activeHomeIntakeSummary?.remaining?.cash || 0)}
                  </span>
                  <span style={{ color: (activeHomeIntakeSummary?.remaining?.bank || 0) >= 0 ? "#3b82f6" : "#e11d48", fontWeight: 600 }}>
                    🏦 Bank: ₹{fmt(activeHomeIntakeSummary?.remaining?.bank || 0)}
                  </span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* ── CLOSING BALANCE ── */}
      <Card
        variant="borderless"
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
              value={ledgerData.closingBalance === 0 ? null : ledgerData.closingBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, closingBalance: v ?? 0 })}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8, backgroundColor: "#fffbeb", borderColor: "#fcd34d" }}
              prefix="₹"
              min={0}
              precision={0}
            />
          </Col>
          <Col xs={12} sm={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <BankOutlined style={{ color: "#f59e0b" }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>P/P (Digital)</Text>
            </div>
            <InputNumber
              value={ledgerData.closingBankBalance === 0 ? null : ledgerData.closingBankBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, closingBankBalance: v ?? 0 })}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8, backgroundColor: "#fffbeb", borderColor: "#fcd34d" }}
              prefix="₹"
              min={0}
              precision={0}
            />
          </Col>
        </Row>
      </Card>

      {/* ── TODAY'S SELL ── */}
      <Card
        variant="borderless"
        style={{
          borderRadius: 20,
          background: totals.hasClosing
            ? "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)"
            : "#f1f5f9",
          overflow: "hidden",
          position: "relative",
          marginBottom: 20,
        }}
      >
        <div style={{ position: "relative", zIndex: 1, padding: "8px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <ShoppingCartOutlined style={{ fontSize: 24, color: totals.hasClosing ? "#60a5fa" : "#94a3b8" }} />
            <Title level={3} style={{ margin: 0, color: totals.hasClosing ? "white" : "#64748b", fontWeight: 800, letterSpacing: 1 }}>
              TODAY'S SELL
            </Title>
            {ledgerData.festival && totals.hasClosing && (
              <Tag
                icon={<GiftOutlined />}
                color="gold"
                style={{ marginLeft: 8, fontWeight: 700, fontSize: 12, borderRadius: 20 }}
              >
                {ledgerData.festival}
              </Tag>
            )}
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

              <div style={{ marginTop: 16, padding: "10px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                <Text style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>
                  Sell = Closing ({fmt(ledgerData.closingBalance)}+{fmt(ledgerData.closingBankBalance)}) + Outflows ({fmt(totals.totalOutflows)}) + Home ({fmt(totals.cashHome)}+{fmt(totals.digitalHome)}) − Opening ({fmt(ledgerData.openingBalance)}+{fmt(ledgerData.openingBankBalance)})
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
        style={{ borderRadius: 16, marginBottom: 20, borderLeft: "4px solid #0284c7" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <FileTextOutlined style={{ fontSize: 18, color: "#0284c7" }} />
          <div>
            <Text style={{ fontSize: 13, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5 }}>
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

      {/* ── INVESTMENT TRACKING ── */}
      <Card
        variant="borderless"
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FundOutlined style={{ fontSize: 18, color: "#0d9488" }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>Investment Tracking</Title>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Track SIP, FD, and other investments — manual entry for how much invested.
                </Text>
              </div>
            </div>
            <Button
              onClick={addInvestmentRow}
              icon={<PlusOutlined />}
              style={{
                borderRadius: 8,
                background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                color: "#fff",
                border: "none",
                fontWeight: 600,
              }}
            >
              Add Investment
            </Button>
          </div>
        }
        style={{
          borderRadius: 20,
          marginBottom: 20,
          borderLeft: "4px solid #0d9488",
        }}
      >
        {(ledgerData.investments || []).length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8" }}>
            <FundOutlined style={{ fontSize: 32, marginBottom: 8, display: "block" }} />
            <Text type="secondary">
              No investments logged today. Click "Add Investment" to record SIP, FD, or other investments.
            </Text>
          </div>
        ) : (
          <Table
            dataSource={ledgerData.investments || []}
            columns={[
              {
                title: "#",
                width: 40,
                render: (_, __, i) => <Text type="secondary" style={{ fontWeight: 600 }}>{i + 1}</Text>,
              },
              {
                title: "Investment Name",
                dataIndex: "name",
                render: (val, _, i) => (
                  <AutoComplete
                    options={[
                      { value: "SIP Investment" },
                      { value: "FD Investment" },
                      { value: "Mutual Fund" },
                      { value: "Gold Savings" },
                      { value: "PPF" },
                      { value: "LIC Premium" },
                    ]}
                    value={val}
                    onChange={(v) => updateInvestmentRow(i, "name", v)}
                    placeholder="e.g. SIP Investment, FD..."
                    filterOption={(inp, opt) => opt.value.toLowerCase().includes(inp.toLowerCase())}
                    style={{ width: "100%" }}
                  />
                ),
              },
              {
                title: "Type",
                dataIndex: "type",
                width: 120,
                render: (val, _, i) => (
                  <Select
                    value={val || "SIP"}
                    onChange={(v) => updateInvestmentRow(i, "type", v)}
                    style={{ width: "100%" }}
                  >
                    <Option value="SIP">💰 SIP</Option>
                    <Option value="FD">🏦 FD</Option>
                    <Option value="Other">📋 Other</Option>
                  </Select>
                ),
              },
              {
                title: "Amount (₹)",
                dataIndex: "amount",
                width: 150,
                render: (val, _, i) => (
                  <InputNumber
                    value={val === 0 ? null : val}
                    onChange={(v) => updateInvestmentRow(i, "amount", v)}
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
                title: "Notes",
                dataIndex: "notes",
                render: (val, _, i) => (
                  <Input
                    value={val}
                    onChange={(e) => updateInvestmentRow(i, "notes", e.target.value)}
                    placeholder="e.g. Monthly SIP for Sep..."
                  />
                ),
              },
              {
                title: "",
                width: 45,
                render: (_, __, i) => (
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeInvestmentRow(i)} />
                ),
              },
            ]}
            pagination={false}
            rowKey={(_, index) => index}
            size="middle"
            footer={() => {
              const totalInvestment = (ledgerData.investments || []).reduce(
                (sum, inv) => sum + (Number(inv.amount) || 0), 0
              );
              return (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Text style={{ fontWeight: 700, fontSize: 15 }}>
                    Total Investment: <Text strong style={{ color: "#0d9488", fontSize: 16 }}>₹{fmt(totalInvestment)}</Text>
                  </Text>
                </div>
              );
            }}
          />
        )}
      </Card>

      {/* ── SWEET PRODUCTION TABLE ── */}
      <Card
        variant="borderless"
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ExperimentOutlined style={{ fontSize: 18, color: "#6366f1" }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>Sweet Production Log</Title>
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
        style={{
          borderRadius: 20,
          marginBottom: 20,
          borderLeft: "4px solid #6366f1",
        }}
      >
        {ledgerData.sweetProduction.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8" }}>
            <ExperimentOutlined style={{ fontSize: 32, marginBottom: 8, display: "block" }} />
            <Text type="secondary">
              No sweets logged yet. Click "Add Sweet" to record production for{" "}
              {ledgerData.festival ? (
                <Text strong style={{ color: "#f59e0b" }}>{ledgerData.festival}</Text>
              ) : "today"}.
            </Text>
          </div>
        ) : (
          <Table
            dataSource={ledgerData.sweetProduction}
            columns={sweetColumns}
            pagination={false}
            rowKey={(_, index) => index}
            size="middle"
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
        )}
      </Card>

      {/* ── FESTIVAL ANALYTICS MODAL ── */}
      <FestivalAnalyticsModal
        open={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
        defaultFestival={ledgerData.festival || "Rakhi Purnima"}
      />

      {/* ── HOME INTAKE OPENING BALANCE MODAL ── */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fce7f3", color: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              <HomeOutlined />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Home Intake Opening Balance</span>
              <span style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 400 }}>
                Reconcile & start tracking fresh from a cutoff date
              </span>
            </div>
          </div>
        }
        open={openingBalanceModalOpen}
        onCancel={() => setOpeningBalanceModalOpen(false)}
        onOk={handleSaveOpeningBalance}
        confirmLoading={savingOpeningBalance}
        okText="Save & Reconcile"
        cancelText="Cancel"
        destroyOnClose
        centered
        width={480}
      >
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", margin: "16px 0" }}>
          <Text style={{ fontSize: 12, color: "#166534" }}>
            💡 <b>Cutoff Balance Reconciliation</b>: Setting an Opening Balance as of <b>01 Oct 2026</b> sets the true baseline cash & bank at home, eliminating historical deficits while keeping past months untouched.
          </Text>
        </div>

        <Form
          form={openingBalanceForm}
          layout="vertical"
          initialValues={{
            cashOpeningBalance: 0,
            bankOpeningBalance: 0,
            effectiveDate: dayjs("2026-10-01"),
            notes: "Home Intake Opening Balance as of 01 Oct 2026",
          }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="effectiveDate"
                label={<span style={{ fontWeight: 600, fontSize: 13 }}>Effective Cutoff Date</span>}
                rules={[{ required: true, message: "Please select effective date" }]}
              >
                <DatePicker format="DD MMM YYYY" style={{ width: "100%", height: 40, borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="cashOpeningBalance"
                label={<span style={{ fontWeight: 600, fontSize: 13 }}>💵 Home Cash Base (₹)</span>}
                rules={[{ required: true, message: "Please enter cash opening balance" }]}
              >
                <InputNumber
                  style={{ width: "100%", height: 40, borderRadius: 8, fontSize: 15, fontWeight: 700 }}
                  prefix="₹"
                  placeholder="0"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="bankOpeningBalance"
                label={<span style={{ fontWeight: 600, fontSize: 13 }}>🏦 Home Bank Base (₹)</span>}
                rules={[{ required: true, message: "Please enter bank opening balance" }]}
              >
                <InputNumber
                  style={{ width: "100%", height: 40, borderRadius: 8, fontSize: 15, fontWeight: 700 }}
                  prefix="₹"
                  placeholder="0"
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="notes"
                label={<span style={{ fontWeight: 600, fontSize: 13 }}>Notes / Description (Optional)</span>}
              >
                <Input.TextArea
                  rows={2}
                  placeholder="e.g. Physical cash count & bank balance reconciled starting Oct 1st"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
