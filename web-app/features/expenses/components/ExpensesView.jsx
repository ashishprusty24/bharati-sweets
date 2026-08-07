"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card, Table, Button, Input, Select, DatePicker, Modal, Form, InputNumber,
  message, Typography, Space, Tag, Popconfirm, Statistic, Row, Col
} from "antd";
import { SearchOutlined, PlusOutlined, DeleteOutlined, EditOutlined, DollarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { formatCurrency } from "../../../utils/currency";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const EXPENSE_CATEGORIES = [
  { value: "ingredients", label: "Ingredients", color: "#1890ff" },
  { value: "packaging", label: "Packaging", color: "#52c41a" },
  { value: "utilities", label: "Utilities", color: "#faad14" },
  { value: "rent", label: "Rent", color: "#f5222d" },
  { value: "salaries", label: "Salaries", color: "#722ed1" },
  { value: "marketing", label: "Marketing", color: "#13c2c2" },
  { value: "equipment", label: "Equipment", color: "#eb2f96" },
  { value: "transportation", label: "Transportation", color: "#a0d911" },
  { value: "other", label: "Other Expenses", color: "#bfbfbf" },
];

export default function ExpensesView() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form] = Form.useForm();

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(data || []);
    } catch (err) {
      message.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const stats = useMemo(() => {
    if (!expenses) return { total: 0, monthly: 0, weekly: 0 };
    const total = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const thirtyDaysAgo = dayjs().subtract(30, "days").startOf("day");
    const sevenDaysAgo = dayjs().subtract(7, "days").startOf("day");

    const monthly = expenses
      .filter((exp) => dayjs(exp.date).isAfter(thirtyDaysAgo))
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const weekly = expenses
      .filter((exp) => dayjs(exp.date).isAfter(sevenDaysAgo))
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    return { total, monthly, weekly };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch =
        exp.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        exp.notes?.toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory = categoryFilter === "all" || exp.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchText, categoryFilter]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, date: values.date.format("YYYY-MM-DD") };

      if (editingExpense) {
        await fetch(`/api/expenses/${editingExpense._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        message.success("Expense updated");
      } else {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        message.success("Expense created");
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

  const openAddEditModal = (expense = null) => {
    setEditingExpense(expense);
    form.resetFields();
    if (expense) {
      form.setFieldsValue({ ...expense, date: dayjs(expense.date) });
    } else {
      form.setFieldsValue({ date: dayjs(), paymentMethod: "cash", category: "other" });
    }
    setModalVisible(true);
  };

  const columns = [
    { title: "Description", dataIndex: "description", render: (t) => <Text strong>{t}</Text> },
    { title: "Category", dataIndex: "category", render: (c) => <Tag color="blue">{c}</Tag> },
    { title: "Payment", dataIndex: "paymentMethod", render: (pm) => <Tag>{pm?.toUpperCase()}</Tag> },
    { title: "Amount", dataIndex: "amount", align: "right", render: (amt) => <Text strong style={{ color: "#ef4444" }}>₹{formatCurrency(amt)}</Text> },
    { title: "Date", dataIndex: "date", render: (d) => dayjs(d).format("YYYY-MM-DD") },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openAddEditModal(record)} />
          <Popconfirm title="Delete expense?" onConfirm={() => handleDelete(record._id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "0 8px" }}>
      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ background: "#f0f5ff", borderRadius: 16 }}>
            <Statistic title="Total Expenses" value={stats.total} prefix="₹" valueStyle={{ color: "#3f8600", fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ background: "#fff7e6", borderRadius: 16 }}>
            <Statistic title="Monthly Expenses" value={stats.monthly} prefix="₹" valueStyle={{ color: "#faad14", fontWeight: 700 }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ background: "#fff1f0", borderRadius: 16 }}>
            <Statistic title="Weekly Expenses" value={stats.weekly} prefix="₹" valueStyle={{ color: "#cf1322", fontWeight: 700 }} />
          </Card>
        </Col>
      </Row>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Operational Expenses</Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => openAddEditModal()}>
          Add Expense
        </Button>
      </div>

      <Card variant="borderless" style={{ borderRadius: 20 }}>
        <Space style={{ marginBottom: 20, flexWrap: "wrap" }}>
          <Input placeholder="Search expenses..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 250 }} />
          <Select value={categoryFilter} onChange={setCategoryFilter} style={{ width: 180 }}>
            <Option value="all">All Categories</Option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <Option key={cat.value} value={cat.value}>{cat.label}</Option>
            ))}
          </Select>
        </Space>

        <Table dataSource={filteredExpenses} columns={columns} rowKey="_id" loading={loading} />
      </Card>

      <Modal title={editingExpense ? "Edit Expense" : "Add Expense"} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleSave} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input placeholder="e.g., Packaging boxes, Milk delivery" />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select>
              {EXPENSE_CATEGORIES.map((cat) => (
                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}>
            <Select>
              <Option value="cash">Cash</Option>
              <Option value="card">Card</Option>
              <Option value="bank_transfer">Bank Transfer</Option>
              <Option value="upi">UPI</Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} prefix="₹" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
