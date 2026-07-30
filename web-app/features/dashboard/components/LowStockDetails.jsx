"use client";

import React, { useState, useEffect } from "react";
import { Card, Typography, Button, Space, Badge, List } from "antd";
import { WarningOutlined, ArrowRightOutlined } from "@ant-design/icons";
import Link from "next/link";
import EmptyState from "./EmptyState";

const { Text } = Typography;

const LowStockDetails = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/low-stock")
      .then((res) => res.json())
      .then((data) => setLowStockItems(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!loading && lowStockItems.length === 0) {
    return (
      <Card 
        title={
          <Space>
            <WarningOutlined style={{ color: "#94a3b8" }} />
            <span style={{ fontWeight: 700 }}>Low Stock Alerts</span>
          </Space>
        } 
        variant="borderless"
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
          <div style={{ background: "#fee2e2", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center" }}>
            <WarningOutlined style={{ color: "#ef4444", fontSize: "18px" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#1e293b" }}>Low Stock Alerts</span>
        </Space>
      } 
      variant="borderless"
      style={{ borderRadius: 24, height: "100%" }}
      loading={loading}
      extra={
        <Link href="/inventory">
          <Button type="text" icon={<ArrowRightOutlined />} style={{ color: "#3b82f6", fontWeight: 600 }}>
            Inventory
          </Button>
        </Link>
      }
    >
      <List
        dataSource={lowStockItems.slice(0, 5)}
        renderItem={(item) => (
          <List.Item style={{ border: "none", padding: "12px 0" }}>
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa", padding: "12px 16px", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
              <div>
                <Text strong style={{ color: "#1e293b", fontSize: "15px", display: "block" }}>{item.name}</Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>Threshold: {item.minThreshold || 5} {item.unit}</Text>
              </div>
              <Badge count={`${item.quantity} ${item.unit}`} style={{ backgroundColor: "#fee2e2", color: "#ef4444", fontWeight: 700 }} />
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default LowStockDetails;
