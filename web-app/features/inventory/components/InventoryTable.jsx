import React from "react";
import { Table, Button, Tag, Typography, Space, Tooltip, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

const InventoryTable = ({ data, loading, onEdit, onDelete }) => {
  const getStatusTag = (quantity = 0, minStock = 5) => {
    if (quantity <= 0) return <Tag color="#ef4444" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>Out of Stock</Tag>;
    if (quantity <= minStock) return <Tag color="#f59e0b" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>Low Stock</Tag>;
    return <Tag color="#10b981" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>In Stock</Tag>;
  };

  const columns = [
    {
      title: "Item Name",
      dataIndex: "name",
      key: "name",
      width: 160,
      render: (text) => (
        <Text strong style={{ fontSize: 14, color: "#10b981", whiteSpace: "nowrap" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      responsive: ["md"],
      width: 120,
      render: (cat, record) => (
        <Space size={4} style={{ whiteSpace: "nowrap" }}>
          <Tag style={{ borderRadius: 4, margin: 0 }}>{cat}</Tag>
          {record.subCategory && (
            <Text type="secondary" style={{ fontSize: 12 }}>({record.subCategory})</Text>
          )}
        </Space>
      )
    },
    {
      title: "Kitchen Sec.",
      dataIndex: "kitchenSection",
      key: "kitchenSection",
      responsive: ["lg"],
      width: 140,
      render: (sec) => {
        const colorMap = {
          "Sweets": "magenta",
          "Samosa Section": "orange",
          "Bara Section": "cyan",
          "Namkeen Section": "purple"
        };
        return <Tag color={colorMap[sec] || "default"} style={{ borderRadius: 4, margin: 0 }}>{sec || "Uncategorized"}</Tag>;
      }
    },
    {
      title: "In Stock",
      dataIndex: "quantity",
      key: "quantity",
      width: 140,
      render: (qty, record) => (
        <div style={{ whiteSpace: "nowrap" }}>
          <Text strong style={{ fontSize: 15, display: "block", lineHeight: 1.2 }}>
            {qty} {record.unit}
          </Text>
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 2 }}>
            Min: {record.minStock || record.minThreshold || 5} {record.unit}
          </Text>
        </div>
      ),
    },
    {
      title: "Cost",
      dataIndex: "costPerUnit",
      key: "cost",
      width: 90,
      render: (cost, record) => <Text strong style={{ whiteSpace: "nowrap" }}>₹{cost || record.price || 0}</Text>,
      responsive: ["md"],
    },
    {
      title: "Status",
      key: "status",
      width: 115,
      render: (_, record) => <div style={{ whiteSpace: "nowrap" }}>{getStatusTag(record.quantity, record.minStock || record.minThreshold || 5)}</div>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space size="small" style={{ whiteSpace: "nowrap" }}>
          <Tooltip title="Edit Item">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#3b82f6" }} />}
              onClick={() => onEdit(record)}
              style={{ background: "#eff6ff", borderRadius: 8 }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this sweet?"
            description="This action cannot be undone."
            onConfirm={() => onDelete(record._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Item">
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
      scroll={{ x: 650 }}
      size="middle"
      pagination={{ pageSize: 8 }}
      style={{ marginTop: 8 }}
    />
  );
};

export default InventoryTable;
