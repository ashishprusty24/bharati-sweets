import React, { useState, useMemo } from "react";
import { Card, Input, Button, Tag, message, Typography } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import useFetch from "../../hooks/useFetch";
import api from "../../services/api";
import RegularOrdersTable from "./components/RegularOrdersTable";
import RegularOrderModal from "./components/RegularOrderModal";

const { Title, Text } = Typography;

const RegularOrdersPage = () => {
  const { data: orders, loading, refetch } = useFetch("/regular-orders/list");
  const { data: inventoryItems } = useFetch("/inventory/list");
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "phonepay", label: "PhonePe" },
    { value: "gpay", label: "Google Pay" },
    { value: "card", label: "Credit/Debit Card" },
  ];

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!searchText) return orders;
    const lowerSearch = searchText.toLowerCase();
    return orders.filter(o => 
      o.customerName.toLowerCase().includes(lowerSearch) ||
      o.phone.includes(searchText) ||
      o._id.toLowerCase().includes(lowerSearch)
    );
  }, [orders, searchText]);

  const handleAddEdit = (order = null) => {
    setEditingOrder(order);
    setIsModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      const items = values.items.map(item => ({
        ...item,
        name: inventoryItems.find(i => i._id === item.itemId)?.name || "Unknown",
        total: item.price * item.quantity
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      const orderData = {
        customerName: values.customerName,
        phone: values.phone,
        items,
        payment: {
          amount: values.paymentAmount,
          method: values.paymentMethod,
          ...(values.paymentMethod === "card" && { cardId: values.cardId }),
        },
        totalAmount,
      };

      if (editingOrder) {
        await api.put(`/regular-orders/${editingOrder._id}/update`, orderData);
        message.success("Order updated successfully");
      } else {
        await api.post("/regular-orders/create", orderData);
        message.success("Order created successfully");
      }
      setIsModalVisible(false);
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/regular-orders/${id}/delete`);
      message.success("Order deleted successfully");
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const getPaymentMethodTag = (method) => {
    const info = paymentMethods.find(m => m.value === method);
    const colors = {
      cash: "#10b981",
      phonepay: "#722ed1",
      gpay: "#1890ff",
      card: "#f59e0b",
    };
    return (
      <Tag style={{ 
        color: colors[method] || "#64748b", 
        background: `${colors[method]}1a` || "#f1f5f9",
        border: `1px solid ${colors[method]}33` || "#e2e8f0",
        borderRadius: 6,
        fontWeight: 600
      }}>
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

      <Card bordered={false} className="glass-card" style={{ borderRadius: 20 }}>
        <div className="search-filter-row">
          <Input
            placeholder="Search by customer, phone, or ID..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            style={{ 
              maxWidth: 350, 
              width: "100%",
              height: 45, 
              borderRadius: 12,
              background: "#f8fafc",
              border: "1px solid #e2e8f0"
            }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="responsive-table-container">
          <RegularOrdersTable
            data={filteredOrders}
            loading={loading}
            onEdit={handleAddEdit}
            onDelete={handleDelete}
            getPaymentMethodTag={getPaymentMethodTag}
          />
        </div>
      </Card>

      <RegularOrderModal
        visible={isModalVisible}
        item={editingOrder}
        inventoryItems={inventoryItems || []}
        paymentMethods={paymentMethods}
        loading={loading}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSave}
      />
    </div>
  );
};

export default RegularOrdersPage;
