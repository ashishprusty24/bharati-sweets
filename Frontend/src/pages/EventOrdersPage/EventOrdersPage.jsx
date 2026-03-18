import React, { useState, useMemo } from "react";
import { Card, Input, Button, Select, DatePicker, message, Row, Col, Space , Typography, Modal } from "antd";
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

const PURPOSE_OPTIONS = ["Wedding", "Birthday", "Anniversary", "Corporate Event", "Religious Ceremony", "Other"];
const DELIVERY_TIME_OPTIONS = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"];

const EventOrdersPage = () => {
  const { data: ordersData, loading, refetch } = useFetch("/event-orders/list");
  const { data: inventoryData } = useFetch("/inventory/list");
  
  const orders = ordersData ?? [];
  const inventoryItems = inventoryData ?? [];
  
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isChefSlipModalVisible, setIsChefSlipModalVisible] = useState(false);
  
  const [editingOrder, setEditingOrder] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let result = [...orders];

    if (searchText) {
      result = result.filter(o => 
        o.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
        o.phone.includes(searchText) ||
        o._id.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(o => o.orderStatus === statusFilter);
    }

    if (dateRange && dateRange.length === 2) {
      const start = dateRange[0].startOf("day");
      const end = dateRange[1].endOf("day");
      result = result.filter(o => dayjs(o.deliveryDate).isBetween(start, end, null, "[]"));
    }

    return result;
  }, [orders, searchText, statusFilter, dateRange]);

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
        deliveryDate: values.deliveryDate.toISOString()
      };

      if (editingOrder) {
        await api.put(`/event-orders/${editingOrder._id}/update`, orderData);
        message.success("Order updated successfully");
        Modal.confirm({
          title: "Resend Bill?",
          content: "Would you like to resend the updated bill to the customer via WhatsApp?",
          okText: "Yes, Send",
          cancelText: "No",
          onOk: () => {
             const text = `Namaste! Your order #${editingOrder._id.slice(-6).toUpperCase()} has been updated.\nTotal Amount: ₹${totalAmount}.\nAdvance Paid: ₹${editingOrder.paidAmount || 0}\nBalance Due: ₹${totalAmount - (editingOrder.paidAmount || 0)}`;
             window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
          }
        });
      } else {
        await api.post("/event-orders/create", orderData);
        message.success("Order created successfully");
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
      message.success("Payment recorded successfully");
      setIsPaymentModalVisible(false);
      refetch();
    } catch (error) {
      console.error(error);
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
          <Col xs={24} lg={12} className="header-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
          <Col xs={24} sm={12} md={4}>
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
          <Col xs={24} sm={12} md={12}>
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
          purposeOptions={PURPOSE_OPTIONS}
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
          onCancel={() => setIsChefSlipModalVisible(false)}
        />
      )}
    </div>
  );
};

export default EventOrdersPage;
