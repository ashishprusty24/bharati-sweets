import React from "react";
import { Card, Typography, List, Space, Tag, Avatar, Badge } from "antd";
import { CalendarOutlined, ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
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
            <CalendarOutlined style={{ color: "#94a3b8" }} />
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
        renderItem={(item) => (
          <List.Item style={{ border: "none", padding: "12px 0" }}>
            <div style={{ 
              width: "100%", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              background: "#ffffff",
              padding: "16px",
              borderRadius: "20px",
              border: "1px solid #f1f5f9",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
            }}>
              <Space size="middle">
                <Avatar 
                  icon={<UserOutlined />} 
                  style={{ backgroundColor: "#f1f5f9", color: "#64748b" }} 
                />
                <div>
                  <Text strong style={{ color: "#1e293b", fontSize: "15px", display: "block" }}>
                    {item.customerName}
                  </Text>
                  <Space size="small" style={{ fontSize: "12px", color: "#64748b" }}>
                    <CalendarOutlined /> {dayjs(item.deliveryDate).format("DD MMM")}
                    <span style={{ color: "#e2e8f0" }}>|</span>
                    <ClockCircleOutlined /> {item.deliveryTime}
                  </Space>
                </div>
              </Space>
              
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "16px", marginBottom: "4px" }}>
                  ₹{(item.totalAmount || 0).toLocaleString("en-IN")}
                </div>
                <Tag color="orange" bordered={false} style={{ 
                  borderRadius: "8px", 
                  margin: 0,
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase"
                }}>
                  {item.orderStatus}
                </Tag>
              </div>
            </div>
          </List.Item>
        )}
      />
      {orders?.length > 5 && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            +{orders.length - 5} more deliveries pending
          </Text>
        </div>
      )}
    </Card>
  );
};

export default PendingOrders;

