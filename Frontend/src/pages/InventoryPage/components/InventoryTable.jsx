import React from "react";
import { Table, Button, Tag, Typography, Space, Tooltip, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

const InventoryTable = ({ data, loading, onEdit, onDelete }) => {
  const getStatusTag = (quantity, minStock) => {
    if (quantity <= 0) return <Tag color="#ef4444" style={{ borderRadius: 6, fontWeight: 600 }}>Out of Stock</Tag>;
    if (quantity <= minStock) return <Tag color="#f59e0b" style={{ borderRadius: 6, fontWeight: 600 }}>Low Stock</Tag>;
    return <Tag color="#10b981" style={{ borderRadius: 6, fontWeight: 600 }}>In Stock</Tag>;
  };

  const columns = [
    {
      title: "Sweet Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong style={{ fontSize: 15, color: "var(--primary-color)" }}>{text}</Text>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      responsive: ["md"],
      render: (cat) => <Tag style={{ borderRadius: 4 }}>{cat}</Tag>
    },
    {
      title: "In Stock",
      dataIndex: "quantity",
      key: "quantity",
      render: (qty, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 16 }}>{qty} {record.unit}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>Min: {record.minStock} {record.unit}</Text>
        </Space>
      ),
    },
    {
      title: "Cost",
      dataIndex: "costPerUnit",
      key: "cost",
      render: (cost) => <Text strong>₹{cost}</Text>,
      responsive: ["md"],
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => getStatusTag(record.quantity, record.minStock),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="middle">
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
      scroll={{ x: true }}
      size="middle"
      pagination={{ 
        pageSize: 8,
        showSizeChanger: false,
        itemRender: (page, type, originalElement) => {
          if (type === 'prev') return <Button type="text">Prev</Button>;
          if (type === 'next') return <Button type="text">Next</Button>;
          return originalElement;
        }
      }}
      style={{ marginTop: 8 }}
    />
  );
};

export default InventoryTable;
