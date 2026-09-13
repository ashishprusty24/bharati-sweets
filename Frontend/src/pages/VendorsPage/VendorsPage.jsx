import React, { useState, useMemo } from "react";
import { Card, Input, Button, Tabs, Typography, Table, Tag, message, DatePicker, Row, Col, Select, Statistic } from "antd";
import { SearchOutlined, PlusOutlined, UserOutlined, HistoryOutlined, DollarOutlined, CalendarOutlined, FilterOutlined, ShoppingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import useFetch from "../../hooks/useFetch";
import api from "../../services/api";
import VendorTable from "./components/VendorTable";
import VendorModal from "./components/VendorModal";
import PaymentModal from "./components/PaymentModal";
import DateFilterBar from "../../components/common/DateFilterBar/DateFilterBar";

dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

const VendorsPage = () => {
  const { data: vendors, loading, refetch } = useFetch("/vendors/list");
  const { data: creditCards } = useFetch("/credit-cards");

  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  const [isVendorModalVisible, setIsVendorModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [currentVendor, setCurrentVendor] = useState(null);

  const vendorTypes = [
    { value: "milk", label: "Milk Supplier" },
    { value: "chenna", label: "Chenna Supplier" },
    { value: "sugar", label: "Sugar Supplier" },
    { value: "ghee", label: "Ghee Supplier" },
    { value: "flour", label: "Flour Supplier" },
    { value: "packaging", label: "Packaging Supplier" },
    { value: "other", label: "Other" },
  ];

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "phonepay", label: "PhonePe" },
    { value: "gpay", label: "Google Pay" },
    { value: "card", label: "Credit/Debit Card" },
    { value: "bank", label: "Bank Transfer" },
  ];

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset === "today") {
      setDateRange([dayjs().startOf("day"), dayjs().endOf("day")]);
    } else if (preset === "yesterday") {
      const y = dayjs().subtract(1, "day");
      setDateRange([y.startOf("day"), y.endOf("day")]);
    } else if (preset === "this_week") {
      setDateRange([dayjs().startOf("week"), dayjs().endOf("week")]);
    } else if (preset === "this_month") {
      setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
    } else if (preset === "last_month") {
      const m = dayjs().subtract(1, "month");
      setDateRange([m.startOf("month"), m.endOf("month")]);
    } else if (preset === "all") {
      setDateRange(null);
    }
  };

  const isTxInDateRange = (txDate) => {
    if (!dateRange || dateRange.length !== 2 || !dateRange[0] || !dateRange[1]) return true;
    const d = dayjs(txDate);
    return d.isBetween(dateRange[0].startOf("day"), dateRange[1].endOf("day"), null, "[]");
  };

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    return vendors.filter((v) => {
      const matchesSearch =
        !searchText ||
        v.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        v.contact?.includes(searchText) ||
        v.type?.toLowerCase().includes(searchText.toLowerCase());

      const matchesType = typeFilter === "all" || v.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [vendors, searchText, typeFilter]);

  // Calculate summary stats for the selected date range
  const summaryMetrics = useMemo(() => {
    if (!vendors) return { periodTotalPaid: 0, periodTxCount: 0, activeVendorsCount: 0, allTimeTotalPaid: 0 };
    let periodTotalPaid = 0;
    let periodTxCount = 0;
    let activeVendorsSet = new Set();
    let allTimeTotalPaid = 0;

    vendors.forEach((vendor) => {
      (vendor.transactions || []).forEach((t) => {
        const amt = Number(t.amount) || 0;
        allTimeTotalPaid += amt;
        if (isTxInDateRange(t.date)) {
          periodTotalPaid += amt;
          periodTxCount += 1;
          activeVendorsSet.add(vendor._id);
        }
      });
    });

    return {
      periodTotalPaid,
      periodTxCount,
      activeVendorsCount: activeVendorsSet.size,
      allTimeTotalPaid,
    };
  }, [vendors, dateRange]);

  const handleAddEdit = (vendor = null) => {
    setEditingVendor(vendor);
    setIsVendorModalVisible(true);
  };

  const handlePay = (vendor) => {
    setCurrentVendor(vendor);
    setIsPaymentModalVisible(true);
  };

  const handleVendorSave = async (values) => {
    try {
      if (editingVendor) {
        await api.put(`/vendors/${editingVendor._id}/update`, values);
        message.success("Vendor updated successfully");
      } else {
        await api.post("/vendors/create", values);
        message.success("Vendor added successfully");
      }
      setIsVendorModalVisible(false);
      refetch();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Failed to save vendor");
      throw error;
    }
  };

  const handlePaymentSave = async (paymentData) => {
    try {
      await api.post(`/vendors/${currentVendor._id}/pay`, paymentData);
      message.success("Payment recorded successfully");
      setIsPaymentModalVisible(false);
      refetch();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Failed to record payment");
      throw error;
    }
  };

  const handleDeleteVendor = async (id) => {
    try {
      await api.delete(`/vendors/${id}/delete`);
      message.success("Vendor deleted successfully");
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const transactionColumns = [
    { title: "Date", dataIndex: "date", key: "date", render: (d) => new Date(d).toLocaleDateString("en-IN") },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Amount", dataIndex: "amount", key: "amount", render: (a) => <Text strong style={{ color: "#10b981" }}>₹{a}</Text> },
    { title: "Method", dataIndex: "paymentMethod", key: "method", render: (m) => (
      <Tag color={m === "cash" ? "green" : "blue"}>{paymentMethods.find((opt) => opt.value === m)?.label || m}</Tag>
    )},
  ];

  const renderVendorTransactions = (vendor) => {
    const txs = (vendor.transactions || []).filter((t) => isTxInDateRange(t.date));
    return (
      <Card title={`Transaction History - ${vendor.name}`} size="small" style={{ borderRadius: 12 }}>
        <Table
          columns={transactionColumns}
          dataSource={txs}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </Card>
    );
  };

  return (
    <div>
      <div className="page-header-container" style={{ marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Vendors</Title>
          <Text type="secondary">Manage suppliers, balances, and track vendor payments by date range.</Text>
        </div>
      </div>

      {/* Summary Statistic Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#fff" }}>
            <Statistic
              title={<span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 500 }}><DollarOutlined /> Total Paid ({datePreset === "all" ? "All Time" : "Selected Period"})</span>}
              value={summaryMetrics.periodTotalPaid}
              precision={0}
              prefix="₹"
              valueStyle={{ color: "#10b981", fontWeight: 700, fontSize: 24 }}
            />
            {datePreset !== "all" && (
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                All Time: ₹{summaryMetrics.allTimeTotalPaid.toLocaleString("en-IN")}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={12} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, background: "#ffffff", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <Statistic
              title={<span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}><HistoryOutlined /> Transactions</span>}
              value={summaryMetrics.periodTxCount}
              valueStyle={{ color: "#3b82f6", fontWeight: 700, fontSize: 24 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, background: "#ffffff", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <Statistic
              title={<span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}><UserOutlined /> Active Vendors</span>}
              value={summaryMetrics.activeVendorsCount}
              suffix={`/ ${vendors?.length || 0}`}
              valueStyle={{ color: "#8b5cf6", fontWeight: 700, fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 20 }}>
        {/* Filters Toolbar (Responsive Desktop & Mobile) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          {/* Row 1: Search, Type Filter, Add Button */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1, minWidth: 280 }}>
              <Input
                placeholder="Search vendors by name, contact or type..."
                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                style={{ flex: 1, minWidth: 220, height: 42, borderRadius: 12 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Select
                value={typeFilter}
                onChange={setTypeFilter}
                style={{ width: 180, height: 42 }}
              >
                <Option value="all">All Vendor Types</Option>
                {vendorTypes.map((t) => (
                  <Option key={t.value} value={t.value}>{t.label}</Option>
                ))}
              </Select>
            </div>

            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => handleAddEdit()}
              style={{ borderRadius: 10, height: 42, padding: "0 20px" }}
            >
              Add New Vendor
            </Button>
          </div>

          {/* Row 2: Date Filter Bar (Mobile & Desktop Optimized) */}
          <DateFilterBar
            datePreset={datePreset}
            dateRange={dateRange}
            onPresetChange={handlePresetChange}
            onDateRangeChange={(dates) => {
              setDatePreset("custom");
              setDateRange(dates);
            }}
          />
        </div>

        <Tabs defaultActiveKey="vendors">
          <TabPane tab={<span><UserOutlined /> Vendors ({filteredVendors.length})</span>} key="vendors">
            <div className="responsive-table-container">
              <VendorTable
                data={filteredVendors}
                loading={loading}
                vendorTypes={vendorTypes}
                onEdit={handleAddEdit}
                onDelete={handleDeleteVendor}
                onPay={handlePay}
                expandedRowRender={renderVendorTransactions}
                dateRange={dateRange}
              />
            </div>
          </TabPane>

          <TabPane tab={<span><HistoryOutlined /> All Transactions</span>} key="transactions">
            {vendors?.map((vendor) => {
              const txs = (vendor.transactions || []).filter((t) => isTxInDateRange(t.date));
              if (txs.length === 0) return null;
              const vendorTotal = txs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

              return (
                <div key={vendor._id} style={{ marginBottom: 24, background: "#f8fafc", padding: 16, borderRadius: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                    <Title level={5} style={{ margin: 0 }}>
                      {vendor.name} <Tag color="blue">{vendorTypes.find((opt) => opt.value === vendor.type)?.label || vendor.type}</Tag>
                    </Title>
                    <Text strong style={{ color: "#10b981" }}>Period Paid: ₹{vendorTotal.toLocaleString("en-IN")}</Text>
                  </div>
                  <div className="responsive-table-container">
                    <Table
                      columns={transactionColumns}
                      dataSource={txs}
                      rowKey="_id"
                      pagination={{ pageSize: 5 }}
                      size="small"
                    />
                  </div>
                </div>
              );
            })}
          </TabPane>
        </Tabs>
      </Card>

      <VendorModal
        visible={isVendorModalVisible}
        item={editingVendor}
        vendorTypes={vendorTypes}
        loading={loading}
        onCancel={() => setIsVendorModalVisible(false)}
        onOk={handleVendorSave}
      />

      <PaymentModal
        visible={isPaymentModalVisible}
        vendor={currentVendor}
        creditCards={creditCards || []}
        paymentMethods={paymentMethods}
        loading={loading}
        onCancel={() => setIsPaymentModalVisible(false)}
        onOk={handlePaymentSave}
      />
    </div>
  );
};

export default VendorsPage;
