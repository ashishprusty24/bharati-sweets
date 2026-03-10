import React from "react";
import { Card, Typography, Button, Space, Badge, List } from "antd";
import { WarningOutlined, ArrowRightOutlined } from "@ant-design/icons";
import useFetch from "../../../hooks/useFetch";
import { useNavigate } from "react-router-dom";
import EmptyState from "./EmptyState";

const { Text } = Typography;

const LowStockDetails = () => {
  const { data: inventory, loading } = useFetch("/inventory/list");
  const navigate = useNavigate();

  const lowStockItems = (inventory || []).filter(item => item.status === "low-stock" || item.quantity <= item.minQuantity);

  if (!loading && lowStockItems.length === 0) {
    return (
      <Card 
        title={
          <Space>
            <WarningOutlined style={{ color: "#94a3b8" }} />
            <span style={{ fontWeight: 700 }}>Low Stock Alerts</span>
          </Space>
        } 
        bordered={false}
        className="premium-shadow"
        style={{ borderRadius: 24, height: "100%" }}
      >
        <EmptyState message="All items are well-stocked" height={220} />
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
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#1e293b" }}>Low Stock Alerts</span>
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
          Inventory
        </Button>
      }
    >
      <List
        dataSource={lowStockItems.slice(0, 5)}
        renderItem={(item) => (
          <List.Item style={{ border: "none", padding: "12px 0" }}>
            <div style={{ 
              width: "100%", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              background: "#fafafa",
              padding: "12px 16px",
              borderRadius: "16px",
              border: "1px solid #f1f5f9"
            }}>
              <div>
                <Text strong style={{ color: "#1e293b", fontSize: "15px", display: "block" }}>{item.name}</Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>Threshold: {item.minQuantity} {item.unit}</Text>
              </div>
              <div style={{ textAlign: "right" }}>
                <Badge 
                  count={`${item.quantity} ${item.unit}`} 
                  style={{ 
                    backgroundColor: "#fee2e2", 
                    color: "#ef4444", 
                    fontWeight: 700,
                    borderRadius: "8px",
                    padding: "0 10px",
                    height: "28px",
                    lineHeight: "28px",
                    boxShadow: "none",
                    border: "1px solid #fecaca"
                  }} 
                />
              </div>
            </div>
          </List.Item>
        )}
      />
      {lowStockItems.length > 5 && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            and {lowStockItems.length - 5} more items...
          </Text>
        </div>
      )}
    </Card>
  );
};

export default LowStockDetails;

