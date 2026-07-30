"use client";

import React, { useState, useEffect } from "react";
import { Card, Table, Tag, Typography } from "antd";

const { Text, Title } = Typography;

const PopularProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((data) => setProducts(data?.slice(0, 5) || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text strong style={{ color: "#1e293b", fontSize: 14 }}>{text}</Text>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => (
        <Tag style={{ 
          background: "#eff6ff", 
          color: "#3b82f6", 
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          padding: "2px 10px"
        }}>
          {category}
        </Tag>
      ),
    },
    {
      title: "Quantity",
      key: "quantity",
      align: "right",
      render: (_, record) => (
        <Text style={{ color: "#64748b", fontWeight: 500 }}>
          {record.quantity} <small>{record.unit || ""}</small>
        </Text>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      align: "right",
      render: (text) => (
        <Text strong style={{ color: "#0f172a" }}>
          ₹{(text || 0).toLocaleString("en-IN")}
        </Text>
      ),
    },
  ];

  return (
    <Card 
      title={<Title level={4} style={{ margin: 0, fontWeight: 700 }}>Top Selling Products</Title>} 
      variant="borderless"
      className="premium-shadow"
      style={{ borderRadius: 24 }}
      loading={loading}
    >
      <Table
        columns={columns}
        dataSource={products}
        rowKey="_id"
        pagination={false}
        size="small"
      />
    </Card>
  );
};

export default PopularProducts;
