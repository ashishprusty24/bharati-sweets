"use client";

import React, { useState, useEffect } from "react";
import { Card, List, Tag, Typography, Space } from "antd";
import { ClockCircleOutlined, PhoneOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import EmptyState from "./EmptyState";

const { Text } = Typography;

const OrderReminders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/event-orders")
      .then((res) => res.json())
      .then((data) => setOrders(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const upcomingOrders = orders.filter(o => o.status === "pending");

  if (!loading && upcomingOrders.length === 0) {
    return (
      <Card 
        title={
          <Space>
            <ClockCircleOutlined style={{ color: "#94a3b8" }} />
            <span style={{ fontWeight: 700 }}>Delivery Reminders</span>
          </Space>
        } 
        variant="borderless"
        style={{ borderRadius: 24, height: "100%" }}
      >
        <EmptyState message="No deliveries scheduled for today or tomorrow" height={220} />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <div style={{ background: "#fff1f0", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center" }}>
            <ClockCircleOutlined style={{ color: "#ff4d4f", fontSize: "18px" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#1e293b" }}>Delivery Reminders</span>
        </Space>
      } 
      variant="borderless"
      style={{ borderRadius: 24, height: "100%" }}
      loading={loading}
    >
      <List
        dataSource={upcomingOrders.slice(0, 5)}
        renderItem={(order) => (
          <List.Item actions={[<a key="call" href={`tel:${order.customerPhone}`}><PhoneOutlined /> Call</a>]}>
            <List.Item.Meta
              title={<Text strong>{order.customerName}</Text>}
              description={dayjs(order.eventDate).format("DD MMM YYYY")}
            />
            <Text strong>₹{order.totalAmount}</Text>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default OrderReminders;
