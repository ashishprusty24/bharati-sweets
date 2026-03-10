import React from "react";
import { Table, Tag, Typography, Space, Tooltip, Popconfirm, Button } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

const RegularOrdersTable = ({ data, loading, onEdit, onDelete, getPaymentMethodTag }) => {
  const columns = [
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      render: (id) => <Text strong style={{ color: "var(--primary-color)" }}>#{id.substring(id.length - 6).toUpperCase()}</Text>,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 15 }}>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
        </Space>
      ),
    },
    {
      title: "Order Date",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (date) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text strong>{dayjs(date).format("MMM D, YYYY")}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(date).format("h:mm A")}</Text>
        </div>
      ),
    },
    {
      title: "Details",
      key: "items",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.items.length} items</Text>
          <Text style={{ fontSize: 13, color: "#64748b" }}>Value: ₹{record.totalAmount}</Text>
        </Space>
      ),
    },
    {
      title: "Payment",
      key: "payment",
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text strong style={{ color: "#10b981", fontSize: 16 }}>₹{record.payment.amount}</Text>
          {getPaymentMethodTag(record.payment.method)}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit Order">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#3b82f6" }} />}
              onClick={() => onEdit(record)}
              style={{ background: "#eff6ff", borderRadius: 8 }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this order?"
            description="This action cannot be undone."
            onConfirm={() => onDelete(record._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Order">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                style={{ background: "#fef2f2", borderRadius: 8 }} 
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="_id"
      loading={loading}
      pagination={{ pageSize: 8 }}
      scroll={{ x: true }}
      size="middle"
      style={{ marginTop: 8 }}
    />
  );
};

export default RegularOrdersTable;
