import React, { useState, useEffect, useMemo } from "react";
import {
  Card, Row, Col, Table, Button, InputNumber, Input, Select, DatePicker,
  Modal, Form, message, Typography, Space, Tag, Statistic, Empty, Popconfirm
} from "antd";
import {
  PlusOutlined, DeleteOutlined, EditOutlined, HomeOutlined,
  TeamOutlined, ShoppingOutlined, CreditCardOutlined, UserOutlined,
  WalletOutlined, BankOutlined, FilterOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CATEGORY_CONFIG = {
  staff_salary: { label: "Staff Salary", color: "#3b82f6", icon: <TeamOutlined /> },
  supplier_payment: { label: "Supplier Payment", color: "#f59e0b", icon: <ShoppingOutlined /> },
  personal: { label: "Personal", color: "#8b5cf6", icon: <UserOutlined /> },
  credit_card_bill: { label: "Credit Card Bill", color: "#ef4444", icon: <CreditCardOutlined /> },
  other: { label: "Other", color: "#64748b", icon: <WalletOutlined /> },
};

const SOURCE_CONFIG = {
  home_cash: { label: "Home Cash", color: "#10b981", icon: <WalletOutlined /> },
  bank_account: { label: "Bank Account", color: "#6366f1", icon: <BankOutlined /> },
};

const HomeExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs().startOf("month"), dayjs().endOf("month")]);
  const [form] = Form.useForm();

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange && dateRange[0]) params.append("startDate", dateRange[0].format("YYYY-MM-DD"));
      if (dateRange && dateRange[1]) params.append("endDate", dateRange[1].format("YYYY-MM-DD"));
      if (filterCategory) params.append("category", filterCategory);

      const data = await api.get(`/home-expenses?${params.toString()}`);
      setExpenses(data);
    } catch (err) {
      message.error("Failed to fetch home expenses");
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date: values.date.toISOString(),
      };

      if (editingExpense) {
        await api.put(`/home-expenses/${editingExpense._id}`, payload);
        message.success("Expense updated");
      } else {
        await api.post("/home-expenses", payload);
        message.success("Expense added");
      }

      setModalVisible(false);
      setEditingExpense(null);
      form.resetFields();
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      if (err.errorFields) return; // form validation
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
    form.setFieldsValue({ date: dayjs(), paymentSource: "home_cash", category: "other" });
    setModalVisible(true);
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      width: 110,
      render: (d) => dayjs(d).format("DD MMM YYYY"),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
    },
    {
      title: "Category",
      dataIndex: "category",
      width: 160,
      render: (cat) => {
        const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
        return <Tag icon={cfg.icon} color={cfg.color}>{cfg.label}</Tag>;
      },
      filters: Object.entries(CATEGORY_CONFIG).map(([key, val]) => ({ text: val.label, value: key })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: "Paid From",
      dataIndex: "paymentSource",
      width: 140,
      render: (src) => {
        const cfg = SOURCE_CONFIG[src] || SOURCE_CONFIG.home_cash;
        return <Tag icon={cfg.icon} color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      width: 130,
      align: "right",
      render: (amt) => <Text strong style={{ color: "#ef4444", fontSize: 15 }}>₹{Number(amt).toLocaleString("en-IN")}</Text>,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "",
      width: 90,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm title="Delete this expense?" onConfirm={() => handleDelete(record._id)} okText="Yes" cancelText="No">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div style={{ padding: "0 8px" }}>
      {/* HEADER */}
      <div className="page-header-container" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: "1.5rem" }}>
            <HomeOutlined style={{ marginRight: 10, color: "#8b5cf6" }} />
            Home Expenses
          </Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>Staff salaries, supplier payments, personal drawings — separate from daily operations.</Text>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }} className="header-actions">
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD MMM YYYY"
            style={{ borderRadius: 10, height: 45 }}
          />
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={openAddModal}
            style={{ borderRadius: 10, height: 45, padding: "0 24px" }}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="glass-card" style={{ borderRadius: 16, borderLeft: "4px solid #ef4444" }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Total Spent</Text>}
              value={totalAmount}
              prefix="₹"
              valueStyle={{ color: "#ef4444", fontWeight: 700, fontSize: 24 }}
            />
          </Card>
        </Col>
        {Object.entries(CATEGORY_CONFIG).slice(0, 3).map(([key, cfg]) => (
          <Col xs={24} sm={12} md={6} key={key}>
            <Card bordered={false} className="glass-card" style={{ borderRadius: 16, borderLeft: `4px solid ${cfg.color}` }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{cfg.label}</Text>}
                value={summary?.byCategory?.[key] || 0}
                prefix="₹"
                valueStyle={{ color: cfg.color, fontWeight: 700, fontSize: 20 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* TABLE */}
      <Card
        bordered={false}
        className="glass-card"
        style={{ borderRadius: 20 }}
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <Title level={4} style={{ margin: 0 }}>All Home Expenses</Title>
            <Text type="secondary">{expenses.length} entries</Text>
          </div>
        }
      >
        <div className="responsive-table-container">
          <Table
            dataSource={expenses}
            columns={columns}
            loading={loading}
            rowKey="_id"
            size="middle"
            pagination={{ pageSize: 15, showSizeChanger: true }}
            locale={{ emptyText: <Empty description="No home expenses recorded" /> }}
          />
        </div>
      </Card>

      {/* ADD/EDIT MODAL */}
      <Modal
        title={editingExpense ? "Edit Home Expense" : "Add Home Expense"}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingExpense(null); }}
        onOk={handleSubmit}
        okText={editingExpense ? "Update" : "Add"}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true, message: "Enter amount" }]}>
                <InputNumber style={{ width: "100%" }} min={0} prefix="₹" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: "Enter description" }]}>
            <Input placeholder="e.g., Staff salary for July, Kaju supplier payment" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select placeholder="Select category">
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <Option key={key} value={key}>{cfg.icon} {cfg.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paymentSource" label="Paid From" rules={[{ required: true }]}>
                <Select placeholder="Select source">
                  {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                    <Option key={key} value={key}>{cfg.icon} {cfg.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes (Optional)">
            <Input.TextArea rows={2} placeholder="Any additional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HomeExpensesPage;
