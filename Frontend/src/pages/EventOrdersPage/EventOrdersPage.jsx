import React, { useState, useMemo } from "react";
import { Card, Input, Button, Select, DatePicker, message, Row, Col, Space, Typography, Modal } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);
import useFetch from "../../hooks/useFetch";
import api from "../../services/api";
import EventOrdersTable from "./components/EventOrdersTable";
import EventOrderModal from "./components/EventOrderModal";
import EventPaymentModal from "./components/EventPaymentModal";
import InvoiceModal from "./components/InvoiceModal";
import ChefSlipModal from "./components/ChefSlipModal";
import EventOrderDetails from "./components/EventOrderDetails";
import PreparationReportModal from "../../components/common/PreparationReportModal/PreparationReportModal";
import { formatWhatsAppPhone } from "../MarketingPage/config";

const { RangePicker } = DatePicker;
const { Option } = Select;

const { Title, Text } = Typography;

const DEFAULT_PURPOSE_OPTIONS = [
  "Marriage",
  "Reception",
  "Engagement / Ring Ceremony",
  "Birthday Party",
  "Anniversary",
  "Thread Ceremony (Upanayana)",
  "Baby Shower (Sadh)",
  "Corporate Event",
  "Festival Celebration",
  "Other Celebration",
];

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

const DELIVERY_TIME_OPTIONS = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"];

