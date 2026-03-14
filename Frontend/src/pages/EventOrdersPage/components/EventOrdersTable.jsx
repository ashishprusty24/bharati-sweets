import React, { memo } from "react";
import { Table, Button, Tag, Typography, Space, Tooltip, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, DollarOutlined, FileTextOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

const EventOrdersTable = memo(({ data, loading, orderStatusOptions, paymentStatusOptions, onEdit, onDelete, onPay, onGenerateInvoice, onGenerateChefSlip, expandedRowRender }) => {
  const getStatusTag = (status, options) => {
    const statusInfo = options.find((opt) => opt.value === status);
    return (
      <Tag 
        style={{ 
          color: statusInfo?.color || "#64748b", 
          background: `${statusInfo?.color}1a` || "#f1f5f9",
          border: `1px solid ${statusInfo?.color}33` || "#e2e8f0",
          borderRadius: 6,
          fontWeight: 600,
          margin: 0
        }}
      >
        {statusInfo?.label || status}
      </Tag>
    );
  };

  const getPaymentStatus = (paidAmount, totalAmount) => {
    if (paidAmount >= totalAmount) return "paid";
    if (paidAmount > 0) return "partial";
    return "pending";
  };

  const columns = [
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      render: (id) => <Text strong style={{ color: "var(--primary-color)" }}>#{id?.substring(id.length - 6).toUpperCase()}</Text>,
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
      title: "Event",
      dataIndex: "purpose",
      key: "purpose",
      className: "mobile-hide",
      render: (p) => <Tag style={{ borderRadius: 4 }}>{p}</Tag>
    },
    {
      title: "Delivery",
      key: "delivery",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{dayjs(record.deliveryDate).format("MMM D, YYYY")}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{record.deliveryTime}</Text>
        </Space>
      ),
    },
    {
      title: "Payment Info",
      key: "amount",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 16 }}>₹{record.totalAmount}</Text>
          <Text style={{ fontSize: 12, color: "#10b981" }}>Paid: ₹{record.paidAmount || 0}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={6}>
          {getStatusTag(record.orderStatus, orderStatusOptions)}
          {getStatusTag(getPaymentStatus(record.paidAmount, record.totalAmount), paymentStatusOptions)}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Update Order">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#3b82f6" }} />}
              onClick={() => onEdit(record)}
              style={{ background: "#eff6ff", borderRadius: 8 }}
            />
          </Tooltip>
          <Tooltip title="Add Payment">
            <Button 
              type="text" 
              icon={<DollarOutlined style={{ color: "#10b981" }} />} 
              onClick={() => onPay(record)} 
              style={{ background: "#ecfdf5", borderRadius: 8 }}
            />
          </Tooltip>
          <Tooltip title="Generate Bill">
            <Button 
              type="primary" 
              icon={<FileTextOutlined />} 
              onClick={() => onGenerateInvoice(record)}
              style={{ borderRadius: 8 }}
            >
              Bill
            </Button>
          </Tooltip>
          <Tooltip title="Print KOT / Chef Slip">
            <Button 
              icon={<PrinterOutlined />} 
              onClick={() => onGenerateChefSlip(record)}
              style={{ borderRadius: 8, borderColor: "#f97316", color: "#f97316" }}
            >
              KOT
            </Button>
          </Tooltip>
          <Popconfirm
            title="Delete this order?"
            description="This action cannot be undone."
            onConfirm={() => onDelete(record._id)}
            okButtonProps={{ danger: true }}
            okText="Delete"
            cancelText="Cancel"
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} style={{ background: "#fef2f2", borderRadius: 8 }} />
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
      expandable={{ expandedRowRender }}
      style={{ marginTop: 8 }}
    />
  );
});

export default EventOrdersTable;
