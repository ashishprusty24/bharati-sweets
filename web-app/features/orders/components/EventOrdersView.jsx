"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, Input, Button, Select, DatePicker, message, Row, Col, Typography } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import EventOrdersTable from "./EventOrdersTable";
import EventOrderModal from "./EventOrderModal";
import EventPaymentModal from "./EventPaymentModal";
import InvoiceModal from "./InvoiceModal";
import ChefSlipModal from "./ChefSlipModal";
import EventOrderDetails from "./EventOrderDetails";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "#f59e0b" },
  { value: "confirmed", label: "Confirmed", color: "#3b82f6" },
  { value: "preparing", label: "Preparing", color: "#06b6d4" },
  { value: "ready", label: "Ready", color: "#8b5cf6" },
  { value: "delivered", label: "Delivered", color: "#10b981" },
  { value: "cancelled", label: "Cancelled", color: "#ef4444" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "#f59e0b" },
  { value: "partial", label: "Partial", color: "#3b82f6" },
  { value: "paid", label: "Paid", color: "#10b981" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "phonepay", label: "PhonePe" },
  { value: "gpay", label: "Google Pay" },
  { value: "card", label: "Credit/Debit Card" },
];

const PURPOSE_OPTIONS = ["Wedding", "Birthday", "Anniversary", "Corporate Event", "Religious Ceremony", "Thread Ceremony", "Rice Ceremony", "Other"];
const DELIVERY_TIME_OPTIONS = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"];

