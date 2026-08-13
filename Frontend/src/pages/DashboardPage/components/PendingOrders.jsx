import React from "react";
import { Card, Typography, List, Space, Tag, Avatar, Button } from "antd";
import { CalendarOutlined, ClockCircleOutlined, UserOutlined, PhoneOutlined, WhatsAppOutlined, EnvironmentOutlined } from "@ant-design/icons";
import useFetch from "../../../hooks/useFetch";
import dayjs from "dayjs";
import EmptyState from "./EmptyState";

const { Text } = Typography;

const PendingOrders = () => {
  const { data: orders, loading } = useFetch("/dashboard/pending-orders");

  if (!loading && (!orders || orders.length === 0)) {
    return (
      <Card 
        title={
          <Space>
            <CalendarOutlined style={{ color: "#f97316" }} />
            <span style={{ fontWeight: 700 }}>Upcoming Event Deliveries</span>
          </Space>
        } 
        bordered={false}
        className="premium-shadow"
        style={{ borderRadius: 24, height: "100%" }}
      >
        <EmptyState message="No upcoming deliveries scheduled" height={220} />
      </Card>
    );
  }

  const handleWhatsAppBill = (item) => {
    const balanceDue = Math.max(0, (item.totalAmount || 0) - (item.paidAmount || 0));
    const text = `Namaste ${item.customerName}! Your Event Order (#${item._id.slice(-6).toUpperCase()}) is scheduled for delivery on ${dayjs(item.deliveryDate).format("MMM D, YYYY")} at ${item.deliveryTime}.\nTotal: ₹${item.totalAmount}\nPaid: ₹${item.paidAmount || 0}\nBalance Due: ₹${balanceDue}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Card 
      title={
        <Space>
          <div style={{ 
            background: "#fff7ed", 
            padding: "8px", 
            borderRadius: "10px", 
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <CalendarOutlined style={{ color: "#f97316", fontSize: "18px" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#1e293b" }}>Upcoming Event Deliveries</span>
        </Space>
      } 
      bordered={false}
      className="premium-shadow"
      style={{ borderRadius: 24, height: "100%" }}
      loading={loading}
    >
      <List
        dataSource={orders?.slice(0, 5) || []}
        renderItem={(item) => {
          const balanceDue = Math.max(0, (item.totalAmount || 0) - (item.paidAmount || 0));
          return (
            <List.Item style={{ border: "none", padding: "8px 0" }}>
              <div style={{ 
                width: "100%", 
                background: "#ffffff",
                padding: "14px 16px",
                borderRadius: "16px",
                border: "1px solid #f1f5f9",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <Space size="small">
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#eff6ff", color: "#3b82f6" }} />
                    <div>
                      <Text strong style={{ color: "#1e293b", fontSize: "15px" }}>{item.customerName}</Text>
                      <Tag color="volcano" style={{ marginLeft: 8, borderRadius: 6, fontSize: 10 }}>{item.purpose}</Tag>
                    </div>
                  </Space>
                  <Button 
                    type="text" 
                    icon={<WhatsAppOutlined style={{ color: "#25D366", fontSize: 18 }} />} 
                    onClick={() => handleWhatsAppBill(item)}
                    title="Send Bill via WhatsApp"
                  />
                </div>

                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <span><PhoneOutlined /> {item.phone}</span>
                  <span><CalendarOutlined /> {dayjs(item.deliveryDate).format("MMM D")} ({item.deliveryTime})</span>
                  <span><EnvironmentOutlined /> {item.address || "Shop/Workshop"}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #e2e8f0", paddingTop: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 12 }}>
                    <Text type="secondary">Paid: </Text>
                    <Text strong style={{ color: "#10b981" }}>₹{(item.paidAmount || 0).toLocaleString("en-IN")}</Text>
                    {balanceDue > 0 && (
                      <>
                        <Text type="secondary" style={{ marginLeft: 8 }}>Due: </Text>
                        <Text strong style={{ color: "#ef4444" }}>₹{balanceDue.toLocaleString("en-IN")}</Text>
                      </>
                    )}
                  </div>
                  <Text strong style={{ fontSize: 15, color: "#1e293b" }}>
                    Total: ₹{(item.totalAmount || 0).toLocaleString("en-IN")}
                  </Text>
                </div>
              </div>
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default PendingOrders;
