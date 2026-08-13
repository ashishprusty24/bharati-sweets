import React, { memo, useState } from "react";
import { Table, Button, Tag, Typography, Space, Tooltip, Dropdown, Modal, Grid } from "antd";
import { EditOutlined, DeleteOutlined, DollarOutlined, FileTextOutlined, PrinterOutlined, MoreOutlined, CalendarOutlined, PhoneOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;
const { useBreakpoint } = Grid;

const EventOrdersTable = memo(({ data, loading, orderStatusOptions = [], paymentStatusOptions = [], onEdit, onDelete, onPay, onGenerateInvoice, onGenerateChefSlip, expandedRowRender }) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const getStatusTag = (status, options = []) => {
    const statusInfo = options.find((opt) => opt.value === status);
    return (
      <Tag 
        style={{ 
          color: statusInfo?.color || "#64748b", 
          background: statusInfo?.color ? `${statusInfo.color}1a` : "#f1f5f9",
          border: statusInfo?.color ? `1px solid ${statusInfo.color}33` : "1px solid #e2e8f0",
          borderRadius: 6,
          fontWeight: 600,
          margin: 0,
          fontSize: 11,
          padding: "2px 8px"
        }}
      >
        {statusInfo?.label || status}
      </Tag>
    );
  };

  const getPaymentStatus = (paidAmount = 0, totalAmount = 0) => {
    if (paidAmount >= totalAmount) return "paid";
    if (paidAmount > 0) return "partial";
    return "pending";
  };

  const columns = [
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      width: 100,
      render: (id) => <Text strong style={{ color: "#7c3aed", fontSize: 13 }}>#{id ? id.substring(id.length - 5).toUpperCase() : ""}</Text>,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 14 }}>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.customerPhone || record.phone}</Text>
        </Space>
      ),
    },
    {
      title: "Event",
      dataIndex: "purpose",
      key: "purpose",
      width: 120,
      render: (p) => <Tag style={{ borderRadius: 4 }}>{p}</Tag>
    },
    {
      title: "Delivery",
      key: "delivery",
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>{dayjs(record.eventDate).format("MMM D, YYYY")}</Text>
        </Space>
      ),
    },
    {
      title: "Payment",
      key: "amount",
      width: 140,
      render: (_, record) => {
        const balance = (record.totalAmount || 0) - (record.advancePaid || record.paidAmount || 0);
        return (
          <Space direction="vertical" size={2}>
            <Text strong style={{ fontSize: 14 }}>₹{record.totalAmount?.toLocaleString()}</Text>
            <Text style={{ fontSize: 11, color: "#10b981" }}>Paid: ₹{(record.advancePaid || record.paidAmount || 0).toLocaleString()}</Text>
            {balance > 0 && <Text style={{ fontSize: 11, color: "#ef4444" }}>Due: ₹{balance.toLocaleString()}</Text>}
          </Space>
        );
      }
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          {getStatusTag(record.status, orderStatusOptions)}
          {getStatusTag(getPaymentStatus(record.advancePaid || record.paidAmount, record.totalAmount), paymentStatusOptions)}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Order">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#3b82f6" }} />}
              onClick={() => onEdit && onEdit(record)}
              style={{ background: "#eff6ff", borderRadius: 8 }}
            />
          </Tooltip>
          
          <Dropdown
            menu={{
              items: [
                {
                  key: "pay",
                  label: "Add Payment",
                  icon: <DollarOutlined style={{ color: "#10b981" }} />,
                  onClick: () => onPay && onPay(record),
                },
                {
                  key: "bill",
                  label: "Generate Bill",
                  icon: <FileTextOutlined style={{ color: "#3b82f6" }} />,
                  onClick: () => onGenerateInvoice && onGenerateInvoice(record),
                },
                {
                  key: "kot",
                  label: "Print KOT",
                  icon: <PrinterOutlined style={{ color: "#f97316" }} />,
                  onClick: () => onGenerateChefSlip && onGenerateChefSlip(record),
                },
                {
                  type: "divider",
                },
                {
                  key: "delete",
                  label: "Delete Order",
                  danger: true,
                  icon: <DeleteOutlined />,
                  onClick: () => {
                    Modal.confirm({
                      title: "Delete this order?",
                      content: "This action cannot be undone.",
                      okText: "Delete",
                      okType: "danger",
                      cancelText: "Cancel",
                      onOk: () => onDelete && onDelete(record._id),
                    });
                  },
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" icon={<MoreOutlined />} style={{ borderRadius: 8 }} />
          </Dropdown>
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
      pagination={{
        pageSize: 15,
        showSizeChanger: true,
        pageSizeOptions: ["10", "15", "25", "50", "100"],
      }}
      size="middle"
      expandable={{ expandedRowRender }}
      style={{ marginTop: 8 }}
    />
  );
});

export default EventOrdersTable;
