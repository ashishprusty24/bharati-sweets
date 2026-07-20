import React, { useState, useEffect, useMemo } from "react";
import { Card, Row, Col, DatePicker, Table, Button, InputNumber, Input, Select, message, Typography, Space, Divider, Tag } from "antd";
import { SaveOutlined, PlusOutlined, DeleteOutlined, WalletOutlined, BankOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";

const { Title, Text } = Typography;
const { Option } = Select;

const DailyLedgerPage = () => {
  const [date, setDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState({
    openingBalance: 0,
    openingBankBalance: 0,
    cashSales: 0,
    digitalSales: 0,
    otherIncome: 0,
    items: [],
  });

  const fetchLedger = async (targetDate) => {
    setLoading(true);
    try {
      const data = await api.get(`/ledger/${targetDate.format("YYYY-MM-DD")}`);
      setLedgerData({
        ...data,
        openingBankBalance: data.openingBankBalance || 0,
        items: data.items || []
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
      await api.post(`/ledger/${date.format("YYYY-MM-DD")}`, ledgerData);
      message.success("Ledger saved successfully");
      fetchLedger(date);
    } catch (error) {
      console.error(error);
      message.error("Failed to save ledger");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setLedgerData({
      ...ledgerData,
      items: [...ledgerData.items, { description: "", amount: 0, type: "expense", paymentMode: "cash" }],
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
    const items = ledgerData.items || [];
    
    // Cash totals
    const cashExpenses = items.filter(i => i.type === "expense" && i.paymentMode !== "bank").reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const cashIncome = items.filter(i => i.type === "income" && i.paymentMode !== "bank").reduce((s, i) => s + (Number(i.amount) || 0), 0);
    
    // Bank totals
    const bankExpenses = items.filter(i => i.type === "expense" && i.paymentMode === "bank").reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const bankIncome = items.filter(i => i.type === "income" && i.paymentMode === "bank").reduce((s, i) => s + (Number(i.amount) || 0), 0);
    
    // Balances
    const closingCash = Number(ledgerData.openingBalance || 0) + Number(ledgerData.cashSales || 0) + Number(ledgerData.otherIncome || 0) + cashIncome - cashExpenses;
    const closingBank = Number(ledgerData.openingBankBalance || 0) + Number(ledgerData.digitalSales || 0) + bankIncome - bankExpenses;

    const cashSavings = closingCash - Number(ledgerData.openingBalance || 0);
    const bankSavings = closingBank - Number(ledgerData.openingBankBalance || 0);
    
    const totalSavings = cashSavings + bankSavings;

    return { 
      cashExpenses, bankExpenses, 
      closingCash, closingBank, 
      cashSavings, bankSavings, totalSavings 
    };
  }, [ledgerData]);

  const columns = [
    {
      title: "Description",
      dataIndex: "description",
      render: (text, _, index) => (
        <Input 
          value={text} 
          onChange={(e) => updateItem(index, "description", e.target.value)} 
          placeholder="e.g., Milk, Gas, Rent"
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
      title: "Payment Mode",
      dataIndex: "paymentMode",
      width: 120,
      render: (mode, _, index) => (
        <Select value={mode || "cash"} onChange={(value) => updateItem(index, "paymentMode", value)} style={{ width: "100%" }}>
          <Option value="cash">💵 Cash</Option>
          <Option value="bank">🏦 Bank</Option>
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
      <div className="page-header-container" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: "1.5rem" }}>Daily Digital Ledger</Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>Track cash flow and bank transactions separately.</Text>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }} className="header-actions">
          <DatePicker 
            value={date} 
            onChange={setDate} 
            allowClear={false}
            format="MMMM D, YYYY"
            style={{ width: 220, height: 45, borderRadius: 10 }}
          />
          <Button 
            type="primary" 
            size="large"
            icon={<SaveOutlined />} 
            onClick={handleSave} 
            loading={loading}
            style={{ borderRadius: 10, height: 45, padding: "0 24px" }}
          >
            Save Ledger
          </Button>
        </div>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {/* CASH LEDGER SUMMARY */}
        <Col xs={24} lg={12}>
          <Card 
            title={<Space><WalletOutlined style={{ color: "#3b82f6" }}/> <span style={{ fontWeight: 700 }}>Cash Ledger (Shop Drawer)</span></Space>}
            bordered={false} 
            className="glass-card" 
            style={{ borderRadius: 16, height: "100%" }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Opening Cash</Text>
                <InputNumber 
                  value={ledgerData.openingBalance} 
                  onChange={(v) => setLedgerData({...ledgerData, openingBalance: v})}
                  style={{ width: "100%", fontWeight: 700, fontSize: 18, backgroundColor: "#f8fafc", borderRadius: 8 }}
                  prefix="₹"
                />
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#10b981" }}>+ Cash Sales</Text>
                <div style={{ padding: "4px 11px", fontWeight: 700, fontSize: 18, color: "#10b981" }}>₹{ledgerData.cashSales}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#f59e0b" }}>+ Other Income (Cash)</Text>
                <InputNumber 
                  value={ledgerData.otherIncome} 
                  onChange={(v) => setLedgerData({...ledgerData, otherIncome: v})}
                  style={{ width: "100%", fontWeight: 700, fontSize: 18, color: "#f59e0b", backgroundColor: "#fffbeb", borderRadius: 8 }}
                  prefix="₹"
                />
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#ef4444" }}>- Cash Expenses</Text>
                <div style={{ padding: "4px 11px", fontWeight: 700, fontSize: 18, color: "#ef4444" }}>₹{totals.cashExpenses}</div>
              </Col>
            </Row>
            <Divider style={{ margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Closing Cash Balance</Text>
                <Title level={3} style={{ margin: 0, color: "var(--primary-color)" }}>₹{totals.closingCash}</Title>
              </div>
              <div style={{ textAlign: "right" }}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Cash Profit</Text>
                <Title level={4} style={{ margin: 0, color: totals.cashSavings >= 0 ? "#10b981" : "#ef4444" }}>₹{totals.cashSavings}</Title>
              </div>
            </div>
          </Card>
        </Col>

        {/* BANK LEDGER SUMMARY */}
        <Col xs={24} lg={12}>
          <Card 
            title={<Space><BankOutlined style={{ color: "#722ed1" }}/> <span style={{ fontWeight: 700 }}>Bank Ledger (Digital)</span></Space>}
            bordered={false} 
            className="glass-card" 
            style={{ borderRadius: 16, height: "100%" }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Opening Bank</Text>
                <InputNumber 
                  value={ledgerData.openingBankBalance} 
                  onChange={(v) => setLedgerData({...ledgerData, openingBankBalance: v})}
                  style={{ width: "100%", fontWeight: 700, fontSize: 18, backgroundColor: "#f8fafc", borderRadius: 8 }}
                  prefix="₹"
                />
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#10b981" }}>+ Digital Sales</Text>
                <div style={{ padding: "4px 11px", fontWeight: 700, fontSize: 18, color: "#10b981" }}>₹{ledgerData.digitalSales}</div>
              </Col>
              <Col span={12}>
                {/* Placeholder for future if they want Bank Other Income distinct */}
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#ef4444" }}>- Bank Expenses</Text>
                <div style={{ padding: "4px 11px", fontWeight: 700, fontSize: 18, color: "#ef4444" }}>₹{totals.bankExpenses}</div>
              </Col>
            </Row>
            <Divider style={{ margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Closing Bank Balance</Text>
                <Title level={3} style={{ margin: 0, color: "#722ed1" }}>₹{totals.closingBank}</Title>
              </div>
              <div style={{ textAlign: "right" }}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Bank Profit</Text>
                <Title level={4} style={{ margin: 0, color: totals.bankSavings >= 0 ? "#10b981" : "#ef4444" }}>₹{totals.bankSavings}</Title>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row style={{ marginBottom: 24 }}>
        <Col span={24}>
           <Card bordered={false} style={{ borderRadius: 16, background: "var(--primary-color)", color: "white" }}>
              <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <Title level={3} style={{ margin: 0, color: "white", fontSize: "1.2rem" }}>Total Daily Profit</Title>
                <Title level={2} style={{ margin: 0, color: "white", fontSize: "1.5rem", whiteSpace: "nowrap" }}>₹{totals.totalSavings}</Title>
              </div>
           </Card>
        </Col>
      </Row>

      <Card 
        bordered={false}
        className="glass-card ledger-details-card"
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <Title level={4} style={{ margin: 0 }}>Entry Details (Expenses & Extra Income)</Title>
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
