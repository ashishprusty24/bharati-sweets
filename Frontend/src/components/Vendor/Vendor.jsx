// src/pages/vendors.js
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Typography,
  Row,
  Col,
  Card,
  Popconfirm,
  Space,
  Tooltip,
  Tabs,
  Divider,
  message,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  DollarOutlined,
  SolutionOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const API_URL = "http://localhost:5000/api"; // Update with your backend URL

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [isVendorModalVisible, setIsVendorModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("vendors");
  const [form] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [creditCards, setCreditCards] = useState([]);

  // Vendor types
  const vendorTypes = [
    { value: "milk", label: "Milk Supplier" },
    { value: "chenna", label: "Chenna Supplier" },
    { value: "sugar", label: "Sugar Supplier" },
    { value: "ghee", label: "Ghee Supplier" },
    { value: "flour", label: "Flour Supplier" },
    { value: "packaging", label: "Packaging Supplier" },
    { value: "other", label: "Other" },
  ];

  // Payment methods
  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "phonepay", label: "PhonePe" },
    { value: "gpay", label: "Google Pay" },
    { value: "card", label: "Credit/Debit Card" },
    { value: "bank", label: "Bank Transfer" },
  ];

  // Fetch vendors from backend
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/vendors`);
      const data = await response.json();
      setVendors(data);
      setFilteredVendors(data);
    } catch (error) {
      message.error("Failed to fetch vendors");
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch credit cards from backend
  const fetchCreditCards = async () => {
    try {
      const response = await fetch(`${API_URL}/credit-cards`);
      const data = await response.json();
      setCreditCards(data);
    } catch (error) {
      message.error("Failed to fetch credit cards");
      console.error("Error fetching credit cards:", error);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchCreditCards();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [searchText, vendors]);

  const filterVendors = () => {
    if (searchText) {
      const filtered = vendors.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(searchText.toLowerCase()) ||
          vendor.contact.includes(searchText) ||
          vendor.type.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredVendors(filtered);
    } else {
      setFilteredVendors(vendors);
    }
  };

  const showVendorModal = (vendor = null) => {
    if (vendor) {
      form.setFieldsValue({
        ...vendor,
        suppliedItems: vendor.suppliedItems || [],
      });
      setEditingVendor(vendor);
    } else {
      form.resetFields();
      setEditingVendor(null);
    }
    setIsVendorModalVisible(true);
  };

  const showPaymentModal = (vendor) => {
    setCurrentVendor(vendor);
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      vendorId: vendor._id,
      date: new Date().toISOString().split("T")[0],
      quantity: vendor.dailySupply || vendor.monthlySupply || 0,
      rate: vendor.rate || 0,
    });
    setIsPaymentModalVisible(true);
  };

  const handleVendorSubmit = async () => {
    try {
      const values = await form.validateFields();

      let response;
      if (editingVendor) {
        // Update existing vendor
        response = await fetch(`${API_URL}/vendors/${editingVendor._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });
      } else {
        // Create new vendor
        response = await fetch(`${API_URL}/vendors`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to save vendor");
      }

      message.success(
        `Vendor ${editingVendor ? "updated" : "created"} successfully!`
      );
      fetchVendors();
      setIsVendorModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(error.message || "Error saving vendor");
      console.error("Error saving vendor:", error);
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      const values = await paymentForm.validateFields();

      // Calculate amount
      const amount = values.quantity * values.rate;

      // Prepare payment data
      const paymentData = {
        ...values,
        amount,
        card: values.paymentMethod === "card" ? values.card : null,
      };

      // Make API call to add payment
      const response = await fetch(
        `${API_URL}/vendors/${currentVendor._id}/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to record payment");
      }

      message.success("Payment recorded successfully!");
      fetchVendors();
      setIsPaymentModalVisible(false);
      paymentForm.resetFields();
    } catch (error) {
      message.error(error.message || "Error recording payment");
      console.error("Error recording payment:", error);
    }
  };

  const handleDeleteVendor = async (id) => {
    try {
      const response = await fetch(`${API_URL}/vendors/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete vendor");
      }

      message.success("Vendor deleted successfully!");
      fetchVendors();
    } catch (error) {
      message.error(error.message || "Error deleting vendor");
      console.error("Error deleting vendor:", error);
    }
  };

  const getTypeTag = (type) => {
    const typeInfo = vendorTypes.find((opt) => opt.value === type);
    return <Tag color="blue">{typeInfo?.label || type}</Tag>;
  };

  const vendorColumns = [
    {
      title: "Vendor Name",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <div style={{ marginTop: 4 }}>{getTypeTag(record.type)}</div>
        </div>
      ),
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      render: (contact) => <Text>{contact}</Text>,
    },
    {
      title: "Supply Details",
      key: "supply",
      render: (_, record) => (
        <div>
          <Text>{record.suppliedItems?.join(", ") || "N/A"}</Text>
          <div style={{ marginTop: 4 }}>
            {record.dailySupply ? (
              <Text type="secondary">
                {record.dailySupply}{" "}
                {record.type === "milk" ? "liters/day" : "kg/day"}
              </Text>
            ) : record.monthlySupply ? (
              <Text type="secondary">{record.monthlySupply} kg/month</Text>
            ) : (
              <Text type="secondary">No supply data</Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Payment Due",
      dataIndex: "paymentDue",
      key: "due",
      render: (due) => <Text strong>₹{due || 0}</Text>,
    },
    {
      title: "Last Payment",
      key: "lastPayment",
      render: (_, record) => (
        <div>
          <Text>
            {record.lastPaymentDate
              ? new Date(record.lastPaymentDate).toLocaleDateString()
              : "N/A"}
          </Text>
          <div style={{ marginTop: 4 }}>
            {record.transactions?.length > 0 ? (
              <Text type="secondary">
                ₹{record.transactions[record.transactions.length - 1].amount}
              </Text>
            ) : (
              <Text type="secondary">No payments</Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Make Payment">
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => showPaymentModal(record)}
            >
              Pay
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="default"
              icon={<EditOutlined />}
              onClick={() => showVendorModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure to delete this vendor?"
            onConfirm={() => handleDeleteVendor(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="primary" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const transactionColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => <Text strong>₹{amount}</Text>,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "method",
      render: (method) => (
        <Tag color={method === "cash" ? "green" : "blue"}>
          {paymentMethods.find((m) => m.value === method)?.label || method}
        </Tag>
      ),
    },
    {
      title: "Card Used",
      dataIndex: "card",
      key: "card",
      render: (cardId) => {
        if (!cardId) return "-";
        const card = creditCards.find((c) => c._id === cardId);
        return card ? `${card.name} (****${card.last4})` : "-";
      },
    },
  ];

  const renderVendorTransactions = (vendor) => {
    return (
      <Card
        title={`Transaction History - ${vendor.name}`}
        style={{ marginTop: 16 }}
        extra={
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => showPaymentModal(vendor)}
          >
            Make New Payment
          </Button>
        }
      >
        {vendor.transactions?.length > 0 ? (
          <Table
            columns={transactionColumns}
            dataSource={vendor.transactions}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
          />
        ) : (
          <Text>No transactions found</Text>
        )}
      </Card>
    );
  };

  return (
    <div>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            <SolutionOutlined style={{ marginRight: 8 }} />
            Vendor Management
          </Title>
          <div>
            <Input
              placeholder="Search vendors..."
              prefix={<SearchOutlined />}
              style={{ width: 300, marginRight: 16 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showVendorModal()}
            >
              Add New Vendor
            </Button>
          </div>
        </div>

        <Tabs defaultActiveKey="vendors" onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <UserOutlined /> Vendors
              </span>
            }
            key="vendors"
          >
            <Table
              columns={vendorColumns}
              dataSource={filteredVendors.map((v) => ({ ...v, key: v._id }))}
              rowKey="_id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1300 }}
              expandable={{
                expandedRowRender: (record) => renderVendorTransactions(record),
                rowExpandable: (record) => record.transactions?.length > 0,
              }}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <HistoryOutlined /> All Transactions
              </span>
            }
            key="transactions"
          >
            <Card>
              {vendors.map((vendor) => (
                <div key={vendor._id} style={{ marginBottom: 24 }}>
                  <Title level={5} style={{ marginBottom: 16 }}>
                    {vendor.name} - {getTypeTag(vendor.type)}
                  </Title>
                  {vendor.transactions?.length > 0 ? (
                    <Table
                      columns={transactionColumns}
                      dataSource={vendor.transactions}
                      rowKey="_id"
                      pagination={false}
                      style={{ marginBottom: 24 }}
                    />
                  ) : (
                    <Text>No transactions for this vendor</Text>
                  )}
                </div>
              ))}
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* Vendor Form Modal */}
      <Modal
        title={editingVendor ? "Edit Vendor" : "Add New Vendor"}
        open={isVendorModalVisible}
        onOk={handleVendorSubmit}
        onCancel={() => {
          setIsVendorModalVisible(false);
          form.resetFields();
        }}
        okText={editingVendor ? "Update Vendor" : "Add Vendor"}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Vendor Name"
                rules={[
                  { required: true, message: "Please enter vendor name" },
                ]}
              >
                <Input placeholder="e.g. Milk Man Rajesh" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Vendor Type"
                rules={[
                  { required: true, message: "Please select vendor type" },
                ]}
              >
                <Select placeholder="Select vendor type">
                  {vendorTypes.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contact"
                label="Contact Number"
                rules={[
                  { required: true, message: "Please enter contact number" },
                ]}
              >
                <Input placeholder="e.g. +91 9876543210" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="suppliedItems"
                label="Supplied Items"
                rules={[
                  { required: true, message: "Please enter supplied items" },
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="e.g. Milk, Chenna"
                  tokenSeparators={[","]}
                >
                  {[
                    "Milk",
                    "Chenna",
                    "Sugar",
                    "Ghee",
                    "Flour",
                    "Packaging",
                  ].map((item) => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: "Please enter address" }]}
          >
            <Input.TextArea placeholder="Full address" rows={2} />
          </Form.Item>

          <Divider>Supply Details</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dailySupply" label="Daily Supply Quantity">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="e.g. 50"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="monthlySupply" label="Monthly Supply Quantity">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="e.g. 500"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="rate"
            label="Rate per Unit (₹)"
            rules={[{ required: true, message: "Please enter rate per unit" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="e.g. 50"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Payment Form Modal */}
      <Modal
        title={`Make Payment to ${currentVendor?.name || "Vendor"}`}
        open={isPaymentModalVisible}
        onOk={handlePaymentSubmit}
        onCancel={() => {
          setIsPaymentModalVisible(false);
          paymentForm.resetFields();
        }}
        okText="Record Payment"
        width={600}
      >
        <Form form={paymentForm} layout="vertical">
          <Form.Item name="vendorId" hidden>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Payment Date"
                rules={[{ required: true, message: "Please select date" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: "Please enter quantity" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="rate"
                label="Rate per Unit (₹)"
                rules={[{ required: true, message: "Please enter rate" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="Total Amount">
                <InputNumber
                  style={{ width: "100%" }}
                  disabled
                  value={
                    paymentForm.getFieldValue("quantity") *
                      paymentForm.getFieldValue("rate") || 0
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Payment Method</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                rules={[
                  { required: true, message: "Please select payment method" },
                ]}
              >
                <Select placeholder="Select method">
                  {paymentMethods.map((method) => (
                    <Option key={method.value} value={method.value}>
                      {method.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.paymentMethod !== currentValues.paymentMethod
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue("paymentMethod") === "card" ? (
                    <Form.Item
                      name="card"
                      label="Credit Card"
                      rules={[
                        { required: true, message: "Please select card" },
                      ]}
                    >
                      <Select placeholder="Select card">
                        {creditCards.map((card) => (
                          <Option key={card._id} value={card._id}>
                            {card.name} (****{card.last4})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Vendors;
