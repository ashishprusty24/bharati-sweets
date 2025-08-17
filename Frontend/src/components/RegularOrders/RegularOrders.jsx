// src/pages/orders/RegularOrdersPage.js
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
  Divider,
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
  WalletOutlined,
} from "@ant-design/icons";
import { API_BASE_URL } from "../../common/config";

const { Title, Text } = Typography;
const { Option } = Select;

const RegularOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);

  // Payment methods
  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "phonepay", label: "PhonePe" },
    { value: "gpay", label: "Google Pay" },
    { value: "card", label: "Credit/Debit Card" },
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
      const response = await fetch(`${API_BASE_URL}/regular-orders/list`);
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
  }, [searchText, orders]);

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

    setFilteredOrders(result);
  };

  const showModal = (order = null) => {
    if (order) {
      form.setFieldsValue({
        ...order,
        items: order.items.map((item) => ({
          ...item,
          key: item._id,
          price: item.price,
          quantity: item.quantity,
        })),
        paymentMethod: order.payment.method,
        paymentAmount: order.payment.amount,
        cardId: order.payment.cardId,
      });
      setEditingOrder(order);
    } else {
      form.resetFields();
      setEditingOrder(null);
    }
    setIsModalVisible(true);
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

      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      // Prepare payment object
      const payment = {
        amount: values.paymentAmount,
        method: values.paymentMethod,
        ...(values.paymentMethod === "card" && { cardId: values.cardId }),
      };

      // Prepare order data
      const orderData = {
        customerName: values.customerName,
        phone: values.phone,
        items,
        payment,
        totalAmount,
      };

      let response;
      if (editingOrder) {
        // Update existing order
        response = await fetch(
          `${API_BASE_URL}/regular-orders/${editingOrder._id}/update`,
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
        response = await fetch(`${API_BASE_URL}/regular-orders/create`, {
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

  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/regular-orders/${id}/delete`,
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

  const getPaymentMethodTag = (method) => {
    const methodInfo = paymentMethods.find((m) => m.value === method);
    return (
      <Tag color={method === "cash" ? "green" : "blue"}>
        {methodInfo?.label || method}
      </Tag>
    );
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
      title: "Order Date",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Items",
      key: "items",
      render: (_, record) => (
        <div>
          <Text>{record.items.length} items</Text>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">₹{record.totalAmount}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Payment",
      key: "payment",
      render: (_, record) => (
        <div>
          <Text>₹{record.payment.amount}</Text>
          <div style={{ marginTop: 4 }}>
            {getPaymentMethodTag(record.payment.method)}
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
          <Popconfirm
            title="Are you sure to delete this order?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="primary"
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

  return (
    <div>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 24,
          }}
        >
          {/* <Title level={4} style={{ margin: 0 }}>
            <ShoppingCartOutlined style={{ marginRight: 8 }} />
            Regular Orders Management
          </Title> */}
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
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* Order Form Modal */}
      <Modal
        title={editingOrder ? "Edit Order" : "Create New Order"}
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
            paymentAmount: 0,
            paymentMethod: "cash",
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

          <Divider>Order Items</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{
                      display: "flex",
                      marginBottom: 8,
                      alignItems: "center",
                    }}
                    align="baseline"
                  >
                    <Form.Item
                      {...restField}
                      name={[name, "itemId"]}
                      label="Select item"
                      rules={[{ required: true, message: "Select sweet item" }]}
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

          <Divider>Payment Details</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                rules={[
                  { required: true, message: "Please select payment method" },
                ]}
              >
                <Select placeholder="Select payment method">
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
                name="paymentAmount"
                label="Payment Amount (₹)"
                rules={[
                  { required: true, message: "Please enter payment amount" },
                ]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Payment amount"
                  prefix={<WalletOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.paymentMethod !== currentValues.paymentMethod
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("paymentMethod") === "card" ? (
                <Form.Item
                  name="cardId"
                  label="Card ID"
                  rules={[{ required: true, message: "Please enter card ID" }]}
                >
                  <Input placeholder="Enter card ID" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RegularOrders;
