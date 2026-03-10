import React from "react";
import { Card, Table, Tag, Typography } from "antd";
import useFetch from "../../../hooks/useFetch";

const { Text, Title } = Typography;

const PopularProducts = () => {
  const { data: products, loading } = useFetch("/dashboard/popular-products");

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
        <Tag color="blue-projection" style={{ 
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
      key: "quantitySold",
      align: "right",
      render: (_, record) => (
        <Text style={{ color: "#64748b", fontWeight: 500 }}>
          {record.quantitySold} <small>{record.unit || ""}</small>
        </Text>
      ),
    },
    {
      title: "Revenue",
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      render: (text) => (
        <Text strong style={{ color: "#0f172a" }}>
          ₹{(text || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
  ];

  return (
    <Card 
      title={<Title level={4} style={{ margin: 0, fontWeight: 700 }}>Top Selling Products</Title>} 
      bordered={false}
      className="premium-shadow"
      style={{ borderRadius: 24 }}
      loading={loading}
    >
      <Table
        columns={columns}
        dataSource={products || []}
        rowKey="_id"
        pagination={false}
        size="middle"
        style={{ marginTop: 8 }}
      />
    </Card>
  );
};

export default PopularProducts;
