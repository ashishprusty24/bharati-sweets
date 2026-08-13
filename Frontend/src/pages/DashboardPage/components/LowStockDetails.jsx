import React from "react";
import { Card, Typography, Button, Space, Badge, List, Tag, Progress } from "antd";
import { WarningOutlined, ArrowRightOutlined } from "@ant-design/icons";
import useFetch from "../../../hooks/useFetch";
import { useNavigate } from "react-router-dom";
import EmptyState from "./EmptyState";

const { Text } = Typography;

const LowStockDetails = () => {
  const { data: inventory, loading } = useFetch("/inventory/list");
  const navigate = useNavigate();

  const lowStockItems = (inventory || []).filter(item => {
    const minThreshold = item.minStock ?? item.minQuantity ?? 5;
    return item.status === "low-stock" || item.status === "out-of-stock" || item.quantity <= minThreshold;
  });

  if (!loading && lowStockItems.length === 0) {
    return (
      <Card 
        title={
          <Space>
            <WarningOutlined style={{ color: "#94a3b8" }} />
            <span style={{ fontWeight: 700 }}>Low Stock Restock Alerts</span>
          </Space>
        } 
        bordered={false}
        className="premium-shadow"
        style={{ borderRadius: 24, height: "100%" }}
      >
        <EmptyState message="All sweets, snacks & ingredients are well-stocked" height={220} />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <div style={{ 
            background: "#fee2e2", 
            padding: "8px", 
            borderRadius: "10px", 
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <WarningOutlined style={{ color: "#ef4444", fontSize: "18px" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#1e293b" }}>Low Stock Restock Alerts</span>
        </Space>
      } 
      bordered={false}
      className="premium-shadow"
      style={{ borderRadius: 24, height: "100%" }}
      loading={loading}
      extra={
        <Button 
          type="text" 
          onClick={() => navigate("/inventory")}
          icon={<ArrowRightOutlined />}
          style={{ color: "#3b82f6", fontWeight: 600 }}
        >
          Manage Inventory
        </Button>
      }
    >
      <List
        dataSource={lowStockItems.slice(0, 5)}
        renderItem={(item) => {
          const minThreshold = item.minStock ?? item.minQuantity ?? 5;
          const percent = Math.min(100, Math.round((item.quantity / Math.max(1, minThreshold)) * 100));
          return (
            <List.Item style={{ border: "none", padding: "8px 0" }}>
              <div style={{ 
                width: "100%", 
                background: "#ffffff",
                padding: "12px 16px",
                borderRadius: "16px",
                border: "1px solid #f1f5f9",
                boxShadow: "0 1px 4px rgba(0,0,0,0.02)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <Text strong style={{ color: "#1e293b", fontSize: "15px" }}>{item.name}</Text>
                    {item.kitchenSection && (
                      <Tag color={item.kitchenSection === "Sweets" ? "magenta" : item.kitchenSection === "Samosa Section" ? "orange" : item.kitchenSection === "Namkeen Section" ? "purple" : "cyan"} style={{ marginLeft: 8, borderRadius: 4, fontSize: 10 }}>
                        {item.kitchenSection}
                      </Tag>
                    )}
                  </div>
                  <Badge 
                    count={`${item.quantity} ${item.unit}`} 
                    style={{ 
                      backgroundColor: item.quantity <= 0 ? "#ef4444" : "#f59e0b", 
                      color: "#ffffff", 
                      fontWeight: 700,
                      borderRadius: "8px",
                      padding: "0 10px",
                      height: "26px",
                      lineHeight: "26px",
                      boxShadow: "none"
                    }} 
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary" style={{ fontSize: "11px" }}>Min Threshold: {minThreshold} {item.unit}</Text>
                  <div style={{ width: "40%" }}>
                    <Progress percent={percent} status={item.quantity <= 0 ? "exception" : "active"} size="small" showInfo={false} />
                  </div>
                </div>
              </div>
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default LowStockDetails;
