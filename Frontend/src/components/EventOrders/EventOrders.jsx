// src/pages/orders/EventOrdersPage.js
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
  DatePicker,
  TimePicker,
  Divider,
  Badge,
  Steps,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { API_BASE_URL } from "../../common/config";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Step } = Steps;

const EventOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [form] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Order status options
  const orderStatusOptions = [
    { value: "pending", label: "Pending", color: "orange" },
    { value: "confirmed", label: "Confirmed", color: "blue" },
    { value: "preparing", label: "Preparing", color: "geekblue" },
    { value: "ready", label: "Ready", color: "purple" },
    { value: "delivered", label: "Delivered", color: "green" },
    { value: "cancelled", label: "Cancelled", color: "red" },
  ];

  // Payment status options
  const paymentStatusOptions = [
    { value: "pending", label: "Pending", color: "orange" },
    { value: "partial", label: "Partial", color: "blue" },
    { value: "paid", label: "Paid", color: "green" },
  ];

  // Payment methods
  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "phonepay", label: "PhonePe" },
    { value: "gpay", label: "Google Pay" },
    { value: "card", label: "Credit/Debit Card" },
  ];

  // Event purposes
  const purposeOptions = [
    "Wedding",
    "Birthday",
    "Anniversary",
    "Corporate Event",
    "Religious Ceremony",
    "Other",
  ];

  // Delivery times
  const deliveryTimeOptions = [
    "6:00 AM",
    "7:00 AM",
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
    "9:00 PM",
    "10:00 PM",
  ];

  // Fetch inventory items
  const fetchInventoryItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/list`);
      const data = await response.json();
      setInventoryItems(data);
    } catch (error) {
      message.error("Failed to fetch inventory items");
      console.error("Error fetching inventory:", error);
    }
  };

  // Fetch orders from backend
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/event-orders/list`);
      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      message.error("Failed to fetch orders");
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryItems();
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchText, statusFilter, dateRange, orders]);

  const filterOrders = () => {
    let result = [...orders];

    // Apply search filter
    if (searchText) {
      result = result.filter(
        (order) =>
          order.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
          order.phone.includes(searchText) ||
          order._id.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((order) => order.orderStatus === statusFilter);
    }

    // Apply date filter
    if (dateRange && dateRange.length === 2) {
      const start = dateRange[0].format("YYYY-MM-DD");
      const end = dateRange[1].format("YYYY-MM-DD");
      result = result.filter(
        (order) =>
          new Date(order.deliveryDate) >= new Date(start) &&
          new Date(order.deliveryDate) <= new Date(end)
      );
    }

    setFilteredOrders(result);
  };

  const showModal = (order = null) => {
    if (order) {
      form.setFieldsValue({
        ...order,
        // deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : null,
        // items: order.items.map((item) => ({ ...item, key: item._id })),
      });
      setEditingOrder(order);
    } else {
      form.resetFields();
      setEditingOrder(null);
    }
    setIsModalVisible(true);
  };

  const showPaymentModal = (order) => {
    setCurrentOrder(order);
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      amount: order.totalAmount - order.paidAmount,
      method: "cash",
    });
    setIsPaymentModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Prepare items
      const items = values.items.map((item) => ({
        itemId: item.itemId,
        name: inventoryItems.find((i) => i._id === item.itemId)?.name || "Item",
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));

      // Prepare payment data
      const paymentData = {
        amount: values.paymentAmount || 0,
        method: values.paymentMethod || "cash",
        ...(values.paymentMethod === "card" && { cardId: values.cardId }),
      };

      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      // Prepare order data
      const orderData = {
        customerName: values.customerName,
        phone: values.phone,
        purpose: values.purpose,
        address: values.address,
        deliveryDate: values.deliveryDate.toISOString(),
        deliveryTime: values.deliveryTime,
        items,
        totalAmount,
        notes: values.notes,
        orderStatus: values.orderStatus || "pending",
        payments: values.paymentAmount > 0 ? [paymentData] : [],
        paidAmount: values.paymentAmount || 0,
      };

      let response;
      if (editingOrder) {
        // Update existing order
        response = await fetch(
          `${API_BASE_URL}/event-orders/${editingOrder._id}/update`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
          }
        );
      } else {
        // Create new order
        response = await fetch(`${API_BASE_URL}/event-orders/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to save order");
      }

      message.success(
        `Order ${editingOrder ? "updated" : "created"} successfully!`
      );
      fetchOrders();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(error.message || "Error saving order");
      console.error("Error saving order:", error);
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      const values = await paymentForm.validateFields();

      // Prepare payment data
      const paymentData = {
        amount: values.amount,
        method: values.method,
        ...(values.method === "card" && { cardId: values.cardId }),
      };

      // Make API call to add payment
      const response = await fetch(
        `${API_BASE_URL}/event-orders/${currentOrder._id}/payments`,
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
      fetchOrders();
      setIsPaymentModalVisible(false);
      paymentForm.resetFields();
    } catch (error) {
      message.error(error.message || "Error recording payment");
      console.error("Error recording payment:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/event-orders/${id}/delete`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete order");
      }

      message.success("Order deleted successfully!");
      fetchOrders();
    } catch (error) {
      message.error(error.message || "Error deleting order");
      console.error("Error deleting order:", error);
    }
  };

  const getStatusTag = (status, type = "order") => {
    const options =
      type === "order" ? orderStatusOptions : paymentStatusOptions;
    const statusInfo = options.find((opt) => opt.value === status);
    return (
      <Tag color={statusInfo?.color || "default"}>
        {statusInfo?.label || status}
      </Tag>
    );
  };

  const getPaymentStatus = (paidAmount, totalAmount) => {
    if (paidAmount >= totalAmount) return "paid";
    if (paidAmount > 0) return "partial";
    return "pending";
  };

  const columns = [
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      render: (id) => <Text strong>{id.substring(0, 8)}...</Text>,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">{record.phone}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Event",
      dataIndex: "purpose",
      key: "purpose",
      render: (purpose) => <Text>{purpose}</Text>,
    },
    {
      title: "Delivery",
      key: "delivery",
      render: (_, record) => (
        <div>
          <Text>{new Date(record.deliveryDate).toLocaleDateString()}</Text>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">{record.deliveryTime}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, record) => (
        <div>
          <Text strong>₹{record.totalAmount}</Text>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">Paid: ₹{record.paidAmount || 0}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <div>
          {getStatusTag(record.orderStatus, "order")}
          <div style={{ marginTop: 4 }}>
            {getStatusTag(
              getPaymentStatus(record.paidAmount, record.totalAmount),
              "payment"
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
          <Tooltip title="Edit">
            <Button
              type="primary"
              shape="circle"
              icon={<EditOutlined />}
              size="small"
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Tooltip title="Record Payment">
            <Button
              type="default"
              shape="circle"
              icon={<DollarOutlined />}
              size="small"
              onClick={() => showPaymentModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure to delete this order?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                danger
                shape="circle"
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderOrderItems = (items) => (
    <div style={{ margin: "16px 0" }}>
      <Title level={5} style={{ marginBottom: 8 }}>
        Order Items
      </Title>
      <Table
        columns={[
          { title: "Item", dataIndex: "name", key: "name" },
          {
            title: "Price",
            dataIndex: "price",
            key: "price",
            render: (price) => `₹${price}`,
          },
          { title: "Quantity", dataIndex: "quantity", key: "quantity" },
          {
            title: "Total",
            dataIndex: "total",
            key: "total",
            render: (total) => <Text strong>₹{total}</Text>,
          },
        ]}
        dataSource={items}
        rowKey="_id"
        pagination={false}
        size="small"
      />
    </div>
  );

  const renderPayments = (payments) => (
    <div style={{ margin: "16px 0" }}>
      <Title level={5} style={{ marginBottom: 8 }}>
        Payments
      </Title>
      <Table
        columns={[
          {
            title: "Date",
            dataIndex: "timestamp",
            key: "date",
            render: (date) => new Date(date).toLocaleString(),
          },
          {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (amount) => <Text strong>₹{amount}</Text>,
          },
          {
            title: "Method",
            dataIndex: "method",
            key: "method",
            render: (method) => (
              <Tag color={method === "cash" ? "green" : "blue"}>
                {paymentMethods.find((m) => m.value === method)?.label ||
                  method}
              </Tag>
            ),
          },
          {
            title: "Card",
            dataIndex: "cardId",
            key: "card",
            render: (cardId) => cardId || "-",
          },
        ]}
        dataSource={payments}
        rowKey="_id"
        pagination={false}
        size="small"
      />
    </div>
  );

  const renderOrderDetails = (record) => (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Text strong>Purpose:</Text> {record.purpose}
        </Col>
        <Col span={12}>
          <Text strong>Delivery Address:</Text> {record.address}
        </Col>
      </Row>

      {renderOrderItems(record.items)}

      {record.payments?.length > 0 && renderPayments(record.payments)}

      {record.notes && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Notes:</Text> {record.notes}
        </div>
      )}
    </div>
  );

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
            <ShoppingCartOutlined style={{ marginRight: 8 }} />
            Event Orders Management
          </Title>
          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Create New Order
            </Button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <Input
            placeholder="Search orders..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <Select
            placeholder="Filter by status"
            style={{ width: 200 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="all">All Statuses</Option>
            {orderStatusOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>

          <RangePicker
            placeholder={["Start Date", "End Date"]}
            style={{ width: 250 }}
            onChange={setDateRange}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredOrders.map((order) => ({
            ...order,
            key: order._id,
          }))}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1500 }}
          expandable={{
            expandedRowRender: renderOrderDetails,
            rowExpandable: (record) => true,
          }}
        />
      </Card>

      {/* Order Form Modal */}
      <Modal
        title={editingOrder ? "Edit Event Order" : "Create New Event Order"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText={editingOrder ? "Update Order" : "Create Order"}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            orderStatus: "pending",
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[
                  { required: true, message: "Please enter customer name" },
                ]}
              >
                <Input placeholder="Customer name" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: "Please enter phone number" },
                ]}
              >
                <Input placeholder="Phone number" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="purpose"
                label="Event Purpose"
                rules={[
                  { required: true, message: "Please select event purpose" },
                ]}
              >
                <Select placeholder="Select purpose">
                  {purposeOptions.map((purpose) => (
                    <Option key={purpose} value={purpose}>
                      {purpose}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="orderStatus"
                label="Order Status"
                rules={[
                  { required: true, message: "Please select order status" },
                ]}
              >
                <Select placeholder="Select status">
                  {orderStatusOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Delivery Address"
            rules={[
              { required: true, message: "Please enter delivery address" },
            ]}
          >
            <TextArea placeholder="Full delivery address" rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="deliveryDate"
                label="Delivery Date"
                rules={[
                  { required: true, message: "Please select delivery date" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deliveryTime"
                label="Delivery Time"
                rules={[
                  { required: true, message: "Please select delivery time" },
                ]}
              >
                <Select placeholder="Select time">
                  {deliveryTimeOptions.map((time) => (
                    <Option key={time} value={time}>
                      {time}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Order Items</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: "flex", marginBottom: 8 }}
                    align="baseline"
                  >
                    <Form.Item
                      {...restField}
                      name={[name, "itemId"]}
                      rules={[{ required: true, message: "Select item" }]}
                    >
                      <Select
                        placeholder="Select sweet"
                        style={{ width: 200 }}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          option.children
                            .toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {inventoryItems.map((item) => (
                          <Option key={item._id} value={item._id}>
                            {item.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, "price"]}
                      label="Price"
                      rules={[{ required: true, message: "Enter price" }]}
                    >
                      <InputNumber
                        min={0}
                        placeholder="Price"
                        prefix="₹"
                        style={{ width: 120 }}
                      />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, "quantity"]}
                      label="Quantity"
                      rules={[{ required: true, message: "Enter quantity" }]}
                    >
                      <InputNumber
                        min={0.1}
                        step={0.1}
                        placeholder="Qty"
                        style={{ width: 100 }}
                      />
                    </Form.Item>

                    <Button
                      type="dashed"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Space>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Sweet Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item name="notes" label="Special Notes">
            <TextArea placeholder="Any special instructions" rows={3} />
          </Form.Item>

          <Divider>Payment Information</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentAmount"
                label="Initial Payment Amount"
                rules={[
                  {
                    required: false,
                    type: "number",
                    min: 0,
                    message: "Payment amount must be a positive number",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const total =
                        getFieldValue("items")?.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        ) || 0;

                      if (!value || value <= total) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          `Payment cannot exceed total amount ₹${total}`
                        )
                      );
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  placeholder="Amount paid now"
                  prefix="₹"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                rules={[
                  { required: true, message: "Please select payment method" },
                ]}
              >
                <Select placeholder="Select method" onChange={setPaymentMethod}>
                  {paymentMethods.map((method) => (
                    <Option key={method.value} value={method.value}>
                      {method.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {paymentMethod === "card" && (
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="cardId"
                  label="Card ID"
                  rules={[
                    {
                      required: paymentMethod === "card",
                      message: "Card ID is required for card payments",
                    },
                  ]}
                >
                  <Input placeholder="Enter card transaction ID" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>

      {/* Payment Form Modal */}
      <Modal
        title={`Record Payment for Order ${
          currentOrder?._id?.substring(0, 8) || ""
        }`}
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
          <Row gutter={16}>
            <Col span={24}>
              <Text strong>
                Total Amount: ₹{currentOrder?.totalAmount || 0}
              </Text>
            </Col>
            <Col span={24}>
              <Text>Paid Amount: ₹{currentOrder?.paidAmount || 0}</Text>
            </Col>
            <Col span={24} style={{ margin: "8px 0" }}>
              <Text strong type="danger">
                Due Amount: ₹
                {(currentOrder?.totalAmount || 0) -
                  (currentOrder?.paidAmount || 0)}
              </Text>
            </Col>
          </Row>

          <Divider />

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="amount"
                label="Payment Amount (₹)"
                rules={[
                  {
                    required: true,
                    message: "Please enter payment amount",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const maxAmount =
                        (currentOrder?.totalAmount || 0) -
                        (currentOrder?.paidAmount || 0);
                      if (value <= maxAmount) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          `Amount cannot exceed due amount ₹${maxAmount}`
                        )
                      );
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0.01}
                  style={{ width: "100%" }}
                  placeholder="Payment amount"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="method"
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
                  prevValues.method !== currentValues.method
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue("method") === "card" ? (
                    <Form.Item
                      name="cardId"
                      label="Card ID"
                      rules={[
                        { required: true, message: "Please enter card ID" },
                      ]}
                    >
                      <Input placeholder="Enter card ID" />
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

export default EventOrders;
