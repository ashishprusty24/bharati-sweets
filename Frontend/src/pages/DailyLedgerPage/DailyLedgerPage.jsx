import React, { useState, useEffect, useMemo } from "react";
import {
  Card, Row, Col, DatePicker, Table, Button, InputNumber, Input, Select,
  message, Typography, Space, Tag, Tooltip, AutoComplete, Grid, Modal, Form
} from "antd";
import {
  SaveOutlined, PlusOutlined, DeleteOutlined, WalletOutlined,
  BankOutlined, HomeOutlined, ShoppingCartOutlined,
  GiftOutlined, StarOutlined, ExperimentOutlined, TrophyOutlined, FileTextOutlined,
  FundOutlined, ContactsOutlined, UserOutlined, SettingOutlined
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

const LEDGER_CATEGORIES = {
  raw_materials: { label: "Raw Materials", emoji: "🥛" },
  staff_payment: { label: "Staff Payment", emoji: "👨‍🍳" },
  gas_utilities: { label: "Gas & Utilities", emoji: "🔥" },
  transport: { label: "Transport & Fuel", emoji: "🚗" },
  emi_loan: { label: "EMI / Loan", emoji: "💰" },
  supplier_payment: { label: "Supplier Payment", emoji: "📦" },
  repairs: { label: "Repairs", emoji: "🔧" },
  home_personal: { label: "Home & Personal", emoji: "🏠" },
  shop_workshop: { label: "Shop & Workshop", emoji: "🏪" },
  credit_card_bill: { label: "CC Bill", emoji: "💳" },
  other: { label: "Other", emoji: "📋" },
};

// Auto-suggest category based on description keywords
const suggestCategory = (desc) => {
  if (!desc) return "other";
  const d = desc.toLowerCase().trim();
  if (/milk|paneer|poda|almond|honey|gond|khajoor|tentuli|cherry|dana|egg|vegetables|bread|alu|sugar|flour|ghee|oil|khua|sweet/i.test(d)) return "raw_materials";
  if (/wage|salary|bonus/i.test(d)) return "staff_payment";
  if (/bharat gas|hp tank|gas cylinder|lpg/i.test(d)) return "gas_utilities";
  if (/petrol|diesel|ferro|jupiter|auto|transport|pickup|tata|freight|delivery|vehicle/i.test(d)) return "transport";
  if (/sip|home loan|emi|pmfme|lic|mutual fund|loan/i.test(d)) return "emi_loan";
  if (/maheswar|maheshwar|patri|pujak|pujari|subash|raju|bahadur|bisaa|satya|kaju|ranjan|tent|pravash|pradip|umakanta|nakul|staff|^alu$|vendor|supplier/i.test(d)) return "supplier_payment";
  if (/repair|grinder|motor|scooty|bike|toto|ferro repair/i.test(d)) return "repairs";
  if (/^home$|recharge|calcutta|cuttack|personal/i.test(d)) return "home_personal";
  if (/misc|factory|shop|workshop|cement|sand|pipeline|elect exp|bleach|newspaper|dustbin|lighter/i.test(d)) return "shop_workshop";
  if (/credit card|bob credit|cc bill|card payment/i.test(d)) return "credit_card_bill";
  return "other";
};

const DailyLedgerPage = () => {
  const screens = useBreakpoint();
  const isMobile = screens.md === false;
  const [date, setDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [homeIntakePeriod, setHomeIntakePeriod] = useState("corrected");
  const [homeIntakeSummary, setHomeIntakeSummary] = useState(null);
  const [allTimeHomeIntakeSummary, setAllTimeHomeIntakeSummary] = useState(null);
  const [rawAllHomeIntakeSummary, setRawAllHomeIntakeSummary] = useState(null);
  const [bakkiCustomers, setBakkiCustomers] = useState([]);
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
    customerCredits: [],
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

  const fetchBakkiCustomers = async () => {
    try {
      const res = await api.get("/customer-credit/list");
      const list = res?.entries || res?.data?.entries || [];
      setBakkiCustomers(list);
    } catch (err) {
      console.error("Failed to fetch customer credit list for autocomplete:", err);
    }
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
        investments: data.investments || [],
        customerCredits: data.customerCredits || [],
        items: (data.items || []).filter((item) => !isCCItem(item)),
      });

      if (data.homeIntakeSummary) setHomeIntakeSummary(data.homeIntakeSummary);
      if (data.allTimeHomeIntakeSummary) setAllTimeHomeIntakeSummary(data.allTimeHomeIntakeSummary);

      try {
        const startOfMonth = targetDate.startOf("month").format("YYYY-MM-DD");
        const endOfMonth = targetDate.endOf("month").format("YYYY-MM-DD");
        const [monthRes, allRes, rawRes] = await Promise.all([
          api.get(`/home-expenses/summary?startDate=${startOfMonth}&endDate=${endOfMonth}`),
          api.get(`/home-expenses/summary?allTime=true`),
          api.get(`/home-expenses/summary?allTime=true&raw=true`),
        ]);
        if (monthRes?.homeIntakeSummary) setHomeIntakeSummary(monthRes.homeIntakeSummary);
        if (allRes?.homeIntakeSummary) setAllTimeHomeIntakeSummary(allRes.homeIntakeSummary);
        if (rawRes?.homeIntakeSummary) setRawAllHomeIntakeSummary(rawRes.homeIntakeSummary);
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
      const res = await api.get("/home-expenses/opening-balance");
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
      await api.post("/home-expenses/opening-balance", payload);
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

  const activeHomeIntakeSummary =
    homeIntakePeriod === "raw_all"
      ? (rawAllHomeIntakeSummary || allTimeHomeIntakeSummary)
      : homeIntakePeriod === "month"
      ? (homeIntakeSummary || allTimeHomeIntakeSummary)
      : (allTimeHomeIntakeSummary || homeIntakeSummary);

  useEffect(() => {
    fetchLedger(date);
    fetchBakkiCustomers();
  }, [date]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...ledgerData,
        items: (ledgerData.items || []).filter((item) => !isCCItem(item)),
        investments: ledgerData.investments || [],
        customerCredits: ledgerData.customerCredits || [],
      };
      await api.post(`/ledger/${date.format("YYYY-MM-DD")}`, payload);
      message.success("Ledger saved successfully");
      fetchLedger(date);
      fetchBakkiCustomers();
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
        { description: "", amount: null, type: "expense", paymentMode: "cash", category: "other" },
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

  // ── Customer Credit (Bakki) ───────────────────────────────────────
  const addCustomerCreditRow = () => {
    setLedgerData({
      ...ledgerData,
      customerCredits: [
        ...(ledgerData.customerCredits || []),
        { customerName: "", phone: "", amount: null, notes: "" },
      ],
    });
  };

  const removeCustomerCreditRow = (index) => {
    const arr = [...(ledgerData.customerCredits || [])];
    arr.splice(index, 1);
    setLedgerData({ ...ledgerData, customerCredits: arr });
  };

  const updateCustomerCreditRow = (index, field, value) => {
    const arr = [...(ledgerData.customerCredits || [])];
    arr[index] = { ...arr[index], [field]: value };
    setLedgerData({ ...ledgerData, customerCredits: arr });
  };

  const handleCustomerSelect = (index, value) => {
    const found = bakkiCustomers.find(
      (c) => c.customerName?.toLowerCase() === value?.toLowerCase()
    );
    const arr = [...(ledgerData.customerCredits || [])];
    arr[index] = {
      ...arr[index],
      customerName: value,
      phone: (found && found.phone && found.phone !== "N/A") ? found.phone : (arr[index].phone || ""),
    };
    setLedgerData({ ...ledgerData, customerCredits: arr });
  };

  // ── Derived calculations ──────────────────────────────────────────
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

    // Cash Sell = Closing Cash + Cash Outflows + Cash to Home − Opening Cash − Other Cash Income
    const derivedCashSell = closing + cashOutflows + cashHome - opening - otherInc;
    // Digital Sell = Closing Digital + Digital Outflows + Digital Home − Opening Digital
    const derivedDigitalSell = closingBank + bankOutflows + digitalHome - openingBank;
    const derivedTotalSell = derivedCashSell + derivedDigitalSell;
    const hasClosing = closing > 0 || closingBank > 0;

    return {
      cashExpenses, bankExpenses, totalExpenses,
      cashInvestments, bankInvestments, totalInvestments,
      totalOutflows,
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
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => {
            const val = e.target.value;
            updateItem(index, "description", val);
            // Auto-suggest category if user hasn't manually picked one
            const suggested = suggestCategory(val);
            if (!record._manualCategory) {
              updateItem(index, "category", suggested);
            }
          }}
          placeholder="e.g., Milk, Bharat Gas, SIP, Home Loan..."
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
      title: "Category",
      dataIndex: "category",
      width: 155,
      render: (cat, _, index) => {
        const cfg = LEDGER_CATEGORIES[cat] || LEDGER_CATEGORIES.other;
        return (
          <Select
            value={cat || "other"}
            onChange={(value) => {
              updateItem(index, "category", value);
              updateItem(index, "_manualCategory", true);
            }}
            style={{ width: "100%" }}
            popupMatchSelectWidth={false}
          >
            {Object.entries(LEDGER_CATEGORIES).map(([key, c]) => (
              <Option key={key} value={key}>{c.emoji} {c.label}</Option>
            ))}
          </Select>
        );
      },
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
          onFocus={(e) => e.target.select()}
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
          onFocus={(e) => e.target.select()}
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
            onFocus={(e) => e.target.select()}
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

  const investmentColumns = [
    {
      title: "#",
      width: 50,
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
      width: 130,
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
          onFocus={(e) => e.target.select()}
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
  ];

  const customerCreditColumns = [
    {
      title: "#",
      width: 50,
      render: (_, __, i) => <Text type="secondary" style={{ fontWeight: 600 }}>{i + 1}</Text>,
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      render: (val, _, i) => (
        <AutoComplete
          options={bakkiCustomers.map((c) => ({
            value: c.customerName,
            label: (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>{c.customerName}</span>
                {c.phone && c.phone !== "N/A" && (
                  <span style={{ color: "#94a3b8", fontSize: 11, marginLeft: 8 }}>{c.phone}</span>
                )}
              </div>
            ),
          }))}
          value={val}
          onSelect={(selectedVal) => handleCustomerSelect(i, selectedVal)}
          onChange={(v) => updateCustomerCreditRow(i, "customerName", v)}
          placeholder="e.g. Ramesh Kumar, Puja Sweets..."
          filterOption={(inp, opt) =>
            String(opt?.value || "").toLowerCase().includes(inp.toLowerCase())
          }
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Phone Number",
      dataIndex: "phone",
      width: 170,
      render: (val, _, i) => (
        <Input
          value={val}
          onChange={(e) => updateCustomerCreditRow(i, "phone", e.target.value)}
          placeholder="e.g. 9876543210"
        />
      ),
    },
    {
      title: "Credit Amount (₹)",
      dataIndex: "amount",
      width: 160,
      render: (val, _, i) => (
        <InputNumber
          value={val === 0 ? null : val}
          onChange={(v) => updateCustomerCreditRow(i, "amount", v)}
          onFocus={(e) => e.target.select()}
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
      title: "Notes / Items on Credit",
      dataIndex: "notes",
      render: (val, _, i) => (
        <Input
          value={val}
          onChange={(e) => updateCustomerCreditRow(i, "notes", e.target.value)}
          placeholder="e.g. 2kg Rasgolla, 1kg Chhena Poda..."
        />
      ),
    },
    {
      title: "",
      width: 45,
      render: (_, __, i) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeCustomerCreditRow(i)} />
      ),
    },
  ];

  return (
    <div>
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
        style={{
          borderRadius: 16,
          marginBottom: 16,
          borderLeft: "4px solid #f59e0b",
          background: "#ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
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
        style={{ borderRadius: 16, marginBottom: 16, background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
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
              value={ledgerData.openingBalance === 0 ? null : ledgerData.openingBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, openingBalance: v ?? 0 })}
              onFocus={(e) => e.target.select()}
              placeholder="0"
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
              value={ledgerData.openingBankBalance === 0 ? null : ledgerData.openingBankBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, openingBankBalance: v ?? 0 })}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              style={{ width: "100%", fontWeight: 700, fontSize: 16, borderRadius: 8 }}
              prefix="₹" min={0} precision={0} controls={false}
            />
          </Col>
        </Row>
      </Card>

      {/* ─── DAILY EXPENSES & INVESTMENTS TABLE ─── */}
      <Card
        bordered={false}
        className="ledger-details-card"
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <Title level={4} style={{ margin: 0, fontSize: isMobile ? "1.1rem" : "1.25rem" }}>Daily Expenses & Investments</Title>
              <Text type="secondary" style={{ fontSize: 11 }}>All payments: Staff Meal, Gas, Milk, SIP, Mutual Funds, Suppliers, etc.</Text>
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
                    Expenses: <Text strong style={{ color: "#ef4444" }}>₹{fmt(totals.totalExpenses)}</Text>
                  </Text>
                  {totals.totalInvestments > 0 && (
                    <Text type="secondary" style={{ fontWeight: 600 }}>
                      Investments: <Text strong style={{ color: "#0d9488" }}>₹{fmt(totals.totalInvestments)}</Text>
                    </Text>
                  )}
                  <Text style={{ fontWeight: 700, fontSize: 15 }}>
                    Total Outflows: <Text strong style={{ color: "#ef4444", fontSize: 16 }}>₹{fmt(totals.totalOutflows)}</Text>
                  </Text>
                </div>
              )}
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ledgerData.items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
                <Text type="secondary">No expense or investment entries yet. Tap "+ Add Entry" above.</Text>
              </div>
            ) : (
              ledgerData.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: item.type === "investment" ? "#f0fdfa" : "#ffffff",
                    border: item.type === "investment" ? "1px solid #99f6e4" : "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "10px 12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* Top Control Line: Index badge, Type, Mode, Delete */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                      <span style={{
                        background: item.type === "investment" ? "#ccfbf1" : "#f1f5f9",
                        color: item.type === "investment" ? "#0f766e" : "#475569",
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
                        style={{ width: 110 }}
                      >
                        <Option value="expense">💸 Expense</Option>
                        <Option value="investment">💰 Invest</Option>
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
                      onChange={(e) => {
                        const val = e.target.value;
                        updateItem(index, "description", val);
                        const suggested = suggestCategory(val);
                        if (!item._manualCategory) {
                          updateItem(index, "category", suggested);
                        }
                      }}
                      placeholder="e.g. Milk, Gas, Staff, SIP..."
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
                <div style={{ fontSize: 10, color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>Expenses</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#ef4444", marginTop: 2 }}>₹{fmt(totals.totalExpenses)}</div>
              </div>
              <div style={{ background: totals.totalInvestments > 0 ? "#f0fdfa" : "#f5f3ff", padding: "8px 10px", borderRadius: 8, border: totals.totalInvestments > 0 ? "1px solid #99f6e4" : "1px solid #ddd6fe" }}>
                <div style={{ fontSize: 10, color: totals.totalInvestments > 0 ? "#0f766e" : "#5b21b6", fontWeight: 700, textTransform: "uppercase" }}>
                  {totals.totalInvestments > 0 ? "Investments" : "Bank Outflow"}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: totals.totalInvestments > 0 ? "#0d9488" : "#7c3aed", marginTop: 2 }}>
                  ₹{fmt(totals.totalInvestments > 0 ? totals.totalInvestments : totals.bankExpenses)}
                </div>
              </div>
              <div style={{
                gridColumn: "1 / -1",
                background: "#f8fafc",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#94a3b8" }}>Total Outflows</span>
                <span style={{ fontSize: 17, fontWeight: 900, color: "#f87171" }}>₹{fmt(totals.totalOutflows)}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ─── MAA / HOME & HOME INTAKE BALANCE ─── */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          marginBottom: 16,
          borderLeft: "4px solid #8b5cf6",
          background: "#ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
        bodyStyle={{ padding: isMobile ? "14px 16px" : "20px 24px" }}
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
                      Cash & digital taken home today (auto-synced to Home Expenses)
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
                    prefix="₹" min={0} precision={0} controls={false}
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
                    prefix="₹" min={0} precision={0} controls={false}
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
                      {homeIntakePeriod === "corrected"
                        ? "✅ Corrected Overall"
                        : homeIntakePeriod === "raw_all"
                        ? "All-Time Raw (Unadjusted)"
                        : `Period: ${date.format("MMMM YYYY")}`}
                    </Text>
                  </div>
                </div>

                {/* Period Selector & Settings Button */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ background: "#fdf2f8", padding: 2, borderRadius: 12, border: "1px solid #fbcfe8", display: "flex", gap: 2 }}>
                    <Button
                      size="small"
                      type={homeIntakePeriod === "corrected" ? "primary" : "text"}
                      onClick={() => setHomeIntakePeriod("corrected")}
                      style={{
                        height: 24,
                        padding: "0 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 10,
                        background: homeIntakePeriod === "corrected" ? "#ec4899" : "transparent",
                        borderColor: homeIntakePeriod === "corrected" ? "#ec4899" : "transparent",
                      }}
                    >
                      ✅ Corrected
                    </Button>
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
                      type={homeIntakePeriod === "raw_all" ? "primary" : "text"}
                      onClick={() => setHomeIntakePeriod("raw_all")}
                      style={{
                        height: 24,
                        padding: "0 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 10,
                        background: homeIntakePeriod === "raw_all" ? "#ec4899" : "transparent",
                        borderColor: homeIntakePeriod === "raw_all" ? "#ec4899" : "transparent",
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
                {activeHomeIntakeSummary?.openingBalance?.isApplied && (activeHomeIntakeSummary?.openingBalance?.total > 0) && (
                  <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Tag color="magenta" style={{ fontSize: 10, borderRadius: 8, padding: "1px 6px", margin: 0, fontWeight: 600 }}>
                      Reconciled Base: 💵 ₹{fmt(activeHomeIntakeSummary.openingBalance.cash)} | 🏦 ₹{fmt(activeHomeIntakeSummary.openingBalance.bank)}
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

      {/* ─── CLOSING BALANCE ─── */}
      <Card
        bordered={false}
        style={{ borderRadius: 16, marginBottom: 16, borderLeft: "4px solid #f59e0b", background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
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
              value={ledgerData.closingBalance === 0 ? null : ledgerData.closingBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, closingBalance: v ?? 0 })}
              onFocus={(e) => e.target.select()}
              placeholder="0"
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
              value={ledgerData.closingBankBalance === 0 ? null : ledgerData.closingBankBalance}
              onChange={(v) => setLedgerData({ ...ledgerData, closingBankBalance: v ?? 0 })}
              onFocus={(e) => e.target.select()}
              placeholder="0"
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
          background: "#ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid #f1f5f9",
          marginBottom: 16,
        }}
        bodyStyle={{ padding: isMobile ? "14px 16px" : "20px 24px" }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <ShoppingCartOutlined style={{ fontSize: 22, color: "#4a151b" }} />
            <Title level={3} style={{ margin: 0, color: "#0f172a", fontWeight: 700, letterSpacing: 0.5, fontSize: isMobile ? "1.2rem" : "1.4rem" }}>
              TODAY'S SELL
            </Title>
            {ledgerData.festival && totals.hasClosing && (
              <Tag icon={<GiftOutlined />} color="gold" style={{ marginLeft: "auto", fontWeight: 700, fontSize: 11, borderRadius: 20, margin: 0 }}>
                {ledgerData.festival}
              </Tag>
            )}
          </div>

          {!totals.hasClosing ? (
            <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.5, display: "block" }}>
              Enter Closing Balance (evening physical count) to see today's sell.
            </Text>
          ) : (
            <>
              <Row gutter={[12, 12]}>
                <Col xs={12} sm={8}>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: isMobile ? "12px 14px" : "16px 20px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <WalletOutlined style={{ color: "#10b981" }} />
                      <Text style={{ color: "#475569", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Cash Sell</Text>
                    </div>
                    <Title level={isMobile ? 3 : 2} style={{ margin: 0, color: "#10b981", fontWeight: 700, fontSize: isMobile ? "1.3rem" : "1.75rem" }}>
                      ₹{fmt(totals.derivedCashSell)}
                    </Title>
                  </div>
                </Col>
                <Col xs={12} sm={8}>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: isMobile ? "12px 14px" : "16px 20px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <BankOutlined style={{ color: "#3b82f6" }} />
                      <Text style={{ color: "#475569", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>P/P Sell</Text>
                    </div>
                    <Title level={isMobile ? 3 : 2} style={{ margin: 0, color: "#3b82f6", fontWeight: 700, fontSize: isMobile ? "1.3rem" : "1.75rem" }}>
                      ₹{fmt(totals.derivedDigitalSell)}
                    </Title>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: isMobile ? "14px 16px" : "16px 20px", border: "1px solid #cbd5e1" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <ShoppingCartOutlined style={{ color: "#4a151b" }} />
                      <Text style={{ color: "#4a151b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Sell</Text>
                    </div>
                    <Title level={1} style={{ margin: 0, color: "#0f172a", fontWeight: 800, fontSize: isMobile ? 26 : 34 }}>
                      ₹{fmt(totals.derivedTotalSell)}
                    </Title>
                  </div>
                </Col>
              </Row>
              <div style={{ marginTop: 12, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, wordBreak: "break-word", border: "1px solid #f1f5f9" }}>
                <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>
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
        style={{ borderRadius: 16, marginBottom: 16, borderLeft: "4px solid #0284c7", background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
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

      {/* ─── CUSTOMER CREDIT (BAKKI) ─── */}
      <Card
        bordered={false}
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ContactsOutlined style={{ fontSize: 18, color: "#ea580c" }} />
              <div>
                <Title level={4} style={{ margin: 0, fontSize: isMobile ? "1.1rem" : "1.25rem" }}>
                  Customer Credit (Bakki)
                </Title>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Record counter credit/bakki given today — auto-syncs with the Customer Credit section.
                </Text>
              </div>
            </div>
            <Button
              onClick={addCustomerCreditRow}
              icon={<PlusOutlined />}
              type="primary"
              style={{
                borderRadius: 8,
                background: "#ea580c",
                border: "none",
                fontWeight: 600,
              }}
            >
              Add Credit Entry
            </Button>
          </div>
        }
        style={{ borderRadius: 20, marginBottom: 16, borderLeft: "4px solid #ea580c", background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        bodyStyle={{ padding: isMobile ? "12px 14px" : "20px 24px" }}
      >
        {(ledgerData.customerCredits || []).length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
            <ContactsOutlined style={{ fontSize: 30, marginBottom: 8, display: "block", color: "#fdba74" }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              No customer credit logged today. Click "Add Credit Entry" to record counter bakki/credit.
            </Text>
          </div>
        ) : !isMobile ? (
          <Table
            dataSource={ledgerData.customerCredits || []}
            columns={customerCreditColumns}
            pagination={false}
            rowKey={(_, index) => index}
            size="middle"
            scroll={{ x: 750 }}
            footer={() => {
              const totalCredit = (ledgerData.customerCredits || []).reduce(
                (sum, c) => sum + (Number(c.amount) || 0), 0
              );
              return (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Text style={{ fontWeight: 700, fontSize: 14 }}>
                    Total Customer Credit: <Text strong style={{ color: "#ea580c", fontSize: 16 }}>₹{fmt(totalCredit)}</Text>
                  </Text>
                </div>
              );
            }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(ledgerData.customerCredits || []).map((item, i) => (
              <div
                key={i}
                style={{
                  background: "#ffffff",
                  border: "1px solid #ffedd5",
                  borderRadius: 12,
                  padding: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}
              >
                {/* Row 1: Index + Customer Name + Delete */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{
                    background: "#ffedd5",
                    color: "#c2410c",
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
                    options={bakkiCustomers.map((c) => ({
                      value: c.customerName,
                      label: (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 600 }}>{c.customerName}</span>
                          {c.phone && c.phone !== "N/A" && (
                            <span style={{ color: "#94a3b8", fontSize: 11, marginLeft: 8 }}>{c.phone}</span>
                          )}
                        </div>
                      ),
                    }))}
                    value={item.customerName}
                    onSelect={(selectedVal) => handleCustomerSelect(i, selectedVal)}
                    onChange={(v) => updateCustomerCreditRow(i, "customerName", v)}
                    placeholder="Customer Name..."
                    filterOption={(inp, opt) =>
                      String(opt?.value || "").toLowerCase().includes(inp.toLowerCase())
                    }
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                    onClick={() => removeCustomerCreditRow(i)}
                    style={{ width: 30, height: 30, borderRadius: 6, background: "#fef2f2" }}
                  />
                </div>

                {/* Row 2: Phone, Amount */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>Phone</div>
                    <Input
                      value={item.phone}
                      onChange={(e) => updateCustomerCreditRow(i, "phone", e.target.value)}
                      placeholder="9876543210"
                      style={{ borderRadius: 6 }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>Amount (₹)</div>
                    <InputNumber
                      value={item.amount === 0 ? null : item.amount}
                      onChange={(v) => updateCustomerCreditRow(i, "amount", v)}
                      style={{ width: "100%", borderRadius: 6 }}
                      prefix="₹"
                      min={0}
                      precision={0}
                      placeholder="0"
                      controls={false}
                    />
                  </div>
                </div>

                {/* Row 3: Notes */}
                <div>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>Notes / Items</div>
                  <Input
                    value={item.notes}
                    onChange={(e) => updateCustomerCreditRow(i, "notes", e.target.value)}
                    placeholder="e.g. 2kg Rasgolla on credit..."
                    style={{ borderRadius: 6 }}
                  />
                </div>
              </div>
            ))}
            {/* Mobile Footer Total */}
            <div style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <Text strong style={{ color: "#c2410c", fontSize: 13 }}>Total Customer Credit:</Text>
              <Text strong style={{ color: "#ea580c", fontSize: 16 }}>
                ₹{fmt((ledgerData.customerCredits || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0))}
              </Text>
            </div>
          </div>
        )}
      </Card>

      {/* ─── INVESTMENT TRACKING ─── */}
      <Card
        bordered={false}
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FundOutlined style={{ fontSize: 18, color: "#0d9488" }} />
              <div>
                <Title level={4} style={{ margin: 0, fontSize: isMobile ? "1.1rem" : "1.25rem" }}>Investment Tracking</Title>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Track SIP, FD, and other investments — manual entry for daily investment records.
                </Text>
              </div>
            </div>
            <Button
              onClick={addInvestmentRow}
              icon={<PlusOutlined />}
              type="primary"
              style={{
                borderRadius: 8,
                background: "#0d9488",
                border: "none",
                fontWeight: 600,
              }}
            >
              Add Investment
            </Button>
          </div>
        }
        style={{ borderRadius: 20, marginBottom: 16, borderLeft: "4px solid #0d9488", background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        bodyStyle={{ padding: isMobile ? "12px 14px" : "20px 24px" }}
      >
        {(ledgerData.investments || []).length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
            <FundOutlined style={{ fontSize: 30, marginBottom: 8, display: "block" }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              No investments logged today. Click "Add Investment" to record SIP, FD, or other investments.
            </Text>
          </div>
        ) : !isMobile ? (
          <Table
            dataSource={ledgerData.investments || []}
            columns={investmentColumns}
            pagination={false}
            rowKey={(_, index) => index}
            size="middle"
            scroll={{ x: 750 }}
            footer={() => {
              const totalInvestment = (ledgerData.investments || []).reduce(
                (sum, inv) => sum + (Number(inv.amount) || 0), 0
              );
              return (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Text style={{ fontWeight: 700, fontSize: 14 }}>
                    Total Investment: <Text strong style={{ color: "#0d9488", fontSize: 16 }}>₹{fmt(totalInvestment)}</Text>
                  </Text>
                </div>
              );
            }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(ledgerData.investments || []).map((item, i) => (
              <div
                key={i}
                style={{
                  background: "#ffffff",
                  border: "1px solid #ccfbf1",
                  borderRadius: 12,
                  padding: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}
              >
                {/* Row 1: Index + Investment Name + Delete */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{
                    background: "#ccfbf1",
                    color: "#0f766e",
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
                    options={[
                      { value: "SIP Investment" },
                      { value: "FD Investment" },
                      { value: "Mutual Fund" },
                      { value: "Gold Savings" },
                      { value: "PPF" },
                      { value: "LIC Premium" },
                    ]}
                    value={item.name}
                    onChange={(v) => updateInvestmentRow(i, "name", v)}
                    placeholder="e.g. SIP Investment, FD..."
                    filterOption={(inp, opt) => opt.value.toLowerCase().includes(inp.toLowerCase())}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                    onClick={() => removeInvestmentRow(i)}
                    style={{ width: 30, height: 30, borderRadius: 6, background: "#fef2f2" }}
                  />
                </div>

                {/* Row 2: Type, Amount */}
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 6, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>Type</div>
                    <Select
                      value={item.type || "SIP"}
                      onChange={(v) => updateInvestmentRow(i, "type", v)}
                      style={{ width: "100%" }}
                    >
                      <Option value="SIP">💰 SIP</Option>
                      <Option value="FD">🏦 FD</Option>
                      <Option value="Other">📋 Other</Option>
                    </Select>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>Amount (₹)</div>
                    <InputNumber
                      value={item.amount === 0 ? null : item.amount}
                      onChange={(v) => updateInvestmentRow(i, "amount", v)}
                      style={{ width: "100%", borderRadius: 6 }}
                      prefix="₹"
                      min={0}
                      precision={0}
                      placeholder="0"
                      controls={false}
                    />
                  </div>
                </div>

                {/* Row 3: Notes */}
                <div>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase" }}>Notes</div>
                  <Input
                    value={item.notes}
                    onChange={(e) => updateInvestmentRow(i, "notes", e.target.value)}
                    placeholder="e.g. Monthly SIP for Sep..."
                    style={{ borderRadius: 6 }}
                  />
                </div>
              </div>
            ))}
            {/* Mobile Footer Total */}
            <div style={{
              background: "#f0fdfa",
              border: "1px solid #99f6e4",
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <Text strong style={{ color: "#0f766e", fontSize: 13 }}>Total Investment:</Text>
              <Text strong style={{ color: "#0d9488", fontSize: 16 }}>
                ₹{fmt((ledgerData.investments || []).reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0))}
              </Text>
            </div>
          </div>
        )}
      </Card>

      {/* ─── SWEET PRODUCTION TABLE ─── */}
      <Card
        bordered={false}
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
              type="primary"
              style={{
                borderRadius: 8,
                background: "#4a151b",
                border: "none",
                fontWeight: 600,
              }}
            >
              Add Sweet
            </Button>
          </div>
        }
        style={{ borderRadius: 20, marginBottom: 16, borderLeft: "4px solid #6366f1", background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
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

      {/* ─── HOME INTAKE OPENING BALANCE MODAL ─── */}
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
            💡 <b>Opening Balance</b>: Set your home cash & bank balance as a starting point. All intake and expenses after this date will be tracked from this baseline.
          </Text>
        </div>

        <Form
          form={openingBalanceForm}
          layout="vertical"
          initialValues={{
            cashOpeningBalance: 0,
            bankOpeningBalance: 0,
            effectiveDate: dayjs(),
            notes: "",
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
                  placeholder="e.g. Physical cash count & bank balance reconciled"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default DailyLedgerPage;