const EventOrdersPage = () => {
  const { data: ordersData, loading, refetch } = useFetch("/event-orders/list");
  const { data: inventoryData } = useFetch("/inventory/list");

  const orders = ordersData ?? [];
  const inventoryItems = inventoryData ?? [];

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

  const allPurposeOptions = useMemo(() => {
    const fromOrders = (orders || []).map((o) => (o.purpose || "").trim()).filter(Boolean);
    return Array.from(new Set([...DEFAULT_PURPOSE_OPTIONS, ...fromOrders]));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let result = [...orders];

    if (searchText) {
      const q = searchText.toLowerCase().trim();
      result = result.filter((o) =>
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.phone || "").includes(q) ||
        (o.customerPhone || "").includes(q) ||
        (o._id || "").toLowerCase().includes(q) ||
        (o.purpose || "").toLowerCase().includes(q) ||
        (o.address || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((o) => o.orderStatus === statusFilter || o.status === statusFilter);
    }

    if (occasionFilter !== "all") {
      const targetOccasion = occasionFilter.toLowerCase().trim();
      result = result.filter((o) => {
        const p = (o.purpose || "").toLowerCase().trim();
        return p === targetOccasion || p.includes(targetOccasion);
      });
    }

    if (dateRange && dateRange.length === 2) {
      const start = dateRange[0].startOf("day");
      const end = dateRange[1].endOf("day");
      result = result.filter((o) => dayjs(o.deliveryDate || o.eventDate).isBetween(start, end, null, "[]"));
    }

    return result;
  }, [orders, searchText, statusFilter, occasionFilter, dateRange]);

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

  const handleOrderSave = async (values) => {
    try {
      const packets = values.packets || 1;
      const discount = values.discount || 0;

      const items = values.items.map(item => ({
        ...item,
        name: inventoryItems.find(i => i._id === item.itemId)?.name || "Unknown",
        total: item.price * item.quantity
      }));

      const subtotalPerPacket = items.reduce((sum, item) => sum + item.total, 0);
      const subtotal = subtotalPerPacket * packets;
      const totalAmount = subtotal - (discount * packets);

      const orderData = {
        ...values,
        items,
        subtotal,
        totalAmount,
        deliveryDate: values.deliveryDate.format("YYYY-MM-DD"),
      };

      const advanceAmt = Number(values.advancePayment || 0);
      if (editingOrder) {
        orderData.payments = editingOrder.payments || [];
        orderData.paidAmount = editingOrder.paidAmount || (editingOrder.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
        orderData.advancePaid = orderData.paidAmount;
      } else if (advanceAmt > 0 && values.advancePaymentMethod) {
        orderData.payments = [{
          amount: advanceAmt,
          method: values.advancePaymentMethod,
          timestamp: new Date()
        }];
        orderData.paidAmount = advanceAmt;
        orderData.advancePaid = advanceAmt;
      }

      if (editingOrder) {
        await api.put(`/event-orders/${editingOrder._id}/update`, orderData);
        message.success("Order updated — WhatsApp invoice sent to customer automatically!");
      } else {
        await api.post("/event-orders/create", orderData);
        message.success("Order created — WhatsApp booking receipt sent to customer automatically!");
      }

      // Handle Smart CRM Reminder
      console.log("Checking setReminder flag:", values.setReminder);
      if (values.setReminder) {
        try {
          const reminderPayload = {
            customerName: values.customerName,
            secondaryName: values.reminderSecondaryName || "",
            phone: values.phone,
            eventType: values.reminderEventType,
            eventDate: values.reminderEventDate,
            notes: `Created from Event Order: ${values.purpose}`
          };
          console.log("Sending reminder payload:", reminderPayload);
          await api.post("/reminders", reminderPayload);
          message.success("Smart CRM Reminder saved successfully!");
        } catch (remErr) {
          console.error("Failed to save reminder:", remErr);
          message.error("Order saved, but failed to save CRM reminder.");
        }
      } else {
        console.log("setReminder was false or undefined. Value was:", values.setReminder);
      }

      setIsOrderModalVisible(false);
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const handlePaymentSave = async (paymentData) => {
    try {
      await api.post(`/event-orders/${currentOrder._id}/payments`, paymentData);
      message.success("Payment recorded — WhatsApp invoice sent to customer automatically!");
      setIsPaymentModalVisible(false);
      refetch();
    } catch (error) {
      console.error(error);
      message.error("Failed to record payment");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/event-orders/${id}/delete`);
      message.success("Order deleted successfully");
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: "0 8px" }}>
      <div className="page-header-container">
        <Row gutter={[12, 12]} align="middle" justify="space-between" style={{ width: "100%" }}>
          <Col xs={24} lg={12}>
            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Event Orders</Title>
            <Text type="secondary">Manage large bookings, delivery schedules, and payments.</Text>
          </Col>
          <Col xs={24} lg={12} className="header-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <PreparationReportModal />
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => handleAddEdit()}
              className="new-booking-btn"
              style={{ borderRadius: 10, height: 45, padding: "0 24px", flex: "0 0 auto" }}
            >
              New Booking
            </Button>
          </Col>
        </Row>
      </div>

      <Card bordered={false} className="glass-card" style={{ borderRadius: 20 }}>
        <Row gutter={[16, 16]} className="search-filter-row">
          <Col xs={24} md={8}>
            <Input
              placeholder="Search orders..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              style={{ height: 45, borderRadius: 12, background: "#f8fafc" }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%", height: 45 }}
              dropdownStyle={{ borderRadius: 12 }}
            >
              <Option value="all">All Status</Option>
              {ORDER_STATUS_OPTIONS.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              value={occasionFilter}
              onChange={setOccasionFilter}
              style={{ width: "100%", height: 45 }}
              dropdownStyle={{ borderRadius: 12 }}
            >
              <Option value="all">All Occasions</Option>
              {allPurposeOptions.map(p => <Option key={p} value={p}>{p}</Option>)}
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
          inventoryItems={inventoryItems || []}
          purposeOptions={allPurposeOptions}
          deliveryTimeOptions={DELIVERY_TIME_OPTIONS}
          orderStatusOptions={ORDER_STATUS_OPTIONS}
          loading={loading}
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
          inventoryItems={inventoryItems || []}
          onCancel={() => setIsChefSlipModalVisible(false)}
        />
      )}
    </div>
  );
};

export default EventOrdersPage;
