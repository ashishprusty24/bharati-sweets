import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
  message,
  Descriptions,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  DollarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { API_BASE_URL } from "../../common/config";
import ReactToPrint from "react-to-print";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const EventOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [form] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [invoiceForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const invoiceRef = useRef();

  // Get real-time values from the invoice form to update the preview
  const invoiceFormItems = Form.useWatch("items", invoiceForm);
  const invoiceFormDiscount = Form.useWatch("discount", invoiceForm);

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
      const start = dateRange[0].toISOString().split("T")[0];
      const end = dateRange[1].toISOString().split("T")[0];
      result = result.filter(
        (order) =>
          order.deliveryDate.substring(0, 10) >= start &&
          order.deliveryDate.substring(0, 10) <= end
      );
    }

    setFilteredOrders(result);
  };

  const showModal = (order = null) => {
    if (order) {
      form.setFieldsValue({
        ...order,
        deliveryDate: order.deliveryDate ? dayjs(order.deliveryDate) : null,
        items: order.items.map((item) => ({
          ...item,
          key: item._id || item.itemId,
        })),
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
      amount: order.totalAmount - order.paidAmount - (order.discount || 0),
      method: "cash",
    });
    setIsPaymentModalVisible(true);
  };

  const showInvoiceModal = (order) => {
    setCurrentOrder(order);
    invoiceForm.resetFields();
    invoiceForm.setFieldsValue({
      invoiceNumber: `INV-${order._id.slice(-6).toUpperCase()}`,
      invoiceDate: dayjs(),
      customerName: order.customerName,
      customerPhone: order.phone,
      customerAddress: order.address,
      items: order.items.map((item) => ({
        ...item,
        key: item._id || item.itemId,
      })),
    });
    setIsInvoiceModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsLoading(true);

      // Prepare items
      const items = values.items.map((item) => ({
        itemId: item.itemId,
        name: inventoryItems.find((i) => i._id === item.itemId)?.name || "Item",
        price: item.price,
        quantity: item.quantity,
        packets: item.packets || 1,
        total: item.price * item.quantity,
      }));

      // Prepare payment data
      const paymentData = {
        amount: values.paymentAmount || 0,
        method: values.paymentMethod || "cash",
        ...(values.paymentMethod === "card" && { cardId: values.cardId }),
      };

      // Calculate total amount
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const discount = values.discount || 0;
      const totalAmount = subtotal - discount;

      // Prepare order data
      const orderData = {
        customerName: values.customerName,
        phone: values.phone,
        purpose: values.purpose,
        address: values.address,
        deliveryDate: values.deliveryDate.toISOString(),
        deliveryTime: values.deliveryTime,
        items,
        subtotal,
        discount,
        totalAmount,
        notes: values.notes,
        orderStatus: values.orderStatus || "pending",
        payments: values.paymentAmount > 0 ? [paymentData] : [],
        paidAmount: values.paymentAmount || 0,
        packets: values.packets || 1,
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
      setIsLoading(false);

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

  const handlePrint = async () => {
    const invoiceElement = document.getElementById("invoiceWrapper");

    if (!invoiceElement) return;

    const canvas = await html2canvas(invoiceElement, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let position = 0;

    // If content is longer than one page, add extra pages
    if (pdfHeight > pageHeight) {
      let heightLeft = pdfHeight;

      while (heightLeft > 0) {
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
        if (heightLeft > 0) {
          pdf.addPage();
          position = 0;
        }
      }
    } else {
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(`invoice_${Date.now()}.pdf`);
  };

  const columns = [
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      render: (id) => <Text strong>{id?.substring(0, 8)}...</Text>,
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
      title: "Packets",
      dataIndex: "packets",
      key: "packets",
      render: (packets) => <Text>{packets || 1}</Text>,
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
          {record.discount > 0 && (
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" delete>
                Discount: ₹{record.discount}
              </Text>
            </div>
          )}
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
          <Tooltip title="Generate Invoice">
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              size="small"
              onClick={() => showInvoiceModal(record)}
            >
              Generate invoice
            </Button>
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

  const renderOrderDetails = (record) => (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Text strong>Purpose:</Text> {record.purpose}
        </Col>
        <Col span={12}>
          <Text strong>Packets:</Text> {record.packets || 1}
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Text strong>Delivery Address:</Text> {record.address}
        </Col>
      </Row>

      {renderOrderItems(record.items)}

      {record.discount > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Text strong>Subtotal:</Text> ₹
            {record.subtotal || record.totalAmount + record.discount}
          </Col>
          <Col span={12}>
            <Text strong>Discount:</Text> ₹{record.discount}
          </Col>
        </Row>
      )}

      {record.payments?.length > 0 && renderPayments(record.payments)}

      {record.notes && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Notes:</Text> {record.notes}
        </div>
      )}
    </div>
  );

  const renderOrderItems = (items) => (
    <Card title="Order Items" size="small" style={{ marginBottom: 16 }}>
      <Table
        dataSource={items}
        pagination={false}
        rowKey={(record) => record._id || record.itemId}
        columns={[
          { title: "Item", dataIndex: "name", key: "name" },
          {
            title: "Price",
            dataIndex: "price",
            key: "price",
            render: (price) => `₹${price}`,
          },
          { title: "Quantity", dataIndex: "quantity", key: "quantity" },
          { title: "Packets", dataIndex: "packets", key: "packets" },
          {
            title: "Total",
            dataIndex: "total",
            key: "total",
            render: (total) => `₹${total}`,
          },
        ]}
      />
    </Card>
  );

  const renderPayments = (payments) => (
    <Card title="Payment History" size="small" style={{ marginBottom: 16 }}>
      <Table
        dataSource={payments}
        pagination={false}
        rowKey={(record, index) => index}
        columns={[
          {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (amount) => `₹${amount}`,
          },
          {
            title: "Method",
            dataIndex: "method",
            key: "method",
          },
        ]}
      />
    </Card>
  );

  const InvoiceTemplate = ({ invoiceData, formValues }) => {
    // Use the formValues prop to get the most up-to-date data
    const items = formValues.items || [];
    const discount = formValues.discount || 0;

    const totalAmount =
      items.reduce((sum, item) => sum + item.price * item.quantity, 0) -
      discount;

    // Format date with native JavaScript
    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(d);
    };

    return (
      <div style={{ padding: 20, backgroundColor: "white" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Title level={2}>Bharati Sweets Invoice</Title>
          <Text>GST No: 21BQIPP9883R1ZQ</Text>
          <br />
          <Text>Invoice No: {invoiceData.invoiceNumber}</Text>
          <br />
          <Text>Date: {formatDate(invoiceData.invoiceDate)}</Text>
        </div>

        <Divider />

        <Row gutter={16}>
          <Col span={12}>
            <Title level={4}>Bill To:</Title>
            <Text strong>{invoiceData.customerName}</Text>
            <br />
            <Text>{invoiceData.customerPhone}</Text>
            <br />
            <Text>{invoiceData.customerAddress}</Text>
          </Col>
          <Col span={12}>
            <Title level={4}>Order Details:</Title>
            <Text>Order ID: {invoiceData.orderId}</Text>
            <br />
            <Text>Event: {invoiceData.purpose}</Text>
            <br />
            <Text>Packets: {invoiceData.packets || 1}</Text>
            <br />
            <Text>
              Delivery: {formatDate(invoiceData.deliveryDate)} at{" "}
              {invoiceData.deliveryTime}
            </Text>
          </Col>
        </Row>

        <Divider />

        <Table
          dataSource={items}
          pagination={false}
          rowKey={(record) => record.itemId}
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
              key: "total",
              render: (_, record) =>
                `₹${(record.price || 0) * (record.quantity || 0)}`,
            },
          ]}
        />

        <Divider />

        <Row gutter={16} style={{ marginTop: 20 }}>
          <Col span={12}></Col>
          <Col span={12}>
            {discount > 0 && (
              <div style={{ marginBottom: 10 }}>
                <Text>
                  Subtotal: ₹
                  {items.reduce(
                    (sum, item) =>
                      sum + (item.price || 0) * (item.quantity || 0),
                    0
                  )}
                </Text>
                <br />
                <Text>Discount: ₹{discount}</Text>
              </div>
            )}
            <Title level={4}>Total: ₹{totalAmount}</Title>
            <Text>Paid: ₹{invoiceData.paidAmount || 0}</Text>
            <br />
            <Text strong>
              Balance: ₹{totalAmount - (invoiceData.paidAmount || 0)}
            </Text>
          </Col>
        </Row>

        <Divider />

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <Text>Thank you for your business!</Text>
          <br />
          <Text>
            Bharati Sweets • Phone: +91 70080 84419 • Address: By-Pass, Dala,
            Byasanagar, Odisha 755019
          </Text>
        </div>
      </div>
    );
  };

  return (
    <div>
      <style>
        {`
          @media print {
            body > *:not(#invoiceWrapper) {
              display: none !important;
            }
            #invoiceWrapper {
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
              margin: 0;
            }
          }
        `}
      </style>
      <Card style={{ height: "100%" }}>
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              borderRadius: 8,
              marginBottom: 20,
              flexWrap: "wrap",
              gap: "8px",
              padding: "12px 16px",
            }}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Create New Order
            </Button>
          </div>

          {/* Filters */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
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

          {/* Table always fills remaining height */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Table
              style={{ flex: 1 }}
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
                rowExpandable: () => true,
              }}
            />
          </div>
        </div>
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
        confirmLoading={isLoading}
        width={900}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            orderStatus: "pending",
            packets: 1,
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
                  { required: true, message: "Please enter event purpose" },
                ]}
              >
                <Input placeholder="Enter event purpose" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="packets"
                label="Number of Packets"
                rules={[
                  { required: true, message: "Please enter number of packets" },
                ]}
              >
                <InputNumber
                  min={1}
                  placeholder="Packets"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
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
                    style={{
                      display: "flex",
                      marginBottom: 8,
                      alignItems: "flex-start",
                    }}
                    align="baseline"
                  >
                    <Form.Item
                      {...restField}
                      name={[name, "itemId"]}
                      label="Select item"
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
                      label="Quantity (kg/pcs)"
                      rules={[{ required: true, message: "Enter quantity" }]}
                    >
                      <InputNumber
                        min={0.1}
                        step={0.1}
                        placeholder="Qty"
                        style={{ width: 120 }}
                      />
                    </Form.Item>

                    <Button
                      type="dashed"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      style={{ marginTop: 30 }}
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

          <Form.Item name="discount" label="Discount Amount (₹)">
            <InputNumber
              min={0}
              placeholder="Discount amount"
              style={{ width: "100%" }}
              prefix="₹"
            />
          </Form.Item>

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
                      const items = getFieldValue("items") || [];
                      const discount = getFieldValue("discount") || 0;
                      const total =
                        items.reduce(
                          (sum, item) =>
                            sum + (item.price * item.quantity || 0),
                          0
                        ) - discount;

                      if (value && value > total) {
                        return Promise.reject(
                          new Error(
                            "Payment amount cannot exceed total order value"
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  placeholder="Payment amount"
                  style={{ width: "100%" }}
                  prefix="₹"
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
                <Select
                  placeholder="Select method"
                  onChange={(value) => setPaymentMethod(value)}
                >
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
            <Form.Item
              name="cardId"
              label="Card ID"
              rules={[{ required: true, message: "Please enter Card ID" }]}
            >
              <Input placeholder="Enter Card ID" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        title={`Record Payment for Order ${
          currentOrder?._id?.substring(0, 8) || ""
        }`}
        open={isPaymentModalVisible}
        onOk={handlePaymentSubmit}
        onCancel={() => setIsPaymentModalVisible(false)}
        okText="Record Payment"
        confirmLoading={isLoading}
      >
        <Form form={paymentForm} layout="vertical">
          <Form.Item
            name="amount"
            label="Payment Amount"
            rules={[
              { required: true, message: "Please enter payment amount" },
              {
                type: "number",
                min: 0.01,
                message: "Amount must be a positive number",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    value &&
                    value > currentOrder.totalAmount - currentOrder.paidAmount
                  ) {
                    return Promise.reject(
                      new Error("Amount cannot exceed the balance due")
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              prefix="₹"
              placeholder="Enter amount"
            />
          </Form.Item>
          <Form.Item
            name="method"
            label="Payment Method"
            rules={[
              { required: true, message: "Please select payment method" },
            ]}
          >
            <Select
              placeholder="Select method"
              onChange={(value) => setPaymentMethod(value)}
            >
              {paymentMethods.map((method) => (
                <Option key={method.value} value={method.value}>
                  {method.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {paymentMethod === "card" && (
            <Form.Item
              name="cardId"
              label="Card ID"
              rules={[{ required: true, message: "Please enter Card ID" }]}
            >
              <Input placeholder="Enter Card ID" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Invoice Modal */}
      <Modal
        title={`Invoice for Order ${currentOrder?._id?.substring(0, 8) || ""}`}
        open={isInvoiceModalVisible}
        onCancel={() => setIsInvoiceModalVisible(false)}
        okText="Print Invoice"
        onOk={handlePrint}
        width={900}
        ot
        window
        print
      >
        <Form form={invoiceForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="invoiceNumber" label="Invoice Number">
                <Input readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="invoiceDate" label="Invoice Date">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  readOnly
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerName" label="Customer Name">
                <Input readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customerPhone" label="Customer Phone">
                <Input readOnly />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="customerAddress" label="Customer Address">
            <TextArea readOnly />
          </Form.Item>

          <Divider>Invoice Items</Divider>
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
                      name={[name, "name"]}
                      label="Item"
                    >
                      <Input readOnly />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "price"]}
                      label="Price"
                      rules={[{ required: true, message: "Price is required" }]}
                    >
                      <InputNumber min={0} prefix="₹" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "quantity"]}
                      label="Quantity"
                      rules={[
                        { required: true, message: "Quantity is required" },
                      ]}
                    >
                      <InputNumber min={0.1} step={0.1} />
                    </Form.Item>
                  </Space>
                ))}
              </>
            )}
          </Form.List>

          <Form.Item name="discount" label="Discount Amount (₹)">
            <InputNumber min={0} style={{ width: "100%" }} prefix="₹" />
          </Form.Item>
        </Form>
        <div
          id="invoiceWrapper"
          style={{
            padding: "20px",
            border: "1px solid #f0f0f0",
            marginTop: "20px",
          }}
        >
          {currentOrder && (
            <InvoiceTemplate
              invoiceData={{
                ...currentOrder,
                ...invoiceForm.getFieldsValue(),
              }}
              formValues={{
                items: invoiceFormItems,
                discount: invoiceFormDiscount,
              }}
            />
          )}
        </div>
      </Modal>

      {/* Invoice Modal */}
      <Modal
        title={`Generate Invoice for Order ${
          currentOrder?._id?.substring(0, 8) || ""
        }`}
        open={isInvoiceModalVisible}
        onCancel={() => setIsInvoiceModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsInvoiceModalVisible(false)}>
            Cancel
          </Button>,
          <ReactToPrint
            key="print"
            trigger={() => (
              <Button type="primary" icon={<PrinterOutlined />}>
                Print Invoice
              </Button>
            )}
            content={() => invoiceRef.current}
          />,
        ]}
        width={800}
      >
        <Form form={invoiceForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="invoiceNumber"
                label="Invoice Number"
                rules={[
                  { required: true, message: "Please enter invoice number" },
                ]}
              >
                <Input placeholder="Invoice number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="invoiceDate"
                label="Invoice Date"
                rules={[
                  { required: true, message: "Please select invoice date" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[
                  { required: true, message: "Please enter customer name" },
                ]}
              >
                <Input placeholder="Customer name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerPhone"
                label="Customer Phone"
                rules={[
                  { required: true, message: "Please enter customer phone" },
                ]}
              >
                <Input placeholder="Customer phone" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="customerAddress"
            label="Customer Address"
            rules={[
              { required: true, message: "Please enter customer address" },
            ]}
          >
            <TextArea rows={2} placeholder="Customer address" />
          </Form.Item>
        </Form>

        <div style={{ display: "none" }}>
          <InvoiceTemplate
            ref={invoiceRef}
            order={currentOrder}
            invoiceData={invoiceForm.getFieldsValue()}
          />
        </div>
      </Modal>
    </div>
  );
};

export default EventOrders;
