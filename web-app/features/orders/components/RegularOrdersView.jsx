"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, Input, Button, Tag, message, Typography } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import RegularOrdersTable from "./RegularOrdersTable";
import RegularOrderModal from "./RegularOrderModal";
import RegularKOTModal from "./RegularKOTModal";

const { Title, Text } = Typography;

export default function RegularOrdersView() {
  const [orders, setOrders] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isKOTVisible, setIsKOTVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "phonepay", label: "PhonePe" },
    { value: "gpay", label: "Google Pay" },
    { value: "card", label: "Credit/Debit Card" },
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [oRes, iRes] = await Promise.all([
        fetch("/api/regular-orders"),
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
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!searchText) return orders;
    const lowerSearch = searchText.toLowerCase();
    return orders.filter(
      (o) =>
        o.customerName?.toLowerCase().includes(lowerSearch) ||
        o.phone?.includes(searchText) ||
        o._id?.toLowerCase().includes(lowerSearch)
    );
  }, [orders, searchText]);

  const handleAddEdit = (order = null) => {
    setEditingOrder(order);
    setIsModalVisible(true);
  };

  const handleKOT = (order) => {
    setCurrentOrder(order);
    setIsKOTVisible(true);
  };

  const handleSave = async (values) => {
    try {
      const items = (values.items || []).map((item) => ({
        ...item,
        name: inventoryItems.find((i) => i._id === item.itemId)?.name || "Unknown",
        total: (item.price || 0) * (item.quantity || 1),
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      const orderData = {
        customerName: values.customerName,
        customerPhone: values.phone,
        items,
        totalAmount,
        payment: {
          amount: values.paymentAmount || totalAmount,
          method: values.paymentMethod || "cash",
        },
      };

      await fetch("/api/regular-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      message.success("Order created successfully");
      setIsModalVisible(false);
      fetchOrders();
    } catch (error) {
      console.error(error);
      message.error("Failed to save order");
    }
  };

  const getPaymentMethodTag = (method) => {
    const info = paymentMethods.find((m) => m.value === method);
    const colors = {
      cash: "#10b981",
      phonepay: "#722ed1",
      gpay: "#1890ff",
      card: "#f59e0b",
    };
    return (
      <Tag
        style={{
          color: colors[method] || "#64748b",
          background: colors[method] ? `${colors[method]}1a` : "#f1f5f9",
          border: colors[method] ? `1px solid ${colors[method]}33` : "1px solid #e2e8f0",
          borderRadius: 6,
          fontWeight: 600,
        }}
      >
        {info?.label || method}
      </Tag>
    );
  };

  return (
    <div style={{ padding: "0 8px" }}>
      <div className="page-header-container">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Regular Orders</Title>
          <Text type="secondary">Track daily walk-in customer sales and history.</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => handleAddEdit()}
          style={{ borderRadius: 10, height: 45, padding: "0 24px" }}
        >
          Create New Order
        </Button>
      </div>

      <Card variant="borderless" className="glass-card" style={{ borderRadius: 20 }}>
        <div className="search-filter-row">
          <Input
            placeholder="Search by customer, phone, or ID..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            style={{ maxWidth: 350, width: "100%", height: 45, borderRadius: 12, background: "#f8fafc" }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="responsive-table-container">
          <RegularOrdersTable
            data={filteredOrders}
            loading={loading}
            onEdit={handleAddEdit}
            onKOT={handleKOT}
            getPaymentMethodTag={getPaymentMethodTag}
          />
        </div>
      </Card>

      <RegularOrderModal
        visible={isModalVisible}
        item={editingOrder}
        inventoryItems={inventoryItems}
        paymentMethods={paymentMethods}
        loading={loading}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSave}
      />

      <RegularKOTModal
        visible={isKOTVisible}
        order={currentOrder}
        onCancel={() => setIsKOTVisible(false)}
      />
    </div>
  );
}
