import React, { useState, useEffect, useMemo } from "react";
import { Card, Row, Col, DatePicker, Table, Button, InputNumber, Input, Select, message, Typography, Space, Divider, Tag } from "antd";
import { SaveOutlined, PlusOutlined, DeleteOutlined, WalletOutlined, ShoppingCartOutlined, LogoutOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";

const { Title, Text } = Typography;
const { Option } = Select;

const DailyLedgerPage = () => {
  const [date, setDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState({
    openingBalance: 0,
    cashSales: 0,
    digitalSales: 0,
    otherIncome: 0,
    items: [],
  });

  const fetchLedger = async (targetDate) => {
    setLoading(true);
    try {
      const data = await api.get(`/ledger/${targetDate.format("YYYY-MM-DD")}`);
      setLedgerData(data);
    } catch (error) {
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
      message.error("Failed to save ledger");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setLedgerData({
      ...ledgerData,
      items: [...ledgerData.items, { description: "", amount: 0, type: "expense" }],
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

  const totals = useMemo(() => {
    const totalExpenses = ledgerData.items
      .filter((i) => i.type === "expense")
      .reduce((s, i) => s + (i.amount || 0), 0);
    const totalIncome = ledgerData.items
      .filter((i) => i.type === "income")
      .reduce((s, i) => s + (i.amount || 0), 0);
    
    const closingBalance = 
      Number(ledgerData.openingBalance || 0) + 
      Number(ledgerData.cashSales || 0) + 
      Number(ledgerData.otherIncome || 0) + 
      totalIncome - 
      totalExpenses;

    return { totalExpenses, totalIncome, closingBalance };
  }, [ledgerData]);

  const columns = [
    {
      title: "Description",
      dataIndex: "description",
      render: (text, _, index) => (
        <Input 
          value={text} 
          onChange={(e) => updateItem(index, "description", e.target.value)} 
          placeholder="e.g., Milk, Gas, Repairs"
        />
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      width: 120,
      render: (type, _, index) => (
        <Select value={type} onChange={(value) => updateItem(index, "type", value)} style={{ width: "100%" }}>
          <Option value="expense">Expense</Option>
          <Option value="income">Income</Option>
        </Select>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      width: 150,
      render: (amount, _, index) => (
        <InputNumber 
          value={amount} 
          onChange={(value) => updateItem(index, "amount", value)} 
          style={{ width: "100%" }}
          prefix="₹"
        />
      ),
    },
    {
      title: "",
      width: 50,
      render: (_, __, index) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} />
      ),
    },
  ];

  return (
    <div style={{ padding: "0 8px" }}>
      <div className="page-header-container">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Daily Digital Ledger</Title>
          <Text type="secondary">Digital register for tracking daily cash flow and inventory petty cash.</Text>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, width: "auto" }} className="header-actions">
          <DatePicker 
            value={date} 
            onChange={setDate} 
            allowClear={false}
            format="MMMM D, YYYY"
            style={{ width: "100%", maxWidth: 220, height: 45, borderRadius: 10 }}
          />
          <Button 
            type="primary" 
            size="large"
            icon={<SaveOutlined />} 
            onClick={handleSave} 
            loading={loading}
            style={{ borderRadius: 10, height: 45, padding: "0 24px", flex: 1 }}
          >
            Save Ledger
          </Button>
        </div>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={12} lg={4}>
          <Card bordered={false} className="glass-card" style={{ borderRadius: 16, height: "100%" }} bodyStyle={{ padding: "16px 12px" }}>
            <Text type="secondary" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Opening</Text>
            <div style={{ marginTop: 4 }}>
              <InputNumber 
                value={ledgerData.openingBalance} 
                onChange={(v) => setLedgerData({...ledgerData, openingBalance: v})}
                style={{ width: "100%", fontWeight: 700, fontSize: 16 }}
                bordered={false}
                prefix="₹"
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={4}>
          <Card bordered={false} className="glass-card" style={{ borderRadius: 16, borderLeft: "4px solid #3b82f6", height: "100%" }} bodyStyle={{ padding: "16px 12px" }}>
            <Text style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#3b82f6" }}>Cash Sales</Text>
            <div style={{ marginTop: 4 }}>
              <InputNumber 
                value={ledgerData.cashSales} 
                onChange={(v) => setLedgerData({...ledgerData, cashSales: v})}
                style={{ width: "100%", fontWeight: 700, fontSize: 16 }}
                bordered={false}
                prefix="₹"
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={4}>
          <Card bordered={false} className="glass-card" style={{ borderRadius: 16, borderLeft: "4px solid #10b981", height: "100%" }} bodyStyle={{ padding: "16px 12px" }}>
            <Text style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#10b981" }}>Digital (P/P)</Text>
            <div style={{ marginTop: 4 }}>
              <InputNumber 
                value={ledgerData.digitalSales} 
                onChange={(v) => setLedgerData({...ledgerData, digitalSales: v})}
                style={{ width: "100%", fontWeight: 700, fontSize: 16 }}
                bordered={false}
                prefix="₹"
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={4}>
          <Card bordered={false} className="glass-card" style={{ borderRadius: 16, borderLeft: "4px solid #f59e0b", height: "100%" }} bodyStyle={{ padding: "16px 12px" }}>
            <Text style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#f59e0b" }}>Other Income</Text>
            <div style={{ marginTop: 4 }}>
              <InputNumber 
                value={ledgerData.otherIncome} 
                onChange={(v) => setLedgerData({...ledgerData, otherIncome: v})}
                style={{ width: "100%", fontWeight: 700, fontSize: 16 }}
                bordered={false}
                prefix="₹"
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={4}>
          <Card bordered={false} className="glass-card" style={{ borderRadius: 16, borderLeft: "4px solid #ef4444", height: "100%" }} bodyStyle={{ padding: "16px 12px" }}>
            <Text style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#ef4444" }}>Expenses</Text>
            <Title level={4} style={{ margin: "4px 0 0 0", color: "#ef4444", fontWeight: 700, fontSize: 18 }}>₹{totals.totalExpenses}</Title>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={4}>
          <Card bordered={false} style={{ borderRadius: 16, background: "var(--primary-color)", color: "white", height: "100%" }} bodyStyle={{ padding: "16px 12px" }}>
            <Text style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>Closing Balance</Text>
            <Title level={4} style={{ margin: "4px 0 0 0", color: "white", fontWeight: 700, fontSize: 18 }}>₹{totals.closingBalance}</Title>
          </Card>
        </Col>
      </Row>

      <Card 
        bordered={false}
        className="glass-card ledger-details-card"
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <Title level={4} style={{ margin: 0 }}>Entry Details</Title>
            <Button 
              type="primary" 
              onClick={addItem} 
              icon={<PlusOutlined />}
              style={{ borderRadius: 8 }}
            >
              Add New Entry
            </Button>
          </div>
        }
        style={{ borderRadius: 20 }}
      >
        <div className="responsive-table-container">
          <Table 
            dataSource={ledgerData.items} 
            columns={columns} 
            pagination={false}
            rowKey={(_, index) => index}
            size="middle"
          />
        </div>
      </Card>
    </div>
  );
};

export default DailyLedgerPage;
