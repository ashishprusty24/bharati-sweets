import React, { useState, useEffect, useMemo } from "react";
import {
  Card, Row, Col, Table, Button, InputNumber, Input, Select, DatePicker,
  Modal, Form, message, Typography, Space, Tag, Statistic, Empty, Popconfirm,
  Grid, Badge, Progress
} from "antd";
import {
  PlusOutlined, DeleteOutlined, EditOutlined, HomeOutlined,
  TeamOutlined, ShoppingOutlined, CreditCardOutlined, UserOutlined,
  WalletOutlined, BankOutlined, SearchOutlined, RollbackOutlined,
  CalendarOutlined, ArrowUpOutlined, TagOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";

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
  other: { label: "Other", color: "#64748b", bg: "#f1f5f9", icon: <WalletOutlined /> },
};

const SOURCE_CONFIG = {
  home_cash: { label: "Home Cash", color: "#10b981", bg: "#d1fae5", icon: <WalletOutlined /> },
  bank_account: { label: "Bank Account", color: "#6366f1", bg: "#e0e7ff", icon: <BankOutlined /> },
};

const TAG_CONFIG = {
  daily_ledger: { label: "Daily Ledger", color: "#2563eb", bg: "#dbeafe" },
  expenses: { label: "Expenses", color: "#9333ea", bg: "#f3e8ff" },
  event_order: { label: "Event Order", color: "#ea580c", bg: "#ffedd5" },
  direct: { label: "Direct Home", color: "#16a34a", bg: "#dcfce7" },
};

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

