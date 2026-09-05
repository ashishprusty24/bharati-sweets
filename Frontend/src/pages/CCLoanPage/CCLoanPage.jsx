import React, { useState, useEffect } from "react";
import {
  Card, Row, Col, Table, Button, InputNumber, Input, Select, DatePicker,
  Modal, Form, message, Typography, Space, Tag, Statistic, Empty, Popconfirm,
  Tabs, Badge, Progress, Grid
} from "antd";
import {
  PlusOutlined, DeleteOutlined, BankOutlined, DollarOutlined,
  WalletOutlined, CheckCircleOutlined, ClockCircleOutlined,
  EditOutlined, ArrowDownOutlined, ArrowUpOutlined,
  FundOutlined, PercentageOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const BANK_COLORS = {
  SBI: "#1a237e",
  HDFC: "#004d8c",
  ICICI: "#f47920",
  Axis: "#800020",
  PNB: "#5c2d91",
  BOB: "#f26522",
  Kotak: "#ed1c24",
  default: "#0d7377",
};

const getBankColor = (bankName = "") => {
  const key = Object.keys(BANK_COLORS).find((k) =>
    bankName.toLowerCase().includes(k.toLowerCase())
  );
  return BANK_COLORS[key] || BANK_COLORS.default;
};

const CCLoanPage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Account Modal
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm] = Form.useForm();

  // Withdrawal Modal
  const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [withdrawalForm] = Form.useForm();

  // Repayment Modal
  const [repaymentModalVisible, setRepaymentModalVisible] = useState(false);
  const [repaymentAccountId, setRepaymentAccountId] = useState(null);
  const [repaymentForm] = Form.useForm();

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await api.get("/cc-loans");
      setAccounts(data || []);
    } catch (err) {
      message.error("Failed to fetch CC Loan accounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await api.get("/cc-loans/summary");
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch CC Loan summary", err);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchSummary();
  }, []);

  // --- Account CRUD ---
  const handleAccountSubmit = async () => {
    try {
      const values = await accountForm.validateFields();
      if (values.sanctionDate) values.sanctionDate = values.sanctionDate.format("YYYY-MM-DD");
      if (editingAccount) {
        await api.put(`/cc-loans/${editingAccount._id}`, values);
        message.success("Account updated");
      } else {
        await api.post("/cc-loans", values);
        message.success("CC Loan account added");
      }
      setAccountModalVisible(false);
      setEditingAccount(null);
      accountForm.resetFields();
      fetchAccounts();
      fetchSummary();
    } catch (err) {
      if (err.errorFields) return;
      message.error("Failed to save account");
    }
  };

  const handleDeleteAccount = async (id) => {
    try {
      await api.delete(`/cc-loans/${id}`);
      message.success("Account deleted");
      fetchAccounts();
      fetchSummary();
    } catch (err) {
      message.error("Failed to delete account");
    }
  };

  // --- Withdrawal ---
  const handleWithdrawalSubmit = async () => {
    try {
      const values = await withdrawalForm.validateFields();
      const payload = { ...values, date: values.date.format("YYYY-MM-DD") };
      await api.post(`/cc-loans/${selectedAccountId}/withdrawals`, payload);
      message.success("Withdrawal recorded & synced to Expenses");
      setWithdrawalModalVisible(false);
      withdrawalForm.resetFields();
      fetchAccounts();
      fetchSummary();
    } catch (err) {
      if (err.errorFields) return;
      message.error("Failed to add withdrawal");
    }
  };

  const handleDeleteWithdrawal = async (accountId, wId) => {
    try {
      await api.delete(`/cc-loans/${accountId}/withdrawals/${wId}`);
      message.success("Withdrawal deleted");
      fetchAccounts();
      fetchSummary();
    } catch (err) {
      message.error("Failed to delete withdrawal");
    }
  };

  // --- Repayment ---
  const handleRepaymentSubmit = async () => {
    try {
      const values = await repaymentForm.validateFields();
      const payload = { ...values, date: values.date.format("YYYY-MM-DD") };
      await api.post(`/cc-loans/${repaymentAccountId}/repayments`, payload);
      message.success("Repayment recorded & synced to Expenses");
      setRepaymentModalVisible(false);
      repaymentForm.resetFields();
      fetchAccounts();
      fetchSummary();
    } catch (err) {
      if (err.errorFields) return;
      message.error("Failed to record repayment");
    }
  };

  const openWithdrawalModal = (accountId) => {
    setSelectedAccountId(accountId);
    withdrawalForm.resetFields();
    withdrawalForm.setFieldsValue({ date: dayjs() });
    setWithdrawalModalVisible(true);
  };

  const openRepaymentModal = (accountId) => {
    setRepaymentAccountId(accountId);
    repaymentForm.resetFields();
    repaymentForm.setFieldsValue({ date: dayjs(), paidFrom: "bank_account" });
    setRepaymentModalVisible(true);
  };

  // --- OVERVIEW TAB ---
  const renderOverview = () => (
    <>
      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} style={{ borderRadius: 20, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Sanctioned Limit</Text>
              <BankOutlined style={{ color: "#0d7377", fontSize: 16 }} />
            </div>
            <div style={{ marginTop: 4 }}>
              <Text strong style={{ color: "#0d7377", fontSize: 24, fontWeight: 800 }}>
                ₹{(summary?.totalLimit || 0).toLocaleString("en-IN")}
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>{accounts.length} account(s)</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} style={{ borderRadius: 20, background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #fecaca" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#dc2626" }}>Currently Utilized</Text>
              <ArrowDownOutlined style={{ color: "#dc2626", fontSize: 16 }} />
            </div>
            <div style={{ marginTop: 4 }}>
              <Text strong style={{ color: "#dc2626", fontSize: 24, fontWeight: 800 }}>
                ₹{(summary?.totalUtilized || 0).toLocaleString("en-IN")}
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>Outstanding balance</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} style={{ borderRadius: 20, background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #a7f3d0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#059669" }}>Available Limit</Text>
              <WalletOutlined style={{ color: "#059669", fontSize: 16 }} />
            </div>
            <div style={{ marginTop: 4 }}>
              <Text strong style={{ color: "#059669", fontSize: 24, fontWeight: 800 }}>
                ₹{(summary?.totalAvailable || 0).toLocaleString("en-IN")}
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>Can still withdraw</Text>
          </Card>
        </Col>
      </Row>

      {/* Account Cards */}
      <Row gutter={[20, 20]}>
        {accounts.length === 0 && (
          <Col span={24}>
            <Card bordered={false} style={{ borderRadius: 16, textAlign: "center", padding: "40px 0", background: "#fff" }}>
              <Empty description="No CC Loan accounts added yet" />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingAccount(null);
                  accountForm.resetFields();
                  accountForm.setFieldsValue({ sanctionedLimit: 2500000, sanctionDate: dayjs() });
                  setAccountModalVisible(true);
                }}
                style={{ marginTop: 16, borderRadius: 10, height: 42, background: "linear-gradient(135deg, #0d7377 0%, #14919b 100%)", border: "none" }}
              >
                Add Your First CC Loan Account
              </Button>
            </Card>
          </Col>
        )}
        {accounts.map((acc) => {
          const utilized = acc.currentUtilized || 0;
          const limit = acc.sanctionedLimit || 1;
          const utilization = Math.min((utilized / limit) * 100, 100);
          const bankColor = getBankColor(acc.bankName);
          const pendingWithdrawals = acc.withdrawals?.filter((w) => !w.isRepaid).length || 0;

          return (
            <Col xs={24} sm={12} lg={8} key={acc._id}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 20,
                  background: `linear-gradient(135deg, ${bankColor} 0%, ${bankColor}cc 60%, ${bankColor}99 100%)`,
                  color: "white",
                  minHeight: 280,
                  position: "relative",
                  overflow: "hidden",
                }}
                bodyStyle={{ padding: "24px" }}
              >
                {/* Decorative elements */}
                <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                <div style={{ position: "absolute", right: 40, bottom: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                <div style={{ position: "absolute", left: -20, bottom: 30, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

                <div style={{ position: "relative", zIndex: 1 }}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>
                        {acc.bankName} • CASH CREDIT
                      </Text>
                      <Title level={4} style={{ margin: 0, color: "white", fontWeight: 700 }}>{acc.accountName}</Title>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 600, fontFamily: "monospace" }}>
                        •••• {acc.accountNumber}
                      </Text>
                    </div>
                  </div>

                  {/* Utilized */}
                  <div style={{ marginBottom: 6 }}>
                    <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 }}>Utilized</Text>
                    <Title level={3} style={{ margin: 0, color: "white" }}>₹{utilized.toLocaleString("en-IN")}</Title>
                  </div>

                  {/* Available */}
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 }}>
                      Available: <span style={{ color: "#a7f3d0", fontWeight: 700 }}>₹{(acc.availableLimit || 0).toLocaleString("en-IN")}</span>
                    </Text>
                  </div>

                  {/* Utilization Bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Limit: ₹{Number(acc.sanctionedLimit || 0).toLocaleString("en-IN")}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>{utilization.toFixed(0)}% used</Text>
                    </div>
                    <Progress
                      percent={utilization}
                      showInfo={false}
                      strokeColor={utilization > 80 ? "#ef4444" : utilization > 50 ? "#f59e0b" : "#ffffff"}
                      trailColor="rgba(255,255,255,0.15)"
                      size="small"
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button size="small" type="primary" ghost style={{ borderColor: "rgba(255,255,255,0.4)", color: "white", borderRadius: 6, fontSize: 11 }}
                      onClick={() => {
                        setEditingAccount(acc);
                        accountForm.setFieldsValue({
                          accountName: acc.accountName,
                          bankName: acc.bankName,
                          accountNumber: acc.accountNumber,
                          sanctionedLimit: acc.sanctionedLimit,
                          interestRate: acc.interestRate,
                          sanctionDate: acc.sanctionDate ? dayjs(acc.sanctionDate) : null,
                        });
                        setAccountModalVisible(true);
                      }}>
                      <EditOutlined /> Edit
                    </Button>
                    <Button size="small" type="primary" ghost style={{ borderColor: "rgba(255,255,255,0.4)", color: "white", borderRadius: 6, fontSize: 11 }}
                      onClick={() => openWithdrawalModal(acc._id)}>
                      <ArrowDownOutlined /> Withdraw
                    </Button>
                    <Button size="small" type="primary" ghost style={{ borderColor: "rgba(255,255,255,0.4)", color: "white", borderRadius: 6, fontSize: 11 }}
                      onClick={() => openRepaymentModal(acc._id)}>
                      <ArrowUpOutlined /> Repay
                    </Button>
                    <Badge count={pendingWithdrawals} size="small" offset={[-2, 0]}>
                      <Button size="small" type="primary" ghost style={{ borderColor: "rgba(255,255,255,0.4)", color: "white", borderRadius: 6, fontSize: 11 }}
                        onClick={() => setActiveTab(acc._id)}>
                        <FundOutlined /> Details
                      </Button>
                    </Badge>
                    <Popconfirm title="Delete this CC Loan account?" description="This will remove all withdrawals & repayments too." onConfirm={() => handleDeleteAccount(acc._id)} okText="Delete" okButtonProps={{ danger: true }}>
                      <Button size="small" type="primary" ghost danger style={{ borderColor: "rgba(255,100,100,0.5)", borderRadius: 6, fontSize: 11 }}>
                        <DeleteOutlined /> Delete
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </>
  );

  // --- ACCOUNT DETAIL TAB ---
  const renderAccountDetail = (acc) => {
    if (!acc) return null;

    const withdrawalColumns = [
      {
        title: "Date",
        dataIndex: "date",
        width: 110,
        render: (d) => dayjs(d).format("DD MMM YY"),
        sorter: (a, b) => new Date(a.date) - new Date(b.date),
      },
      {
        title: "Description",
        dataIndex: "description",
        ellipsis: true,
      },
      {
        title: "Amount",
        dataIndex: "amount",
        width: 140,
        align: "right",
        render: (amt) => <Text strong style={{ color: "#dc2626", fontSize: 14 }}>₹{Number(amt).toLocaleString("en-IN")}</Text>,
        sorter: (a, b) => a.amount - b.amount,
      },
      {
        title: "Status",
        dataIndex: "isRepaid",
        width: 110,
        render: (repaid) => repaid
          ? <Tag icon={<CheckCircleOutlined />} color="success">Repaid</Tag>
          : <Tag icon={<ClockCircleOutlined />} color="error">Active</Tag>,
      },
      {
        title: "",
        width: 50,
        render: (_, record) => (
          <Popconfirm title="Delete withdrawal?" onConfirm={() => handleDeleteWithdrawal(acc._id, record._id)}>
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        ),
      },
    ];

    const repaymentColumns = [
      {
        title: "Date",
        dataIndex: "date",
        width: 130,
        render: (d) => dayjs(d).format("DD MMM YYYY"),
      },
      {
        title: "Repayment Amount",
        dataIndex: "amount",
        width: 180,
        render: (amt) => <Text strong style={{ color: "#059669", fontSize: 15 }}>₹{Number(amt).toLocaleString("en-IN")}</Text>,
      },
      {
        title: "Notes / Details",
        dataIndex: "notes",
        ellipsis: true,
        render: (n) => n || <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
      },
    ];

    const sortedWithdrawals = [...(acc.withdrawals || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    const sortedRepayments = [...(acc.repayments || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalWithdrawn = acc.withdrawals?.reduce((s, w) => s + (w.amount || 0), 0) || 0;
    const totalRepaid = acc.repayments?.reduce((s, r) => s + (r.amount || 0), 0) || 0;
    const totalInterest = acc.repayments?.reduce((s, r) => s + (r.interestAmount || 0), 0) || 0;

    return (
      <>
        {/* Account Header Stats */}
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={8}>
            <Card bordered={false} size="small" style={{ borderRadius: 14, borderLeft: "4px solid #0d7377", background: "#f0fdfa" }}>
              <Statistic title={<Text style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Sanctioned Limit</Text>}
                value={acc.sanctionedLimit || 0} prefix="₹" valueStyle={{ fontSize: 16, fontWeight: 700, color: "#0d7377" }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} size="small" style={{ borderRadius: 14, borderLeft: "4px solid #dc2626", background: "#fef2f2" }}>
              <Statistic title={<Text style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Utilized Balance</Text>}
                value={acc.currentUtilized || 0} prefix="₹" valueStyle={{ fontSize: 16, fontWeight: 700, color: "#dc2626" }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} size="small" style={{ borderRadius: 14, borderLeft: "4px solid #059669", background: "#ecfdf5" }}>
              <Statistic title={<Text style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Total Repaid</Text>}
                value={totalRepaid} prefix="₹" valueStyle={{ fontSize: 16, fontWeight: 700, color: "#059669" }} />
            </Card>
          </Col>
        </Row>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {acc.accountName} <Text type="secondary" style={{ fontFamily: "monospace" }}>• {acc.bankName} •••• {acc.accountNumber}</Text>
            </Title>
          </div>
          <Space>
            <Button type="primary" icon={<ArrowDownOutlined />} onClick={() => openWithdrawalModal(acc._id)}
              style={{ borderRadius: 10, background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)", border: "none" }}>
              Withdraw
            </Button>
            <Button icon={<ArrowUpOutlined />} onClick={() => openRepaymentModal(acc._id)}
              style={{ borderRadius: 10, background: "#059669", color: "white", border: "none" }}>
              Repay
            </Button>
          </Space>
        </div>

        <Card bordered={false} style={{ borderRadius: 16, marginBottom: 20, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9" }}
          title={<Title level={5} style={{ margin: 0 }}><ArrowDownOutlined style={{ color: "#dc2626", marginRight: 8 }} />Withdrawals ({sortedWithdrawals.length})</Title>}>
          <div className="responsive-table-container">
            <Table dataSource={sortedWithdrawals} columns={withdrawalColumns} rowKey="_id" size="small"
              pagination={{ pageSize: 10 }} locale={{ emptyText: <Empty description="No withdrawals" /> }} />
          </div>
        </Card>

        <Card bordered={false} style={{ borderRadius: 16, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9" }}
          title={<Title level={5} style={{ margin: 0 }}><ArrowUpOutlined style={{ color: "#059669", marginRight: 8 }} />Repayments ({sortedRepayments.length})</Title>}>
          <div className="responsive-table-container">
            <Table dataSource={sortedRepayments} columns={repaymentColumns} rowKey="_id" size="small"
              pagination={{ pageSize: 10 }} locale={{ emptyText: <Empty description="No repayments" /> }} />
          </div>
        </Card>
      </>
    );
  };

  // Build tabs
  const tabItems = [
    {
      key: "overview",
      label: <Space><BankOutlined /> Overview</Space>,
      children: renderOverview(),
    },
    ...accounts.map((acc) => ({
      key: acc._id,
      label: (
        <Space>
          <span>{acc.accountName}</span>
          {(acc.currentUtilized > 0) && (
            <Badge count={`₹${(acc.currentUtilized || 0).toLocaleString("en-IN")}`}
              style={{ backgroundColor: "#dc2626", fontSize: 10 }} />
          )}
        </Space>
      ),
      children: renderAccountDetail(acc),
    })),
  ];

  return (
    <div style={{ padding: "0 4px" }}>
      {/* ── HERO BANNER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #042f2e 0%, #0d3d56 50%, #0f766e 100%)",
          borderRadius: 24,
          padding: isMobile ? "20px 16px" : "28px 32px",
          color: "#fff",
          marginBottom: 24,
          boxShadow: "0 10px 30px rgba(13, 115, 119, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", right: 60, bottom: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ background: "rgba(255, 255, 255, 0.15)", padding: 8, borderRadius: 12, display: "inline-flex" }}>
                <BankOutlined style={{ fontSize: 22, color: "#5eead4" }} />
              </span>
              <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800, fontSize: isMobile ? "1.4rem" : "1.8rem" }}>
                CC Loan (Cash Credit)
              </Title>
            </div>
            <Text style={{ color: "#94a3b8", fontSize: 13 }}>
              Track Cash Credit withdrawals, repayments & interest. Auto-synced with Home Expenses for separate tracking.
            </Text>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingAccount(null);
              accountForm.resetFields();
              accountForm.setFieldsValue({ sanctionedLimit: 2500000, sanctionDate: dayjs() });
              setAccountModalVisible(true);
            }}
            style={{
              height: 48,
              padding: "0 28px",
              borderRadius: 14,
              fontWeight: 700,
              background: "linear-gradient(135deg, #0d7377 0%, #14919b 100%)",
              border: "none",
              boxShadow: "0 8px 20px rgba(13, 115, 119, 0.4)",
            }}
          >
            Add CC Loan Account
          </Button>
        </div>
      </div>

      {/* ── TABS CONTENT ── */}
      <Card bordered={false} style={{ borderRadius: 20, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9" }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Add/Edit Account Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "#f0fdfa", color: "#0d7377", padding: 8, borderRadius: 10 }}>
              <BankOutlined style={{ fontSize: 18 }} />
            </span>
            <Text strong style={{ fontSize: 17 }}>
              {editingAccount ? "Edit CC Loan Account" : "Add New CC Loan Account"}
            </Text>
          </div>
        }
        open={accountModalVisible}
        onCancel={() => { setAccountModalVisible(false); setEditingAccount(null); }}
        onOk={handleAccountSubmit}
        okText={editingAccount ? "Update" : "Add Account"}
        okButtonProps={{
          style: {
            borderRadius: 10, height: 42,
            background: "linear-gradient(135deg, #0d7377 0%, #14919b 100%)",
            border: "none", fontWeight: 700,
          },
        }}
        cancelButtonProps={{ style: { borderRadius: 10, height: 42 } }}
        width={540}
        destroyOnClose
      >
        <Form form={accountForm} layout="vertical" style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="accountName" label="Account Name" rules={[{ required: true, message: "Enter account name" }]}>
                <Input placeholder="e.g., Business CC Account" style={{ height: 42, borderRadius: 10 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankName" label="Bank Name" rules={[{ required: true, message: "Enter bank name" }]}>
                <Input placeholder="e.g., SBI, HDFC" style={{ height: 42, borderRadius: 10 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="accountNumber" label="A/C Last 4 Digits" rules={[{ required: true, message: "Enter last 4 digits" }]}>
                <Input placeholder="e.g., 4521" maxLength={4} style={{ height: 42, borderRadius: 10 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sanctionedLimit" label="CC Limit (₹)">
                <InputNumber style={{ width: "100%", height: 42, borderRadius: 10 }} min={0} prefix="₹" placeholder="25,00,000" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="sanctionDate" label="Sanction Date">
            <DatePicker style={{ width: "100%", height: 42, borderRadius: 10 }} format="DD MMM YYYY" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "#fef2f2", color: "#dc2626", padding: 8, borderRadius: 10 }}>
              <ArrowDownOutlined style={{ fontSize: 18 }} />
            </span>
            <Text strong style={{ fontSize: 17 }}>Record Withdrawal</Text>
          </div>
        }
        open={withdrawalModalVisible}
        onCancel={() => setWithdrawalModalVisible(false)}
        onOk={handleWithdrawalSubmit}
        okText="Record Withdrawal"
        okButtonProps={{
          style: {
            borderRadius: 10, height: 42,
            background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
            border: "none", fontWeight: 700,
          },
        }}
        cancelButtonProps={{ style: { borderRadius: 10, height: 42 } }}
        width={480}
        destroyOnClose
      >
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "10px 14px", borderRadius: 10, marginBottom: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 12, color: "#92400e" }}>
            💡 This withdrawal will be auto-synced to <strong>Home Expenses</strong> for tracking. Interest is charged only on the utilized amount.
          </Text>
        </div>
        <Form form={withdrawalForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Withdrawal Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%", height: 42, borderRadius: 10 }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true, message: "Enter amount" }]}>
                <InputNumber style={{ width: "100%", height: 42, borderRadius: 10, fontSize: 16, fontWeight: 700 }} min={0} prefix="₹" placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
          {/* Quick Amount */}
          <div style={{ marginBottom: 16, marginTop: -8 }}>
            <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>Quick Amount:</Text>
            <Space wrap size={4}>
              {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                <Tag
                  key={amt}
                  onClick={() => withdrawalForm.setFieldsValue({ amount: amt })}
                  style={{ cursor: "pointer", borderRadius: 6, padding: "2px 8px", background: "#f1f5f9", border: "1px solid #cbd5e1", fontWeight: 600 }}
                >
                  +₹{amt.toLocaleString("en-IN")}
                </Tag>
              ))}
            </Space>
          </div>
          <Form.Item name="description" label="Description">
            <Input placeholder="e.g., Business stock purchase, Working capital" style={{ height: 42, borderRadius: 10 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Repayment Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "#ecfdf5", color: "#059669", padding: 8, borderRadius: 10 }}>
              <ArrowUpOutlined style={{ fontSize: 18 }} />
            </span>
            <Text strong style={{ fontSize: 17 }}>Record Repayment</Text>
          </div>
        }
        open={repaymentModalVisible}
        onCancel={() => setRepaymentModalVisible(false)}
        onOk={handleRepaymentSubmit}
        okText="Record Repayment"
        okButtonProps={{
          style: {
            borderRadius: 10, height: 42,
            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            border: "none", fontWeight: 700,
          },
        }}
        cancelButtonProps={{ style: { borderRadius: 10, height: 42 } }}
        width={520}
        destroyOnClose
      >
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "10px 14px", borderRadius: 10, marginBottom: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 12, color: "#065f46" }}>
            💡 Enter the repayment amount to reduce your utilized CC Loan balance.
          </Text>
        </div>
        <Form form={repaymentForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Repayment Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%", height: 42, borderRadius: 10 }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="Repayment Amount (₹)" rules={[{ required: true, message: "Enter amount" }]}>
                <InputNumber style={{ width: "100%", height: 42, borderRadius: 10, fontSize: 16, fontWeight: 700 }} min={0} prefix="₹" placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="paidFrom"
            label="Deduct / Repay From"
            rules={[{ required: true, message: "Please select payment source" }]}
            extra="Selecting Home Cash or Bank Account will deduct from that balance and track this expense in Net Profit"
          >
            <Select style={{ height: 42, borderRadius: 10 }}>
              <Option value="bank_account">🏦 Bank Account (Deducts from Bank Balance)</Option>
              <Option value="home_cash">🏠 Home Cash (Deducts from Home Cash Balance)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Notes (Optional)">
            <Input.TextArea rows={2} placeholder="e.g., Monthly CC repayment" style={{ borderRadius: 10 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CCLoanPage;
