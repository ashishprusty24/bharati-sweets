"use client";

import React, { useState, useEffect } from "react";
import {
  Card, Row, Col, Table, Button, InputNumber, Input, Select, DatePicker,
  Modal, Form, message, Typography, Space, Tag, Statistic, Empty, Popconfirm,
  Tabs, Badge, Divider, Progress
} from "antd";
import {
  PlusOutlined, DeleteOutlined, CreditCardOutlined, DollarOutlined,
  WalletOutlined, BankOutlined, CheckCircleOutlined, ClockCircleOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const CARD_TYPE_COLORS = {
  visa: "#1a1f71",
  mastercard: "#eb001b",
  rupay: "#00796b",
  amex: "#006fcf",
};

const TXN_CATEGORY_CONFIG = {
  fuel: { label: "Fuel", color: "#f59e0b" },
  shopping: { label: "Shopping", color: "#ec4899" },
  vendor_payment: { label: "Vendor Payment", color: "#3b82f6" },
  personal: { label: "Personal", color: "#8b5cf6" },
  business: { label: "Business", color: "#10b981" },
  other: { label: "Other", color: "#64748b" },
};

export default function CreditCardView() {
  const [cards, setCards] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [cardForm] = Form.useForm();

  const [txnModalVisible, setTxnModalVisible] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [txnForm] = Form.useForm();

  const [billModalVisible, setBillModalVisible] = useState(false);
  const [billCardId, setBillCardId] = useState(null);
  const [billForm] = Form.useForm();

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/credit-cards");
      const data = await res.json();
      setCards(data || []);
    } catch (err) {
      message.error("Failed to fetch credit cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleCardSubmit = async () => {
    try {
      const values = await cardForm.validateFields();
      if (editingCard) {
        await fetch(`/api/credit-cards/${editingCard._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        message.success("Card updated");
      } else {
        await fetch("/api/credit-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        message.success("Card added");
      }
      setCardModalVisible(false);
      setEditingCard(null);
      cardForm.resetFields();
      fetchCards();
    } catch (err) {
      message.error("Failed to save card");
    }
  };

  const handleDeleteCard = async (id) => {
    try {
      await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
      message.success("Card deleted");
      fetchCards();
    } catch (err) {
      message.error("Failed to delete card");
    }
  };

  const handleTxnSubmit = async () => {
    try {
      const values = await txnForm.validateFields();
      const payload = { ...values, date: values.date.toISOString() };
      await fetch(`/api/credit-cards/${selectedCardId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      message.success("Transaction added");
      setTxnModalVisible(false);
      txnForm.resetFields();
      fetchCards();
    } catch (err) {
      message.error("Failed to add transaction");
    }
  };

  const handleBillSubmit = async () => {
    try {
      const values = await billForm.validateFields();
      const payload = { ...values, date: values.date.toISOString() };
      await fetch(`/api/credit-cards/${billCardId}/bill-payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      message.success("Bill payment recorded");
      setBillModalVisible(false);
      billForm.resetFields();
      fetchCards();
    } catch (err) {
      message.error("Failed to record bill payment");
    }
  };

  const openAddTxnModal = (cardId) => {
    setSelectedCardId(cardId);
    txnForm.resetFields();
    txnForm.setFieldsValue({ date: dayjs(), category: "other" });
    setTxnModalVisible(true);
  };

  const openBillModal = (cardId) => {
    setBillCardId(cardId);
    billForm.resetFields();
    billForm.setFieldsValue({ date: dayjs(), paidFrom: "home_cash" });
    setBillModalVisible(true);
  };

  const totalOutstanding = cards.reduce((s, c) => s + (c.currentOutstanding || 0), 0);

  const renderOverview = () => (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless" className="glass-card" style={{ borderRadius: 16, borderLeft: "4px solid #ef4444" }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Total Outstanding</Text>}
              value={totalOutstanding}
              prefix="₹"
              valueStyle={{ color: "#ef4444", fontWeight: 700, fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless" className="glass-card" style={{ borderRadius: 16, borderLeft: "4px solid #3b82f6" }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Total Cards</Text>}
              value={cards.length}
              valueStyle={{ color: "#3b82f6", fontWeight: 700, fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless" className="glass-card" style={{ borderRadius: 16, borderLeft: "4px solid #10b981" }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Total Bills Paid</Text>}
              value={cards.reduce((s, c) => s + (c.billPayments?.reduce((p, b) => p + b.amount, 0) || 0), 0)}
              prefix="₹"
              valueStyle={{ color: "#10b981", fontWeight: 700, fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        {cards.length === 0 && (
          <Col span={24}>
            <Card variant="borderless" className="glass-card" style={{ borderRadius: 16, textAlign: "center", padding: "40px 0" }}>
              <Empty description="No credit cards added yet" />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCard(null); cardForm.resetFields(); cardForm.setFieldsValue({ cardType: "visa" }); setCardModalVisible(true); }} style={{ marginTop: 16, borderRadius: 8 }}>
                Add Your First Card
              </Button>
            </Card>
          </Col>
        )}
        {cards.map((card) => {
          const outstanding = card.currentOutstanding || 0;
          const limit = card.creditLimit || 1;
          const utilization = Math.min((outstanding / limit) * 100, 100);
          const unsettled = card.transactions?.filter((t) => !t.isSettled).length || 0;
          const cardColor = CARD_TYPE_COLORS[card.cardType] || "#1a1f71";

          return (
            <Col xs={24} sm={12} lg={8} key={card._id}>
              <Card
                variant="borderless"
                style={{
                  borderRadius: 20,
                  background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 60%, ${cardColor}aa 100%)`,
                  color: "white",
                  minHeight: 240,
                  position: "relative",
                  overflow: "hidden",
                }}
                bodyStyle={{ padding: "24px" }}
              >
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                        {card.cardType?.toUpperCase()}
                      </Text>
                      <Title level={4} style={{ margin: 0, color: "white", fontWeight: 700 }}>{card.cardName}</Title>
                    </div>
                    <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: 600, fontFamily: "monospace" }}>
                      •••• {card.last4Digits}
                    </Text>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 }}>Outstanding</Text>
                    <Title level={3} style={{ margin: 0, color: "white" }}>₹{outstanding.toLocaleString("en-IN")}</Title>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Limit: ₹{Number(card.creditLimit || 0).toLocaleString("en-IN")}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>{utilization.toFixed(0)}% used</Text>
                    </div>
                    <Progress percent={utilization} showInfo={false} strokeColor="#ffffff" trailColor="rgba(255,255,255,0.15)" size="small" />
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button size="small" type="primary" ghost style={{ borderColor: "rgba(255,255,255,0.4)", color: "white", borderRadius: 6, fontSize: 11 }}
                      onClick={() => openAddTxnModal(card._id)}>
                      + Transaction
                    </Button>
                    <Button size="small" type="primary" ghost style={{ borderColor: "rgba(255,255,255,0.4)", color: "white", borderRadius: 6, fontSize: 11 }}
                      onClick={() => openBillModal(card._id)}>
                      Pay Bill
                    </Button>
                    <Badge count={unsettled} size="small" offset={[-2, 0]}>
                      <Button size="small" type="primary" ghost style={{ borderColor: "rgba(255,255,255,0.4)", color: "white", borderRadius: 6, fontSize: 11 }}
                        onClick={() => setActiveTab(card._id)}>
                        Transactions
                      </Button>
                    </Badge>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </>
  );

  const renderCardDetail = (card) => {
    if (!card) return null;

    const txnColumns = [
      { title: "Date", dataIndex: "date", render: (d) => dayjs(d).format("DD MMM YY") },
      { title: "Description", dataIndex: "description" },
      {
        title: "Category",
        dataIndex: "category",
        render: (cat) => {
          const cfg = TXN_CATEGORY_CONFIG[cat] || TXN_CATEGORY_CONFIG.other;
          return <Tag color={cfg.color}>{cfg.label}</Tag>;
        },
      },
      { title: "Amount", dataIndex: "amount", align: "right", render: (amt) => <Text strong>₹{Number(amt).toLocaleString("en-IN")}</Text> },
    ];

    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {card.cardName} <Text type="secondary" style={{ fontFamily: "monospace" }}>•••• {card.last4Digits}</Text>
            </Title>
            <Text type="secondary">Outstanding: <Text strong style={{ color: "#ef4444" }}>₹{(card.currentOutstanding || 0).toLocaleString("en-IN")}</Text></Text>
          </div>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openAddTxnModal(card._id)} style={{ borderRadius: 8 }}>
              Add Transaction
            </Button>
            <Button icon={<DollarOutlined />} onClick={() => openBillModal(card._id)} style={{ borderRadius: 8 }}>
              Pay Bill
            </Button>
          </Space>
        </div>

        <Card variant="borderless" className="glass-card" style={{ borderRadius: 16, marginBottom: 20 }}
          title={<Title level={5} style={{ margin: 0 }}>Transactions ({card.transactions?.length || 0})</Title>}>
          <Table dataSource={card.transactions || []} columns={txnColumns} rowKey="_id" size="small" pagination={{ pageSize: 10 }} />
        </Card>
      </>
    );
  };

  const tabItems = [
    {
      key: "overview",
      label: <Space><CreditCardOutlined /> Overview</Space>,
      children: renderOverview(),
    },
    ...cards.map((card) => ({
      key: card._id,
      label: card.cardName,
      children: renderCardDetail(card),
    })),
  ];

  return (
    <div style={{ padding: "0 8px" }}>
      <div className="page-header-container" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: "1.5rem" }}>
            <CreditCardOutlined style={{ marginRight: 10, color: "#6366f1" }} />
            Credit Cards
          </Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>Track spending across all cards. Bill payments debit from Home/Bank, not daily sales.</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => { setEditingCard(null); cardForm.resetFields(); cardForm.setFieldsValue({ cardType: "visa" }); setCardModalVisible(true); }}
          style={{ borderRadius: 10, height: 45, padding: "0 24px" }}
        >
          Add Card
        </Button>
      </div>

      <Card variant="borderless" className="glass-card" style={{ borderRadius: 20 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal title={editingCard ? "Edit Credit Card" : "Add Credit Card"} open={cardModalVisible} onCancel={() => setCardModalVisible(false)} onOk={handleCardSubmit} destroyOnClose>
        <Form form={cardForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cardName" label="Card Name" rules={[{ required: true }]}>
                <Input placeholder="e.g., HDFC Regalia" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="last4Digits" label="Last 4 Digits" rules={[{ required: true }]}>
                <Input placeholder="e.g., 4521" maxLength={4} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cardType" label="Card Type" rules={[{ required: true }]}>
                <Select>
                  <Option value="visa">Visa</Option>
                  <Option value="mastercard">Mastercard</Option>
                  <Option value="rupay">RuPay</Option>
                  <Option value="amex">Amex</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="creditLimit" label="Credit Limit (₹)">
                <InputNumber style={{ width: "100%" }} min={0} prefix="₹" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="Add Transaction" open={txnModalVisible} onCancel={() => setTxnModalVisible(false)} onOk={handleTxnSubmit} destroyOnClose>
        <Form form={txnForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}>
                <InputNumber style={{ width: "100%" }} min={0} prefix="₹" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input placeholder="e.g., Petrol at HP, Amazon order" />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select>
              {Object.entries(TXN_CATEGORY_CONFIG).map(([key, cfg]) => (
                <Option key={key} value={key}>{cfg.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Record Bill Payment" open={billModalVisible} onCancel={() => setBillModalVisible(false)} onOk={handleBillSubmit} destroyOnClose>
        <Form form={billForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Payment Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}>
                <InputNumber style={{ width: "100%" }} min={0} prefix="₹" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="paidFrom" label="Paid From" rules={[{ required: true }]}>
            <Select>
              <Option value="home_cash">🏠 Home Cash</Option>
              <Option value="bank_account">🏦 Bank Account</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