export default function EventOrdersView() {
  const [orders, setOrders] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [occasionFilter, setOccasionFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isChefSlipModalVisible, setIsChefSlipModalVisible] = useState(false);

  const [editingOrder, setEditingOrder] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oRes, iRes] = await Promise.all([
        fetch("/api/event-orders"),
        fetch("/api/inventory"),
      ]);
      const oData = await oRes.json();
      const iData = await iRes.json();
      setOrders(oData || []);
      setInventoryItems(iData || []);
    } catch (err) {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let result = [...orders];

    if (searchText) {
      result = result.filter(
        (o) =>
          o.customerName?.toLowerCase().includes(searchText.toLowerCase()) ||
          o.customerPhone?.includes(searchText) ||
          o.phone?.includes(searchText) ||
          o._id?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (occasionFilter !== "all") {
      result = result.filter((o) => o.purpose === occasionFilter);
    }

    return result;
  }, [orders, searchText, statusFilter, occasionFilter]);

  const handleAddEdit = (order = null) => {
    setEditingOrder(order);
    setIsOrderModalVisible(true);
  };

  const handlePay = (order) => {
    setCurrentOrder(order);
    setIsPaymentModalVisible(true);
  };

  const handleInvoice = (order) => {
    setCurrentOrder(order);
    setIsInvoiceModalVisible(true);
  };

  const handleChefSlip = (order) => {
    setCurrentOrder(order);
    setIsChefSlipModalVisible(true);
  };

  const sendWhatsAppConfirmation = (orderData) => {
    const custName = orderData.customerName || "Valued Customer";
    const delDate = orderData.deliveryDate ? dayjs(orderData.deliveryDate).format("DD MMM YYYY") : "N/A";
    const delTime = orderData.deliveryTime || "N/A";
    const purpose = orderData.purpose || "Event";
    const addr = orderData.address || "N/A";
    const total = Number(orderData.totalAmount || 0);
    const advance = Number(orderData.advancePayment || orderData.advancePaid || 0);
    const due = total - advance;

    const itemsSummary = (orderData.items || []).map(i => `• ${i.name || "Sweet Item"}: ${i.quantity || 1} x ₹${i.price || 0}`).join("\n");

    const text = `*BHARATI SWEETS - Event Order Confirmation* 🙏

Namaste ${custName}!
Your event order has been successfully booked.

📅 *Delivery Date:* ${delDate}
⏰ *Delivery Time:* ${delTime}
🎉 *Purpose:* ${purpose}
📍 *Address:* ${addr}

*Order Items:*
${itemsSummary}

💰 *Total Amount:* ₹${total.toLocaleString("en-IN")}
💵 *Advance Paid:* ₹${advance.toLocaleString("en-IN")}
❗ *Remaining Due:* ₹${due.toLocaleString("en-IN")}

Thank you for choosing Bharati Sweets! 🍬`;

    const phone = (orderData.phone || orderData.customerPhone || "").replace(/[^0-9]/g, "");
    const url = phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleOrderSave = async (values) => {
    if (savingOrder) return;
    setSavingOrder(true);
    try {
      const items = (values.items || []).map((item) => ({
        ...item,
        name: inventoryItems.find((i) => i._id === item.itemId)?.name || "Sweet Item",
        total: (item.price || item.unitPrice || 0) * (item.quantity || 1),
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      const orderData = {
        ...values,
        customerPhone: values.phone,
        items,
        totalAmount: values.totalAmount || totalAmount,
        advancePaid: values.advancePayment || 0,
        eventDate: values.deliveryDate ? values.deliveryDate.toISOString() : new Date().toISOString(),
      };

      const res = await fetch("/api/event-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error("Failed to save order");

      message.success("Order saved successfully!");
      setIsOrderModalVisible(false);
      
      // Trigger WhatsApp confirmation
      sendWhatsAppConfirmation(orderData);
      
      fetchData();
    } catch (error) {
      message.error("Failed to save order");
    } finally {
      setSavingOrder(false);
    }
  };

  const handlePaymentSave = async (paymentData) => {
    try {
      message.success("Payment recorded");
      setIsPaymentModalVisible(false);
      fetchData();
    } catch (error) {
      message.error("Failed to record payment");
    }
  };

  const handleDelete = async (id) => {
    try {
      message.success("Order deleted");
      fetchData();
    } catch (error) {
      message.error("Failed to delete order");
    }
  };

  return (
    <div style={{ padding: "0 8px" }}>
      <div className="page-header-container">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Event Orders</Title>
          <Text type="secondary">Manage large bookings, delivery schedules, and payments.</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => handleAddEdit()}
          style={{ borderRadius: 10, height: 45, padding: "0 24px" }}
        >
          New Booking
        </Button>
      </div>

      <Card variant="borderless" className="glass-card" style={{ borderRadius: 20 }}>
        <Row gutter={[16, 16]} className="search-filter-row">
          <Col xs={24} md={8}>
            <Input
              placeholder="Search orders..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              style={{ height: 45, borderRadius: 12, background: "#f8fafc" }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: "100%", height: 45 }}>
              <Option value="all">All Status</Option>
              {ORDER_STATUS_OPTIONS.map((o) => <Option key={o.value} value={o.value}>{o.label}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select value={occasionFilter} onChange={setOccasionFilter} style={{ width: "100%", height: 45 }}>
              <Option value="all">All Occasions</Option>
              {PURPOSE_OPTIONS.map((p) => <Option key={p} value={p}>{p}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              onChange={setDateRange}
              style={{ width: "100%", height: 45, borderRadius: 12 }}
            />
          </Col>
        </Row>

        <div className="responsive-table-container">
          <EventOrdersTable
            data={filteredOrders}
            loading={loading}
            orderStatusOptions={ORDER_STATUS_OPTIONS}
            paymentStatusOptions={PAYMENT_STATUS_OPTIONS}
            onEdit={handleAddEdit}
            onDelete={handleDelete}
            onPay={handlePay}
            onGenerateInvoice={handleInvoice}
            onGenerateChefSlip={handleChefSlip}
            expandedRowRender={(record) => <EventOrderDetails record={record} />}
          />
        </div>
      </Card>

      {isOrderModalVisible && (
        <EventOrderModal
          visible={isOrderModalVisible}
          item={editingOrder}
          inventoryItems={inventoryItems}
          purposeOptions={PURPOSE_OPTIONS}
          deliveryTimeOptions={DELIVERY_TIME_OPTIONS}
          orderStatusOptions={ORDER_STATUS_OPTIONS}
          loading={savingOrder}
          onCancel={() => setIsOrderModalVisible(false)}
          onOk={handleOrderSave}
        />
      )}

      {isPaymentModalVisible && (
        <EventPaymentModal
          visible={isPaymentModalVisible}
          order={currentOrder}
          paymentMethods={PAYMENT_METHODS}
          loading={loading}
          onCancel={() => setIsPaymentModalVisible(false)}
          onOk={handlePaymentSave}
        />
      )}

      {isInvoiceModalVisible && (
        <InvoiceModal
          visible={isInvoiceModalVisible}
          order={currentOrder}
          onCancel={() => setIsInvoiceModalVisible(false)}
        />
      )}

      {isChefSlipModalVisible && (
        <ChefSlipModal
          visible={isChefSlipModalVisible}
          order={currentOrder}
          onCancel={() => setIsChefSlipModalVisible(false)}
        />
      )}
    </div>
  );
}