const HomeExpensesPage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [datePreset, setDatePreset] = useState("this_month");
  const [dateRange, setDateRange] = useState([dayjs().startOf("month"), dayjs().endOf("month")]);

  const [form] = Form.useForm();

  // Preset Handler
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

      const data = await api.get(`/home-expenses?${params.toString()}`);
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

      const data = await api.get(`/home-expenses/summary?${params.toString()}`);
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch summary", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, [dateRange, filterCategory]);

  const filteredExpenses = useMemo(() => {
    if (!searchText) return expenses;
    return expenses.filter((e) =>
      (e.description || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (e.notes || "").toLowerCase().includes(searchText.toLowerCase())
    );
  }, [expenses, searchText]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date: values.date.toISOString(),
      };

      if (editingExpense) {
        await api.put(`/home-expenses/${editingExpense._id}`, payload);
        message.success("Expense updated successfully");
      } else {
        await api.post("/home-expenses", payload);
        message.success("Expense added successfully");
      }

      setModalVisible(false);
      setEditingExpense(null);
      form.resetFields();
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      if (err.errorFields) return;
      message.error("Failed to save expense");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/home-expenses/${id}`);
      message.success("Expense deleted");
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      message.error("Failed to delete expense");
    }
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    form.setFieldsValue({
      ...expense,
      date: dayjs(expense.date),
    });
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingExpense(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs(), paymentSource: "home_cash", category: "other", sourceTag: "direct" });
    setModalVisible(true);
  };

  const resetFilters = () => {
    setSearchText("");
    setFilterCategory("all");
    setDatePreset("this_month");
    setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      width: 120,
      render: (d) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13, color: "#1e293b" }}>{dayjs(d).format("DD MMM YYYY")}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(d).format("dddd")}</Text>
        </Space>
      ),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: 14, color: "#0f172a" }}>{text}</Text>
          {record.notes && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{record.notes}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      width: 170,
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
      width: 140,
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
            }}
          >
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "Origin Tag",
      dataIndex: "sourceTag",
      width: 130,
      render: (tag) => {
        const cfg = TAG_CONFIG[tag] || TAG_CONFIG.direct;
        return (
          <Tag
            style={{
              color: cfg.color,
              background: cfg.bg,
              border: `1px solid ${cfg.color}33`,
              borderRadius: 8,
              padding: "4px 10px",
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      width: 140,
      align: "right",
      render: (amt) => (
        <Text strong style={{ color: "#e11d48", fontSize: 16, fontWeight: 700 }}>
          ₹{Number(amt).toLocaleString("en-IN")}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "",
      width: 90,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#3b82f6" }} />}
            onClick={() => openEditModal(record)}
            style={{ background: "#eff6ff", borderRadius: 8 }}
          />
          <Popconfirm
            title="Delete this expense?"
            description="This will also update synchronized entries."
            onConfirm={() => handleDelete(record._id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              style={{ background: "#fef2f2", borderRadius: 8 }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "0 4px" }}>
      {/* ── HERO BANNER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
          borderRadius: 24,
          padding: isMobile ? "20px 16px" : "28px 32px",
          color: "#fff",
          marginBottom: 24,
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ background: "rgba(255, 255, 255, 0.15)", padding: 8, borderRadius: 12, display: "inline-flex" }}>
                <HomeOutlined style={{ fontSize: 22, color: "#c084fc" }} />
              </span>
              <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800, fontSize: isMobile ? "1.4rem" : "1.8rem" }}>
                Home Expenses & Ledger Sync
              </Title>
            </div>
            <Text style={{ color: "#cbd5e1", fontSize: 13 }}>
              Staff salaries, supplier payments, personal drawings — all automatically synchronized with Daily Ledger & Vendors.
            </Text>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={openAddModal}
            style={{
              height: 48,
              padding: "0 28px",
              borderRadius: 14,
              fontWeight: 700,
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              border: "none",
              boxShadow: "0 8px 20px rgba(139, 92, 246, 0.4)",
            }}
          >
            Add New Expense
          </Button>
        </div>
      </div>

      {/* ── METRIC CARDS ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 20,
              background: "#fff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              border: "1px solid #f1f5f9",
            }}
          >
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Period Expenses</Text>}
              value={totalAmount}
              prefix="₹"
              valueStyle={{ color: "#e11d48", fontWeight: 800, fontSize: 26 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{filteredExpenses.length} transactions recorded</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 20,
              background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              border: "1px solid #fbcfe8",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#be185d" }}>
                Home Intake Tracking
              </Text>
              <HomeOutlined style={{ color: "#ec4899", fontSize: 16 }} />
            </div>
            <div style={{ marginTop: 6 }}>
              <Text strong style={{ color: "#be185d", fontSize: 22, fontWeight: 800 }}>
                ₹{(summary?.homeIntakeSummary?.total || 0).toLocaleString("en-IN")}
              </Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }}>
              <span style={{ color: "#047857", fontWeight: 700 }}>💵 Cash: ₹{(summary?.homeIntakeSummary?.cash || 0).toLocaleString("en-IN")}</span>
              <span style={{ color: "#4338ca", fontWeight: 700 }}>🏦 Bank: ₹{(summary?.homeIntakeSummary?.bank || 0).toLocaleString("en-IN")}</span>
            </div>
          </Card>
        </Col>

        {Object.entries(CATEGORY_CONFIG).slice(1, 3).map(([key, cfg]) => {
          const categorySum = summary?.byCategory?.[key] || 0;
          const pct = totalAmount > 0 ? Math.round((categorySum / totalAmount) * 100) : 0;
          return (
            <Col xs={24} sm={12} md={6} key={key}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 20,
                  background: "#fff",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{cfg.label}</Text>
                  <span style={{ background: cfg.bg, color: cfg.color, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    {pct}%
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ color: cfg.color, fontSize: 22, fontWeight: 800 }}>
                    ₹{categorySum.toLocaleString("en-IN")}
                  </Text>
                </div>
                <Progress percent={pct} strokeColor={cfg.color} showInfo={false} size="small" style={{ marginTop: 6 }} />
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* ── FILTER TOOLBAR ── */}
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          background: "#fff",
          marginBottom: 24,
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          border: "1px solid #f1f5f9",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Active Date Range Banner with Back Button */}
          {(searchText || filterCategory !== "all" || datePreset !== "this_month") && (
            <div
              style={{
                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                border: "1px solid #93c5fd",
                borderRadius: 14,
                padding: "10px 18px",
                display: "flex",
                justify: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <Space size="middle">
                <CalendarOutlined style={{ color: "#2563eb", fontSize: 18 }} />
                <div>
                  <Text strong style={{ color: "#1e3a8a", fontSize: 14, display: "block" }}>
                    Filtered Search View Active
                  </Text>
                  <Text style={{ color: "#3b82f6", fontSize: 12 }}>
                    {dateRange && dateRange[0] && dateRange[1]
                      ? `Range: ${dateRange[0].format("DD MMM YYYY")} - ${dateRange[1].format("DD MMM YYYY")}`
                      : `Preset: ${datePreset}`}
                    {searchText ? ` | Search: "${searchText}"` : ""}
                    {filterCategory !== "all" ? ` | Category: ${filterCategory}` : ""}
                  </Text>
                </div>
              </Space>

              <Button
                type="primary"
                danger
                icon={<RollbackOutlined />}
                onClick={resetFilters}
                style={{
                  borderRadius: 10,
                  height: 38,
                  fontWeight: 700,
                  background: "#ef4444",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
                }}
              >
                ← Back to All Expenses
              </Button>
            </div>
          )}

          {/* Top Row: Search + Quick Presets + Date Range */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <Input
              placeholder="Search expenses by description, notes..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{
                width: isMobile ? "100%" : 320,
                height: 44,
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            />

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
              {/* Date Presets */}
              <Space wrap>
                <Button
                  type={datePreset === "today" ? "primary" : "default"}
                  onClick={() => handlePresetChange("today")}
                  style={{ borderRadius: 10, height: 38, fontSize: 12 }}
                >
                  Today
                </Button>
                <Button
                  type={datePreset === "this_week" ? "primary" : "default"}
                  onClick={() => handlePresetChange("this_week")}
                  style={{ borderRadius: 10, height: 38, fontSize: 12 }}
                >
                  This Week
                </Button>
                <Button
                  type={datePreset === "this_month" ? "primary" : "default"}
                  onClick={() => handlePresetChange("this_month")}
                  style={{ borderRadius: 10, height: 38, fontSize: 12 }}
                >
                  This Month
                </Button>
              </Space>

              <RangePicker
                value={dateRange}
                onChange={(dates) => { setDatePreset("custom"); setDateRange(dates); }}
                format="DD MMM YYYY"
                style={{ borderRadius: 10, height: 38, width: isMobile ? "100%" : 240 }}
              />
            </div>
          </div>

          {/* Bottom Row: Category Pills Filter */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            <Button
              type={filterCategory === "all" ? "primary" : "text"}
              onClick={() => setFilterCategory("all")}
              style={{
                borderRadius: 20,
                height: 34,
                padding: "0 16px",
                fontWeight: 600,
                fontSize: 12,
                background: filterCategory === "all" ? "#0f172a" : "#f1f5f9",
                color: filterCategory === "all" ? "#fff" : "#475569",
              }}
            >
              All ({expenses.length})
            </Button>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
              const count = expenses.filter((e) => e.category === key).length;
              const isActive = filterCategory === key;
              return (
                <Button
                  key={key}
                  onClick={() => setFilterCategory(key)}
                  style={{
                    borderRadius: 20,
                    height: 34,
                    padding: "0 16px",
                    fontWeight: 600,
                    fontSize: 12,
                    border: `1px solid ${cfg.color}33`,
                    background: isActive ? cfg.color : cfg.bg,
                    color: isActive ? "#fff" : cfg.color,
                  }}
                >
                  {cfg.icon} {cfg.label} ({count})
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── EXPENSES LIST / TABLE ── */}
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          background: "#fff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          border: "1px solid #f1f5f9",
        }}
      >
        {isMobile ? (
          /* Mobile Card Layout */
          <div>
            {loading && (
              <div style={{ textAlign: "center", padding: 30 }}>
                <Text type="secondary">Loading expenses...</Text>
              </div>
            )}
            {!loading && filteredExpenses.length === 0 && (
              <Empty description="No expenses found" style={{ padding: 40 }} />
            )}
            {!loading &&
              filteredExpenses.map((item) => {
                const catCfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
                const srcCfg = SOURCE_CONFIG[item.paymentSource] || SOURCE_CONFIG.home_cash;
                return (
                  <div
                    key={item._id}
                    style={{
                      background: "#f8fafc",
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <Text strong style={{ fontSize: 15, color: "#0f172a", display: "block" }}>
                          {item.description}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.date).format("DD MMM YYYY")}
                        </Text>
                      </div>
                      <Text strong style={{ color: "#e11d48", fontSize: 17, fontWeight: 800 }}>
                        ₹{Number(item.amount).toLocaleString("en-IN")}
                      </Text>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                      <Space size={4}>
                        <Tag color={catCfg.color} style={{ borderRadius: 6, fontSize: 11 }}>{catCfg.label}</Tag>
                        <Tag color={srcCfg.color} style={{ borderRadius: 6, fontSize: 11 }}>{srcCfg.label}</Tag>
                      </Space>

                      <Space size="small">
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openEditModal(item)}
                        />
                        <Popconfirm
                          title="Delete this expense?"
                          onConfirm={() => handleDelete(item._id)}
                          okText="Delete"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          /* Desktop Table Layout */
          <Table
            dataSource={filteredExpenses}
            columns={columns}
            loading={loading}
            rowKey="_id"
            size="middle"
            pagination={{ pageSize: 12, showSizeChanger: true }}
            locale={{ emptyText: <Empty description="No home expenses recorded" /> }}
          />
        )}
      </Card>

      {/* ── ADD/EDIT MODAL ── */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "#f3e8ff", color: "#8b5cf6", padding: 8, borderRadius: 10 }}>
              <HomeOutlined style={{ fontSize: 18 }} />
            </span>
            <Text strong style={{ fontSize: 17 }}>
              {editingExpense ? "Edit Expense Entry" : "Record New Expense"}
            </Text>
          </div>
        }
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingExpense(null); }}
        onOk={handleSubmit}
        okText={editingExpense ? "Update Expense" : "Save & Sync Expense"}
        okButtonProps={{
          style: {
            borderRadius: 10,
            height: 42,
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            border: "none",
            fontWeight: 700,
          },
        }}
        cancelButtonProps={{ style: { borderRadius: 10, height: 42 } }}
        width={540}
        destroyOnClose
        style={{ borderRadius: 20 }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Expense Date" rules={[{ required: true, message: "Select date" }]}>
                <DatePicker style={{ width: "100%", height: 42, borderRadius: 10 }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true, message: "Enter amount" }]}>
                <InputNumber style={{ width: "100%", height: 42, borderRadius: 10, fontSize: 16, fontWeight: 700 }} min={0} prefix="₹" placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          {/* Quick Amount Selector */}
          <div style={{ marginBottom: 16, marginTop: -8 }}>
            <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>Quick Amount:</Text>
            <Space wrap size={4}>
              {QUICK_AMOUNTS.map((amt) => (
                <Tag
                  key={amt}
                  onClick={() => form.setFieldsValue({ amount: amt })}
                  style={{
                    cursor: "pointer",
                    borderRadius: 6,
                    padding: "2px 8px",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    fontWeight: 600,
                  }}
                >
                  +₹{amt.toLocaleString("en-IN")}
                </Tag>
              ))}
            </Space>
          </div>

          <Form.Item name="description" label="Description / Vendor Name" rules={[{ required: true, message: "Enter description" }]}>
            <Input placeholder="e.g., Staff salary for July, Kaju supplier payment, Electricity Bill" style={{ height: 42, borderRadius: 10 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select placeholder="Select category" style={{ height: 42 }}>
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <Option key={key} value={key}>
                      <Space>{cfg.icon} <span>{cfg.label}</span></Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paymentSource" label="Paid From" rules={[{ required: true }]}>
                <Select placeholder="Select source" style={{ height: 42 }}>
                  {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                    <Option key={key} value={key}>
                      <Space>{cfg.icon} <span>{cfg.label}</span></Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="sourceTag" label="Origin Tag (Daily Ledger, Expenses, Event Order, Direct)" initialValue="direct">
            <Select placeholder="Select origin tag" style={{ height: 42 }}>
              {Object.entries(TAG_CONFIG).map(([key, cfg]) => (
                <Option key={key} value={key}>
                  <Tag color={cfg.color} style={{ borderRadius: 6 }}>{cfg.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notes (Optional)">
            <Input.TextArea rows={2} placeholder="Any additional payment details..." style={{ borderRadius: 10 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HomeExpensesPage;
