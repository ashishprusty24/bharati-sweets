import React from "react";
import { Card, Typography, Button, Tag, Space, Avatar } from "antd";
import useFetch from "../../../hooks/useFetch";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const sampleOrders = [
  { _id: "1", purpose: "Wedding - Priya & Rahul", deliveryDate: "2025-05-21", packets: 500, totalAmount: 75000, orderStatus: "confirmed", icon: "💒", bg: "#fce7f3" },
  { _id: "2", purpose: "Corporate Event - TCS", deliveryDate: "2025-05-23", packets: 150, totalAmount: 32500, orderStatus: "upcoming", icon: "🏢", bg: "#e0e7ff" },
  { _id: "3", purpose: "Birthday - Aarav", deliveryDate: "2025-05-18", packets: 90, totalAmount: 12800, orderStatus: "completed", icon: "🎂", bg: "#ffedd5" },
  { _id: "4", purpose: "Reception - Sneha", deliveryDate: "2025-05-16", packets: 300, totalAmount: 48750, orderStatus: "completed", icon: "🤝", bg: "#d1fae5" },
];

const RecentEventOrders = () => {
  const { data: fetchedOrders, loading } = useFetch("/dashboard/pending-orders");
  const navigate = useNavigate();

  const ordersList = (fetchedOrders && fetchedOrders.length > 0)
    ? fetchedOrders.map((o, idx) => ({
        ...o,
        icon: sampleOrders[idx % 4].icon,
        bg: sampleOrders[idx % 4].bg,
      }))
    : sampleOrders;

  const renderStatusTag = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "confirmed" || s === "preparing") {
      return <Tag color="success" bordered={false} style={{ borderRadius: 12, fontWeight: 600, fontSize: 10 }}>Confirmed</Tag>;
    }
    if (s === "upcoming" || s === "pending") {
      return <Tag color="processing" bordered={false} style={{ borderRadius: 12, fontWeight: 600, fontSize: 10 }}>Upcoming</Tag>;
    }
    return <Tag color="success" style={{ borderRadius: 12, fontWeight: 600, fontSize: 10, background: "transparent", borderColor: "#10b981", color: "#10b981" }}>Completed</Tag>;
  };

  return (
    <Card 
      bordered={false}
      style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.03)", background: "#ffffff", border: "1px solid #f1f5f9", height: "100%" }}
      loading={loading}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 18 }}>
          Recent Event Orders
        </Title>
        <Button type="link" onClick={() => navigate("/event-orders")} style={{ color: "#8b5cf6", fontWeight: 600, padding: 0 }}>
          View All
        </Button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {ordersList.slice(0, 4).map((item) => (
          <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Space size={12}>
              <Avatar 
                size={38} 
                style={{ backgroundColor: item.bg || "#f8fafc", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {item.icon || "📦"}
              </Avatar>
              <div>
                <Text strong style={{ color: "#0f172a", fontSize: 13, display: "block" }}>{item.purpose}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {dayjs(item.deliveryDate).format("MMM D, YYYY")} • {item.packets || 100} People
                </Text>
              </div>
            </Space>

            <Space size={8} align="center">
              <Text strong style={{ color: "#0f172a", fontSize: 13 }}>
                ₹{(item.totalAmount || 0).toLocaleString("en-IN")}
              </Text>
              {renderStatusTag(item.orderStatus)}
            </Space>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RecentEventOrders;
