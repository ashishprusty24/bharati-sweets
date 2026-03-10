import React, { useState, useMemo } from "react";
import { Card, Input, Button, Tabs, Typography, Table, Tag, message } from "antd";
import { SearchOutlined, PlusOutlined, UserOutlined, HistoryOutlined, DollarOutlined } from "@ant-design/icons";
import useFetch from "../../hooks/useFetch";
import api from "../../services/api";
import VendorTable from "./components/VendorTable";
import VendorModal from "./components/VendorModal";
import PaymentModal from "./components/PaymentModal";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const VendorsPage = () => {
  const { data: vendors, loading, refetch } = useFetch("/vendors/list");
  const { data: creditCards } = useFetch("/credit-cards");
  const [searchText, setSearchText] = useState("");
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

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    if (!searchText) return vendors;
    const lowerSearch = searchText.toLowerCase();
    return vendors.filter(v => 
      v.name.toLowerCase().includes(lowerSearch) ||
      v.contact.includes(searchText) ||
      v.type.toLowerCase().includes(lowerSearch)
    );
  }, [vendors, searchText]);

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
    { title: "Date", dataIndex: "date", key: "date", render: (d) => new Date(d).toLocaleDateString() },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Amount", dataIndex: "amount", key: "amount", render: (a) => <Text strong>₹{a}</Text> },
    { title: "Method", dataIndex: "paymentMethod", key: "method", render: (m) => (
      <Tag color={m === "cash" ? "green" : "blue"}>{paymentMethods.find(opt => opt.value === m)?.label || m}</Tag>
    )},
  ];

  const renderVendorTransactions = (vendor) => (
    <Card title={`Transaction History - ${vendor.name}`} size="small">
      <Table
        columns={transactionColumns}
        dataSource={vendor.transactions}
        rowKey="_id"
        pagination={{ pageSize: 5 }}
        size="small"
      />
    </Card>
  );

  return (
    <div style={{ padding: "0 8px" }}>
      <div className="page-header-container">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Vendors</Title>
          <Text type="secondary">Manage your suppliers, balances, and transaction history.</Text>
        </div>
      </div>

      <Card bordered={false} className="glass-card" style={{ borderRadius: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }} className="search-filter-row">
          <Input
            placeholder="Search vendors..."
            prefix={<SearchOutlined />}
            style={{ maxWidth: 350, width: "100%", height: 45, borderRadius: 12 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button 
            type="primary" 
            size="large"
            icon={<PlusOutlined />} 
            onClick={() => handleAddEdit()}
            style={{ borderRadius: 10, height: 45, padding: "0 24px" }}
          >
            Add New Vendor
          </Button>
        </div>

        <Tabs defaultActiveKey="vendors">
          <TabPane tab={<span><UserOutlined /> Vendors</span>} key="vendors">
            <div className="responsive-table-container">
              <VendorTable
                data={filteredVendors}
                loading={loading}
                vendorTypes={vendorTypes}
                onEdit={handleAddEdit}
                onDelete={handleDeleteVendor}
                onPay={handlePay}
                expandedRowRender={renderVendorTransactions}
              />
            </div>
          </TabPane>
          <TabPane tab={<span><HistoryOutlined /> All Transactions</span>} key="transactions">
            {vendors?.map(vendor => vendor.transactions?.length > 0 && (
              <div key={vendor._id} style={{ marginBottom: 24 }}>
                <Title level={5}>{vendor.name} - {vendor.type}</Title>
                <div className="responsive-table-container">
                  <Table
                    columns={transactionColumns}
                    dataSource={vendor.transactions}
                    rowKey="_id"
                    pagination={false}
                    size="small"
                  />
                </div>
              </div>
            ))}
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
