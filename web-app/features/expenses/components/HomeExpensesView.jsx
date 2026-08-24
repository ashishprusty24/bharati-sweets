"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card, Row, Col, Table, Button, InputNumber, Input, Select, DatePicker,
  Modal, Form, message, Typography, Space, Tag, Popconfirm,
  Grid, Progress, Badge, Avatar
} from "antd";
import {
  PlusOutlined, DeleteOutlined, EditOutlined, HomeOutlined,
  TeamOutlined, ShoppingOutlined, CreditCardOutlined, UserOutlined,
  WalletOutlined, BankOutlined, SearchOutlined, CalendarOutlined,
  BellOutlined, ArrowUpOutlined, DollarOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const CATEGORY_CONFIG = {
  home_intake: { label: "Home Intake", color: "#ec4899", bg: "#fce7f3", icon: <HomeOutlined /> },
  staff_salary: { label: "Staff Salary", color: "#3b82f6", bg: "#dbeafe", icon: <TeamOutlined /> },
  supplier_payment: { label: "Supplier Payment", color: "#f59e0b", bg: "#fef3c7", icon: <ShoppingOutlined /> },
  personal: { label: "Personal", color: "#8b5cf6", bg: "#f3e8ff", icon: <UserOutlined /> },
  credit_card_bill: { label: "Credit Card Bill", color: "#ef4444", bg: "#fee2e2", icon: <CreditCardOutlined /> },
  cc_loan: { label: "CC Loan", color: "#0d7377", bg: "#f0fdfa", icon: <BankOutlined /> },
  cc_loan_repayment: { label: "CC Loan Repayment", color: "#059669", bg: "#ecfdf5", icon: <BankOutlined /> },
  other: { label: "Other", color: "#64748b", bg: "#f1f5f9", icon: <WalletOutlined /> },
};

const SOURCE_CONFIG = {
  home_cash: { label: "Home Cash", color: "#10b981", bg: "#e6f4ea", icon: <WalletOutlined /> },
  bank_account: { label: "Bank Account", color: "#6366f1", bg: "#f3e8ff", icon: <BankOutlined /> },
  credit_card: { label: "Credit Card", color: "#ef4444", bg: "#fee2e2", icon: <CreditCardOutlined /> },
  cc_loan: { label: "CC Loan", color: "#0d7377", bg: "#e6f4f1", icon: <BankOutlined /> },
};

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

const Sparkline = ({ color }) => {
  return (
    <svg width="100%" height="28" viewBox="0 0 120 28" fill="none" style={{ marginTop: 8 }}>
      <path
        d="M0 20 C 15 10, 30 25, 45 12 C 60 2, 75 18, 90 8 C 105 0, 115 15, 120 10 L 120 28 L 0 28 Z"
        fill={`url(#gradient-${color.replace('#', '')})`}
        opacity="0.3"
      />
      <path
        d="M0 20 C 15 10, 30 25, 45 12 C 60 2, 75 18, 90 8 C 105 0, 115 15, 120 10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const HomeExpensesView = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedPaymentSource, setSelectedPaymentSource] = useState("home_cash");

  // Filters
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [datePreset, setDatePreset] = useState("this_month");
  const [dateRange, setDateRange] = useState([dayjs().startOf("month"), dayjs().endOf("month")]);

  const [form] = Form.useForm();

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset === "today") {
      setDateRange([dayjs().startOf("day"), dayjs().endOf("day")]);
    } else if (preset === "this_week") {
      setDateRange([dayjs().startOf("week"), dayjs().endOf("week")]);
    } else if (preset === "this_month") {
      setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
    } else if (preset === "all") {
      setDateRange(null);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange && dateRange[0]) params.append("startDate", dateRange[0].format("YYYY-MM-DD"));
      if (dateRange && dateRange[1]) params.append("endDate", dateRange[1].format("YYYY-MM-DD"));
      if (filterCategory && filterCategory !== "all") params.append("category", filterCategory);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      const data = await res.json();
      setExpenses(data || []);
    } catch (err) {
      message.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange && dateRange[0]) params.append("startDate", dateRange[0].format("YYYY-MM-DD"));
      if (dateRange && dateRange[1]) params.append("endDate", dateRange[1].format("YYYY-MM-DD"));

      const res = await fetch(`/api/expenses/summary?${params.toString()}`);
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, [dateRange, filterCategory]);

  const filteredExpenses = useMemo(() => {
    if (!searchText) return expenses;
    const lower = searchText.toLowerCase();
    return expenses.filter(
      (e) =>
        e.description?.toLowerCase().includes(lower) ||
        e.category?.toLowerCase().includes(lower) ||
        e.paymentSource?.toLowerCase().includes(lower) ||
        e.notes?.toLowerCase().includes(lower)
    );
  }, [expenses, searchText]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  // Category counts for pill tabs
  const categoryCounts = useMemo(() => {
    const counts = { all: expenses.length };
    Object.keys(CATEGORY_CONFIG).forEach(cat => {
      counts[cat] = expenses.filter(e => e.category === cat).length;
    });
    return counts;
  }, [expenses]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        category: values.category || (editingExpense && editingExpense.category) || "other",
        date: values.date.format("YYYY-MM-DD"),
      };

      if (editingExpense) {
        await fetch(`/api/expenses/${editingExpense._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        message.success("Expense updated successfully");
      } else {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        message.success("Expense added successfully");
      }

      setModalVisible(false);
      setEditingExpense(null);
      form.resetFields();
      fetchExpenses();
    } catch (err) {
      message.error("Failed to save expense");
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      message.success("Expense deleted");
      fetchExpenses();
    } catch (err) {
      message.error("Failed to delete expense");
    }
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setSelectedPaymentSource(expense.paymentSource || "home_cash");
    form.setFieldsValue({
      ...expense,
      date: dayjs(expense.date),
    });
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingExpense(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs(), paymentSource: "home_cash" });
    setSelectedPaymentSource("home_cash");
    setModalVisible(true);
  };

  const columns = [
    {
      title: "Date ↕",
      dataIndex: "date",
      key: "date",
      width: 140,
      render: (d) => {
        const dateObj = dayjs(d);
        return (
          <div>
            <Text strong style={{ color: "#0f172a", fontSize: 13, display: "block" }}>
              {dateObj.format("DD MMM YYYY")}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dateObj.format("dddd")}
            </Text>
          </div>
        );
      },
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text, record) => (
        <div>
          <Text strong style={{ color: "#0f172a", fontSize: 14, display: "block" }}>{text}</Text>
          {record.notes ? (
            <Text type="secondary" style={{ fontSize: 11 }}>{record.notes}</Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 11 }}>{record.category === "home_intake" ? "Home intake transfer" : "General expense entry"}</Text>
          )}
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 160,
      render: (cat) => {
        const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
        return (
          <Tag
            icon={cfg.icon}
            style={{
              color: cfg.color,
              background: cfg.bg,
              border: `1px solid ${cfg.color}33`,
              borderRadius: 8,
              padding: "4px 10px",
              fontWeight: 600,
              fontSize: 12,
              margin: 0
            }}
          >
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "Paid From",
      dataIndex: "paymentSource",
      key: "paymentSource",
      width: 150,
      render: (src) => {
        const cfg = SOURCE_CONFIG[src] || SOURCE_CONFIG.home_cash;
        return (
          <Tag
            icon={cfg.icon}
            style={{
              color: cfg.color,
              background: cfg.bg,
              border: `1px solid ${cfg.color}33`,
              borderRadius: 8,
              padding: "4px 10px",
              fontWeight: 600,
              fontSize: 12,
              margin: 0
            }}
          >
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "Amount ↕",
      dataIndex: "amount",
      key: "amount",
      width: 130,
      align: "right",
      render: (amt) => (
        <Text strong style={{ color: "#e11d48", fontSize: 15, fontWeight: 800 }}>
          ₹{Number(amt).toLocaleString("en-IN")}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      align: "center",
      render: (_, record) => (
        <Space size={6}>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#3b82f6", fontSize: 14 }} />}
            onClick={() => openEditModal(record)}
            style={{ background: "#eff6ff", borderRadius: 8, width: 32, height: 32, padding: 0 }}
          />
          <Popconfirm
            title="Delete this expense?"
            description="This will also update synchronized entries."
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
              style={{ background: "#fef2f2", borderRadius: 8, width: 32, height: 32, padding: 0 }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const staffSalarySum = summary?.byCategory?.staff_salary || 0;
  const supplierPaySum = summary?.byCategory?.supplier_payment || 0;
  const staffPct = totalAmount > 0 ? Math.round((staffSalarySum / totalAmount) * 100) : 0;
  const supplierPct = totalAmount > 0 ? Math.round((supplierPaySum / totalAmount) * 100) : 0;

  return (
    <div style={{ padding: "8px 4px 40px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* TOP RIGHT ACTION BAR */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={openAddModal}
          style={{
            height: 42,
            padding: "0 24px",
            borderRadius: 12,
            fontWeight: 700,
            background: "#6366f1",
            borderColor: "#6366f1",
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
          }}
        >
          Add New Expense
        </Button>
      </div>

      {/* METRIC CARDS ROW (4 CARDS) */}
      <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
        {/* Card 1 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              border: "1px solid #f1f5f9",
              padding: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
            bodyStyle={{ padding: "14px 14px 0 14px" }}
          >
            <div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f3e8ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 8 }}>
                <WalletOutlined />
              </div>
              <Text style={{ color: "#94a3b8", fontWeight: 600, fontSize: 11, letterSpacing: "0.4px" }}>TOTAL PERIOD EXPENSES</Text>
              <div style={{ marginTop: 2 }}>
                <Title level={3} style={{ margin: 0, fontWeight: 800, fontSize: 22, color: "#0f172a" }}>
                  ₹{totalAmount.toLocaleString("en-IN")}
                </Title>
              </div>
              <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 2, display: "block" }}>{filteredExpenses.length} transactions recorded</Text>
            </div>
            <Sparkline color="#8b5cf6" />
          </Card>
        </Col>

        {/* Card 2 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              border: "1px solid #f1f5f9",
              height: "100%"
            }}
            bodyStyle={{ padding: 14 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fce7f3", color: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                <HomeOutlined />
              </div>
              <HomeOutlined style={{ color: "#ec4899", fontSize: 16 }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: "#ec4899", fontWeight: 700, fontSize: 11, letterSpacing: "0.4px" }}>HOME INTAKE BALANCE</Text>
              <div style={{ marginTop: 2 }}>
                <Title level={3} style={{ margin: 0, fontWeight: 800, fontSize: 22, color: "#0f172a" }}>
                  ₹{(summary?.homeIntakeSummary?.remaining?.total || 0).toLocaleString("en-IN")}
                </Title>
                <Text style={{ color: "#94a3b8", fontSize: 10, display: "block" }}>Remaining Balance</Text>
              </div>
            </div>
            <div style={{ borderTop: "1px dashed #f1f5f9", marginTop: 8, paddingTop: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                <span style={{ color: "#10b981", fontWeight: 700 }}>📥 Received: ₹{(summary?.homeIntakeSummary?.totalReceived || 0).toLocaleString("en-IN")}</span>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>📤 Spent: ₹{(summary?.homeIntakeSummary?.totalSpent || 0).toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                <span style={{ color: "#10b981", fontWeight: 600 }}>💵 Cash: ₹{(summary?.homeIntakeSummary?.remaining?.cash || 0).toLocaleString("en-IN")}</span>
                <span style={{ color: "#3b82f6", fontWeight: 600 }}>🏦 Bank: ₹{(summary?.homeIntakeSummary?.remaining?.bank || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* Card 3 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              border: "1px solid #f1f5f9",
              height: "100%"
            }}
            bodyStyle={{ padding: 14 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#dbeafe", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                <UserOutlined />
              </div>
              <Tag color="blue" bordered={false} style={{ borderRadius: 8, fontWeight: 700, margin: 0, fontSize: 11 }}>{staffPct}%</Tag>
            </div>
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: "#94a3b8", fontWeight: 600, fontSize: 11, letterSpacing: "0.4px" }}>STAFF SALARY</Text>
              <div style={{ marginTop: 2 }}>
                <Title level={3} style={{ margin: 0, fontWeight: 800, fontSize: 22, color: "#0f172a" }}>
                  ₹{staffSalarySum.toLocaleString("en-IN")}
                </Title>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <Progress percent={staffPct} strokeColor="#3b82f6" size="small" showInfo={false} />
              <Text style={{ color: "#94a3b8", fontSize: 10, marginTop: 4, display: "block" }}>
                {staffSalarySum === 0 ? "No salary paid this period" : `${staffPct}% of total expenses`}
              </Text>
            </div>
          </Card>
        </Col>

        {/* Card 4 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              border: "1px solid #f1f5f9",
              height: "100%"
            }}
            bodyStyle={{ padding: 14 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#ffedd5", color: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                <ShoppingOutlined />
              </div>
              <Tag color="orange" bordered={false} style={{ borderRadius: 8, fontWeight: 700, margin: 0, fontSize: 11 }}>{supplierPct}%</Tag>
            </div>
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: "#94a3b8", fontWeight: 600, fontSize: 11, letterSpacing: "0.4px" }}>SUPPLIER PAYMENT</Text>
              <div style={{ marginTop: 2 }}>
                <Title level={3} style={{ margin: 0, fontWeight: 800, fontSize: 22, color: "#0f172a" }}>
                  ₹{supplierPaySum.toLocaleString("en-IN")}
                </Title>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <Progress percent={supplierPct} strokeColor="#f97316" size="small" showInfo={false} />
              <Text style={{ color: "#94a3b8", fontSize: 10, marginTop: 4, display: "block" }}>
                {supplierPaySum === 0 ? "No supplier payment this period" : `${supplierPct}% of total expenses`}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* SEARCH & CONTROLS ROW A */}
      <Row gutter={[16, 12]} align="middle" style={{ marginBottom: 14 }}>
        <Col xs={24} md={10}>
          <Input
            placeholder="Search expenses by description, note..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ borderRadius: 20, height: 40, background: "#ffffff", border: "1px solid #e2e8f0" }}
          />
        </Col>

        <Col xs={24} md={14} style={{ display: "flex", justifyContent: isMobile ? "flex-start" : "flex-end", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <div style={{ background: "#ffffff", padding: 3, borderRadius: 18, border: "1px solid #e2e8f0", display: "flex", gap: 2 }}>
            <Button
              type={datePreset === "today" ? "primary" : "text"}
              onClick={() => handlePresetChange("today")}
              style={{ borderRadius: 14, height: 32, fontSize: 12, fontWeight: 600, background: datePreset === "today" ? "#6366f1" : "transparent" }}
            >
              Today
            </Button>
            <Button
              type={datePreset === "this_week" ? "primary" : "text"}
              onClick={() => handlePresetChange("this_week")}
              style={{ borderRadius: 14, height: 32, fontSize: 12, fontWeight: 600, background: datePreset === "this_week" ? "#6366f1" : "transparent" }}
            >
              This Week
            </Button>
            <Button
              type={datePreset === "this_month" ? "primary" : "text"}
              onClick={() => handlePresetChange("this_month")}
              style={{ borderRadius: 14, height: 32, fontSize: 12, fontWeight: 600, background: datePreset === "this_month" ? "#6366f1" : "transparent" }}
            >
              This Month
            </Button>
          </div>

          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              setDatePreset("custom");
              setDateRange(dates);
            }}
            style={{ height: 38, borderRadius: 18, background: "#ffffff", border: "1px solid #e2e8f0" }}
            format="DD MMM YYYY"
          />
        </Col>
      </Row>

      {/* CATEGORY FILTER PILL TABS ROW B */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        <Button
          type={filterCategory === "all" ? "primary" : "default"}
          onClick={() => setFilterCategory("all")}
          style={{
            borderRadius: 16,
            height: 34,
            fontWeight: 600,
            fontSize: 12,
            background: filterCategory === "all" ? "#6366f1" : "#ffffff",
            borderColor: filterCategory === "all" ? "#6366f1" : "#e2e8f0",
            color: filterCategory === "all" ? "#ffffff" : "#475569"
          }}
        >
          All ({categoryCounts.all || 0})
        </Button>

        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const isSelected = filterCategory === key;
          const count = categoryCounts[key] || 0;
          return (
            <Button
              key={key}
              onClick={() => setFilterCategory(key)}
              style={{
                borderRadius: 16,
                height: 34,
                fontWeight: 600,
                fontSize: 12,
                background: isSelected ? cfg.color : cfg.bg,
                borderColor: isSelected ? cfg.color : `${cfg.color}40`,
                color: isSelected ? "#ffffff" : cfg.color,
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label} ({count})</span>
            </Button>
          );
        })}
      </div>

      {/* DATA TABLE */}
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          background: "#ffffff",
          boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          border: "1px solid #f1f5f9",
        }}
        bodyStyle={{ padding: isMobile ? "10px" : "16px" }}
      >
        <Table
          columns={columns}
          dataSource={filteredExpenses}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          scroll={{ x: true }}
        />
      </Card>

      {/* MODAL */}
      <Modal
        title={
          <Space>
            <div style={{ background: "#f3e8ff", padding: 8, borderRadius: 10, display: "flex" }}>
              <DollarOutlined style={{ color: "#8b5cf6", fontSize: 18 }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}>
              {editingExpense ? "Edit Expense Entry" : "Record New Expense"}
            </span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingExpense(null);
        }}
        onOk={handleSubmit}
        okText={editingExpense ? "Update Expense" : "Save Expense"}
        width={540}
        centered
        styles={{ body: { paddingTop: 16 } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true, message: "Enter amount" }]}>
            <InputNumber
              style={{ width: "100%", height: 48, borderRadius: 12, fontSize: 20, fontWeight: 700, color: "#e11d48" }}
              prefix="₹"
              placeholder="0.00"
              min={1}
            />
          </Form.Item>

          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <Text type="secondary" style={{ fontSize: 11, alignSelf: "center", marginRight: 4 }}>Quick Amount:</Text>
            {QUICK_AMOUNTS.map((amt) => (
              <Tag
                key={amt}
                onClick={() => {
                  const current = form.getFieldValue("amount") || 0;
                  form.setFieldsValue({ amount: current + amt });
                }}
                style={{
                  cursor: "pointer",
                  borderRadius: 8,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                +₹{amt.toLocaleString("en-IN")}
              </Tag>
            ))}
          </div>

          <Form.Item name="description" label="Description / Vendor Name" rules={[{ required: true, message: "Enter description" }]}>
            <Input placeholder="e.g., Staff salary for July, Kaju supplier payment, Electricity Bill" style={{ height: 42, borderRadius: 10 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="paymentSource" label="Paid From" rules={[{ required: true }]}>
                <Select
                  placeholder="Select source"
                  style={{ height: 42 }}
                  onChange={(val) => setSelectedPaymentSource(val)}
                >
                  {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                    <Option key={key} value={key}>
                      <Space>{cfg.icon} <span>{cfg.label}</span></Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <div style={{ marginTop: -12, marginBottom: 12 }}>
                <Text style={{ fontSize: 11, color: selectedPaymentSource === "home_cash" ? "#10b981" : selectedPaymentSource === "bank_account" ? "#6366f1" : selectedPaymentSource === "cc_loan" ? "#0d7377" : "#ef4444", fontWeight: 600 }}>
                  {selectedPaymentSource === "home_cash" && "💵 Deducts from Home Cash"}
                  {selectedPaymentSource === "bank_account" && "🏦 Deducts from Bank Account"}
                  {selectedPaymentSource === "credit_card" && "💳 Deducts from Credit Card"}
                  {selectedPaymentSource === "cc_loan" && "🏦 Withdraws from CC Loan Account"}
                </Text>
              </div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="date" label="Expense Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%", height: 42, borderRadius: 10 }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes (Optional)">
            <Input.TextArea rows={2} placeholder="Any additional payment details..." style={{ borderRadius: 10 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HomeExpensesView;
