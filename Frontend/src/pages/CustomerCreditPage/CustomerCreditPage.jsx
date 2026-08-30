import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Tag,
  Typography,
  Space,
  Input,
  Modal,
  Form,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  message,
  Tooltip,
  Statistic,
  Badge,
} from "antd";
import {
  DollarOutlined,
  UserOutlined,
  SendOutlined,
  PlusOutlined,
  SearchOutlined,
  CalendarOutlined,
  PhoneOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";

const { Title, Text } = Typography;
const { Option } = Select;

const CustomerCreditPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ summary: {}, entries: [] });
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [addForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchBakkiData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/customer-credit/list");
      setData(res.data || { summary: {}, entries: [] });
    } catch (err) {
      console.error("Failed to load customer credit data:", err);
      message.error("Failed to load customer credit ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBakkiData();
  }, []);

  // Filter entries based on search & status
  const filteredEntries = (data.entries || []).filter((item) => {
    const matchesSearch =
      (item.customerName || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (item.phone || "").includes(searchText) ||
      (item.notes || "").toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle Add New Bakki Entry
  const handleAddSubmit = async (values) => {
    setSubmitting(true);
    try {
      await api.post("/customer-credit/create", {
        ...values,
        dueDate: values.dueDate ? values.dueDate.format("YYYY-MM-DD") : null,
      });
      message.success("Customer Bakki entry created successfully!");
      setIsAddModalOpen(false);
      addForm.resetFields();
      fetchBakkiData();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || "Failed to create credit entry");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Payment Submit
  const handlePaymentSubmit = async (values) => {
    if (!selectedEntry) return;
    setSubmitting(true);
    try {
      await api.post("/customer-credit/payment", {
        id: selectedEntry._id,
        source: selectedEntry.source,
        amount: values.amount,
        method: values.method || "cash",
        date: values.date ? values.date.format("YYYY-MM-DD") : new Date(),
      });
      message.success("Payment recorded successfully!");
      setIsPaymentModalOpen(false);
      paymentForm.resetFields();
      setSelectedEntry(null);
      fetchBakkiData();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Auto-Reminder setting
  const handleToggleReminder = async (record, checked) => {
    try {
      await api.put("/customer-credit/toggle-reminder", {
        id: record._id,
        source: record.source,
        enabled: checked,
      });
      message.success(`Auto-reminder ${checked ? "enabled" : "disabled"} for ${record.customerName}`);
      fetchBakkiData();
    } catch (err) {
      console.error(err);
      message.error("Failed to update auto-reminder setting");
    }
  };

  // Send Individual WhatsApp Reminder
  const handleSendReminder = async (record) => {
    try {
      await api.post("/customer-credit/send-reminder", {
        id: record._id,
        source: record.source,
      });
      message.success(`WhatsApp reminder sent to ${record.customerName}!`);
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || "Failed to send WhatsApp reminder");
    }
  };

  // Trigger Weekly Auto-Reminders for all pending Bakki
  const handleTriggerAutoReminders = async () => {
    Modal.confirm({
      title: "Trigger Weekly WhatsApp Auto-Reminders?",
      content: "This will automatically send WhatsApp payment due reminder messages to all customers with an outstanding Bakki balance.",
      okText: "Send All Reminders",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const res = await api.post("/customer-credit/trigger-auto-reminders");
          message.success(`Auto-reminders sent! Successfully dispatched ${res.data.sentCount} of ${res.data.total} WhatsApp messages.`);
          fetchBakkiData();
        } catch (err) {
          console.error(err);
          message.error("Failed to dispatch auto-reminders");
        }
      },
    });
  };

  const columns = [
    {
      title: "Customer",
      key: "customerName",
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 14, color: "#1e293b" }}>{record.customerName}</Text>
          <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <PhoneOutlined style={{ fontSize: 11 }} /> {record.phone || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 110,
      render: (_, record) => (
        <Tag
          color={record.status === "paid" ? "green" : record.status === "partial" ? "orange" : "red"}
          style={{ borderRadius: 6, fontWeight: 600 }}
        >
          {record.status === "paid" ? "✅ Paid" : record.status === "partial" ? "⏳ Partial" : "🔴 Pending"}
        </Tag>
      ),
    },
    {
      title: "Details & Notes",
      key: "notes",
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: 12, color: "#475569" }}>{record.notes}</Text>
          {record.dueDate && (
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              <CalendarOutlined /> Due: {dayjs(record.dueDate).format("DD MMM YYYY")}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 100,
      render: (val) => <Text style={{ fontWeight: 600 }}>₹{val?.toLocaleString()}</Text>,
    },
    {
      title: "Paid",
      dataIndex: "paidAmount",
      key: "paidAmount",
      width: 100,
      render: (val) => <Text style={{ color: "#10b981", fontWeight: 600 }}>₹{(val || 0).toLocaleString()}</Text>,
    },
    {
      title: "Bakki Balance",
      key: "balance",
      width: 120,
      render: (_, record) => (
        <Text strong style={{ color: "#ef4444", fontSize: 15 }}>
          ₹{record.balance?.toLocaleString()}
        </Text>
      ),
    },
    {
      title: "Auto Reminder",
      key: "autoReminder",
      width: 130,
      render: (_, record) => (
        <Tooltip title="Weekly auto-reminder ON/OFF">
          <Switch
            checked={record.autoReminderEnabled}
            onChange={(checked) => handleToggleReminder(record, checked)}
            checkedChildren="ON"
            unCheckedChildren="OFF"
            size="small"
          />
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<DollarOutlined />}
            style={{ background: "#10b981", borderColor: "#10b981", borderRadius: 6, fontWeight: 600 }}
            onClick={() => {
              setSelectedEntry(record);
              setIsPaymentModalOpen(true);
            }}
          >
            Pay Dues
          </Button>

          <Tooltip title="Send WhatsApp Reminder Now">
            <Button
              type="default"
              size="small"
              icon={<SendOutlined style={{ color: "#25D366" }} />}
              style={{ borderRadius: 6 }}
              onClick={() => handleSendReminder(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "16px 24px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#1e293b", fontWeight: 700 }}>
            Customer Credit (Bakki Ledger)
          </Title>
          <Text type="secondary">
            Manage customer pending dues, record payments, and send weekly WhatsApp payment reminders.
          </Text>
        </div>

        <Space wrap>
          <Button
            icon={<SyncOutlined />}
            onClick={fetchBakkiData}
            style={{ borderRadius: 8 }}
          >
            Refresh
          </Button>
          <Button
            type="default"
            icon={<BellOutlined style={{ color: "#25D366" }} />}
            onClick={handleTriggerAutoReminders}
            style={{ borderRadius: 8, borderColor: "#25D366", color: "#15803d", fontWeight: 600 }}
          >
            Trigger Weekly Reminders
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalOpen(true)}
            style={{ background: "#4a151b", borderColor: "#4a151b", borderRadius: 8, fontWeight: 600 }}
          >
            New Bakki Entry
          </Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, borderColor: "#fecaca", background: "#fff5f5" }}>
            <Statistic
              title={<Text strong style={{ color: "#991b1b" }}>💳 Total Pending Bakki Dues</Text>}
              value={data.summary?.totalDues || 0}
              prefix="₹"
              valueStyle={{ color: "#dc2626", fontWeight: 800, fontSize: 28 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8}>
          <Card style={{ borderRadius: 12, borderColor: "#fed7aa", background: "#fff7ed" }}>
            <Statistic
              title={<Text strong style={{ color: "#9a3412" }}>👥 Customers with Pending Dues</Text>}
              value={data.summary?.totalCustomers || 0}
              valueStyle={{ color: "#ea580c", fontWeight: 800, fontSize: 28 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8}>
          <Card style={{ borderRadius: 12, borderColor: "#bbf7d0", background: "#f0fdf4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Text strong style={{ color: "#166534" }}>📲 Weekly Auto-Reminders</Text>
                <div style={{ marginTop: 6 }}>
                  <Tag color="green" style={{ borderRadius: 6, fontWeight: 700 }}>
                    ACTIVE (Every Sunday)
                  </Tag>
                </div>
              </div>
              <ClockCircleOutlined style={{ fontSize: 32, color: "#16a34a", opacity: 0.8 }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters & Table */}
      <Card style={{ borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by customer name, phone, or notes..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%", borderRadius: 8 }}
            >
              <Option value="all">All Payment Status</Option>
              <Option value="pending">Pending Dues Only</Option>
              <Option value="partial">Partially Paid</Option>
              <Option value="paid">Fully Settled</Option>
            </Select>
          </Col>
        </Row>

        <Table
          dataSource={filteredEntries}
          columns={columns}
          rowKey={(r) => r._id}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* MODAL: ADD NEW BAKKI ENTRY */}
      <Modal
        title="Add Customer Credit (Bakki Entry)"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddSubmit}>
          <Form.Item
            name="customerName"
            label="Customer Name"
            rules={[{ required: true, message: "Enter customer name" }]}
          >
            <Input placeholder="e.g. Ramesh Sharma" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="WhatsApp / Phone Number"
            rules={[{ required: true, message: "Enter WhatsApp phone number" }]}
          >
            <Input placeholder="e.g. 9876543210" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalAmount"
                label="Total Credit Amount (₹)"
                rules={[{ required: true, message: "Enter total credit amount" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} placeholder="1000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paidAmount" label="Advance / Initial Paid (₹)">
                <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="dueDate" label="Expected Payment Due Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="notes" label="Notes / Description">
            <Input.TextArea rows={2} placeholder="e.g. 5kg Sweets box purchased on credit" />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} style={{ background: "#4a151b", borderColor: "#4a151b" }}>
              Save Bakki Entry
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL: RECORD BAKKI PAYMENT */}
      <Modal
        title={`Record Payment for ${selectedEntry?.customerName || ""}`}
        open={isPaymentModalOpen}
        onCancel={() => {
          setIsPaymentModalOpen(false);
          setSelectedEntry(null);
        }}
        footer={null}
        destroyOnClose
      >
        {selectedEntry && (
          <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <Text type="secondary">Current Outstanding Bakki Balance:</Text>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#ef4444" }}>
              ₹{selectedEntry.balance?.toLocaleString()}
            </div>
          </div>
        )}

        <Form form={paymentForm} layout="vertical" onFinish={handlePaymentSubmit}>
          <Form.Item
            name="amount"
            label="Payment Amount Received (₹)"
            rules={[{ required: true, message: "Enter payment amount" }]}
          >
            <InputNumber
              min={1}
              max={selectedEntry?.balance || 999999}
              style={{ width: "100%" }}
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item name="method" label="Payment Method" initialValue="cash">
            <Select>
              <Option value="cash">💵 Cash</Option>
              <Option value="upi">📱 UPI / QR Code</Option>
              <Option value="bank">🏦 Bank Transfer</Option>
            </Select>
          </Form.Item>

          <Form.Item name="date" label="Payment Date">
            <DatePicker style={{ width: "100%" }} defaultValue={dayjs()} />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} style={{ background: "#10b981", borderColor: "#10b981" }}>
              Save & Update Ledger
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerCreditPage;
