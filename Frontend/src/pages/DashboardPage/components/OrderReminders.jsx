import React, { useMemo } from "react";
import { Card, List, Tag, Typography, Empty, Alert, Space } from "antd";
import { ClockCircleOutlined, PhoneOutlined } from "@ant-design/icons";
import useFetch from "../../../hooks/useFetch";
import dayjs from "dayjs";

import EmptyState from "./EmptyState";

const { Text } = Typography;

const OrderReminders = () => {
  const { data: orders, loading } = useFetch("/event-orders/list");

  const upcomingOrders = useMemo(() => {
    if (!orders) return [];
    const today = dayjs().startOf("day");
    const tomorrow = dayjs().add(1, "day").startOf("day");
    
    return orders.filter(o => {
      const isToday = dayjs(o.deliveryDate).isSame(today, "day");
      const isTomorrow = dayjs(o.deliveryDate).isSame(tomorrow, "day");
      return (isToday || isTomorrow) && 
             o.orderStatus !== "delivered" && 
             o.orderStatus !== "cancelled";
    }).sort((a, b) => dayjs(a.deliveryDate).diff(dayjs(b.deliveryDate)));
  }, [orders]);

  if (!loading && upcomingOrders.length === 0) {
    return (
      <Card 
        title={
          <Space>
            <ClockCircleOutlined style={{ color: "#94a3b8" }} />
            <span style={{ fontWeight: 700 }}>Delivery Reminders (Today & Tomorrow)</span>
          </Space>
        } 
        bordered={false}
        className="premium-shadow"
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
          <div style={{ 
            background: "#fff1f0", 
            padding: "8px", 
            borderRadius: "10px", 
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <ClockCircleOutlined style={{ color: "#ff4d4f", fontSize: "18px" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#1e293b" }}>Delivery Reminders</span>
        </Space>
      } 
      bordered={false}
      className="premium-shadow"
      style={{ borderRadius: 24, height: "100%" }}
      loading={loading}
      bodyStyle={{ padding: "0 16px" }}
    >

      <List
        dataSource={upcomingOrders}
        renderItem={order => {
          const isToday = dayjs(order.deliveryDate).isSame(dayjs().startOf("day"), "day");
          return (
            <List.Item
              actions={[
                <a href={`tel:${order.phone}`}><PhoneOutlined /> Call</a>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{order.customerName}</Text>
                    {isToday ? (
                      <Tag color="red" style={{ margin: 0 }}>Today</Tag>
                    ) : (
                      <Tag color="blue" style={{ margin: 0 }}>Tomorrow</Tag>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary"><ClockCircleOutlined /> {order.deliveryTime}</Text>
                    <Tag color="orange">{order.orderStatus}</Tag>
                  </Space>
                }
              />
              <div style={{ textAlign: "right" }}>
                <Text strong>₹{order.totalAmount}</Text>
              </div>
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default OrderReminders;
