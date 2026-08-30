import React, { memo, useState } from "react";
import { Table, Button, Tag, Typography, Space, Tooltip, Dropdown, Modal, Grid, Card, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, DollarOutlined, FileTextOutlined, PrinterOutlined, MoreOutlined, CalendarOutlined, PhoneOutlined, DownOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;
const { useBreakpoint } = Grid;

const EventOrdersTable = memo(({ data, loading, orderStatusOptions, paymentStatusOptions, onEdit, onDelete, onPay, onStatusChange, onGenerateInvoice, onGenerateChefSlip, expandedRowRender }) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const getStatusTag = (status, options) => {
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

  const getPaymentStatus = (paidAmount, totalAmount, adminWaiver = 0) => {
    const totalSettled = (paidAmount || 0) + (adminWaiver || 0);
    if (totalSettled >= totalAmount) return "paid";
    if (totalSettled > 0) return "partial";
    return "pending";
  };

  const renderStatusSelector = (record) => {
    const currentOpt = orderStatusOptions.find((opt) => opt.value === record.orderStatus) || {
      value: record.orderStatus || "pending",
      label: record.orderStatus || "Pending",
      color: "#f59e0b",
    };

    const statusMenuItems = orderStatusOptions.map((opt) => ({
      key: opt.value,
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px" }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: opt.color,
              display: "inline-block",
            }}
          />
          <span style={{ fontWeight: 600, color: opt.color, fontSize: 12 }}>
            {opt.label}
          </span>
        </div>
      ),
      onClick: () => onStatusChange && onStatusChange(record._id, opt.value),
    }));

    return (
      <Dropdown menu={{ items: statusMenuItems }} trigger={["click"]} placement="bottomLeft">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            cursor: "pointer",
            color: currentOpt.color,
            background: `${currentOpt.color}15`,
            border: `1px solid ${currentOpt.color}33`,
            borderRadius: 6,
            padding: "3px 8px",
            fontSize: 11,
            fontWeight: 600,
            userSelect: "none",
            transition: "all 0.2s ease",
          }}
        >
          <span>{currentOpt.label}</span>
          <DownOutlined style={{ fontSize: 9, color: currentOpt.color, opacity: 0.8 }} />
        </div>
      </Dropdown>
    );
  };

  // ─── MOBILE CARD LAYOUT ───────────────────────────────────────────
  // Mobile pagination state
  const MOBILE_PAGE_SIZE = 15;
  const [mobilePage, setMobilePage] = useState(1);
  const totalMobilePages = Math.ceil((data?.length || 0) / MOBILE_PAGE_SIZE);
  const mobileStart = (mobilePage - 1) * MOBILE_PAGE_SIZE;
  const mobileData = data?.slice(mobileStart, mobileStart + MOBILE_PAGE_SIZE) || [];

  if (isMobile) {
    return (
      <div>
        {/* Results count */}
        {!loading && data?.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Showing {mobileStart + 1}–{Math.min(mobileStart + MOBILE_PAGE_SIZE, data.length)} of {data.length} orders
            </Text>
          </div>
        )}

        <div className="event-orders-mobile-list">
          {loading && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Text type="secondary">Loading orders...</Text>
            </div>
          )}
          {!loading && (!data || data.length === 0) && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Text type="secondary">No orders found</Text>
            </div>
          )}
          {!loading && mobileData.map((record) => {
            const payStatus = getPaymentStatus(record.paidAmount, record.totalAmount, record.adminWaiver);
            const balanceDue = Math.max(0, record.totalAmount - (record.paidAmount || 0) - (record.adminWaiver || 0));
            return (
              <div key={record._id} className="event-order-card">
                {/* Card Header */}
                <div className="event-order-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="order-id-badge">#{record._id?.substring(record._id.length - 5).toUpperCase()}</span>
                    {renderStatusSelector(record)}
                  </div>
                  {getStatusTag(payStatus, paymentStatusOptions)}
                </div>

                {/* Card Body */}
                <div className="event-order-card-body">
                  <div className="order-customer-row">
                    <Text strong style={{ fontSize: 15, color: "#1e293b" }}>{record.customerName}</Text>
                    <Text className="order-amount-highlight">₹{record.totalAmount?.toLocaleString()}</Text>
                  </div>

                  <div className="order-info-row">
                    <div className="order-info-item">
                      <PhoneOutlined style={{ color: "#94a3b8", fontSize: 12 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>{record.phone || "N/A"}</Text>
                      {record.phone && (
                        <a
                          href={`tel:${record.phone}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#0284c7",
                            backgroundColor: "#e0f2fe",
                            padding: "2px 8px",
                            borderRadius: 12,
                            border: "1px solid #bae6fd",
                            textDecoration: "none",
                            marginLeft: 4,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PhoneOutlined style={{ fontSize: 10 }} /> Call
                        </a>
                      )}
                    </div>
                    <div className="order-info-item">
                      <CalendarOutlined style={{ color: "#94a3b8", fontSize: 12 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(record.deliveryDate).format("MMM D, YYYY")} • {record.deliveryTime}</Text>
                    </div>
                  </div>

                  {record.purpose && (
                    <Tag style={{ borderRadius: 4, marginTop: 4, fontSize: 11, color: "#64748b", background: "#f1f5f9", border: "1px solid #e2e8f0" }}>{record.purpose}</Tag>
                  )}

                  {/* Payment progress bar */}
                  <div className="payment-progress-container">
                    <div className="payment-progress-bar">
                      <div
                        className="payment-progress-fill"
                        style={{ width: `${Math.min(100, ((record.paidAmount || 0) / record.totalAmount) * 100)}%` }}
                      />
                    </div>
                    <div className="payment-progress-labels">
                      <Text style={{ fontSize: 11, color: "#10b981" }}>Paid: ₹{(record.paidAmount || 0).toLocaleString()}</Text>
                      {balanceDue > 0 && <Text style={{ fontSize: 11, color: "#ef4444" }}>Due: ₹{balanceDue.toLocaleString()}</Text>}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="event-order-card-actions">
                  <button className="order-action-btn order-action-edit" onClick={() => onEdit(record)}>
                    <EditOutlined /> Edit
                  </button>
                  <button className="order-action-btn order-action-pay" onClick={() => onPay(record)}>
                    <DollarOutlined /> Pay
                  </button>
                  <button className="order-action-btn order-action-bill" onClick={() => onGenerateInvoice(record)}>
                    <FileTextOutlined /> Bill
                  </button>
                  <button className="order-action-btn order-action-kot" onClick={() => onGenerateChefSlip(record)}>
                    <PrinterOutlined /> KOT
                  </button>
                  <Popconfirm
                    title="Delete this order?"
                    description="This action cannot be undone."
                    onConfirm={() => onDelete(record._id)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <button className="order-action-btn order-action-delete">
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Pagination Bar */}
        {!loading && data?.length > MOBILE_PAGE_SIZE && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
              padding: "12px 16px",
              background: "#ffffff",
              borderRadius: 14,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: "1px solid #f1f5f9",
            }}
          >
            <Button
              type="text"
              disabled={mobilePage <= 1}
              onClick={() => setMobilePage(p => p - 1)}
              style={{
                fontWeight: 600,
                borderRadius: 8,
                color: mobilePage <= 1 ? "#cbd5e1" : "#6366f1",
                padding: "4px 16px",
                height: 36,
              }}
            >
              ← Prev
            </Button>
            <Text style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
              {mobilePage} / {totalMobilePages}
            </Text>
            <Button
              type="text"
              disabled={mobilePage >= totalMobilePages}
              onClick={() => setMobilePage(p => p + 1)}
              style={{
                fontWeight: 600,
                borderRadius: 8,
                color: mobilePage >= totalMobilePages ? "#cbd5e1" : "#6366f1",
                padding: "4px 16px",
                height: 36,
              }}
            >
              Next →
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ─── DESKTOP TABLE LAYOUT ─────────────────────────────────────────
  const columns = [
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      width: 100,
      render: (id) => <Text strong style={{ color: "var(--primary-color)", fontSize: 13 }}>#{id?.substring(id.length - 5).toUpperCase()}</Text>,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 14 }}>{name}</Text>
          {record.phone ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <a
                href={`tel:${record.phone}`}
                style={{
                  color: "#475569",
                  fontSize: 12,
                  textDecoration: "none",
                }}
              >
                {record.phone}
              </a>
              <Tooltip title={`Call ${record.phone}`}>
                <a
                  href={`tel:${record.phone}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#0284c7",
                    backgroundColor: "#e0f2fe",
                    padding: "1px 7px",
                    borderRadius: 12,
                    border: "1px solid #bae6fd",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <PhoneOutlined style={{ fontSize: 10 }} /> Call
                </a>
              </Tooltip>
            </div>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>N/A</Text>
          )}
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
          <Text strong style={{ fontSize: 13 }}>{dayjs(record.deliveryDate).format("MMM D, YYYY")}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{record.deliveryTime}</Text>
        </Space>
      ),
    },
    {
      title: "Payment",
      key: "amount",
      width: 140,
      render: (_, record) => {
        const adminWaiver = record.adminWaiver || 0;
        const totalSettled = (record.paidAmount || 0) + adminWaiver;
        const balance = Math.max(0, record.totalAmount - totalSettled);
        return (
          <Space direction="vertical" size={2}>
            <Text strong style={{ fontSize: 14 }}>₹{record.totalAmount?.toLocaleString()}</Text>
            <Text style={{ fontSize: 11, color: "#10b981" }}>Paid: ₹{totalSettled.toLocaleString()}</Text>
            {balance > 0 && <Text style={{ fontSize: 11, color: "#ef4444" }}>Due: ₹{balance.toLocaleString()}</Text>}
          </Space>
        );
      }
    },
    {
      title: "Status",
      key: "status",
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          {renderStatusSelector(record)}
          {getStatusTag(getPaymentStatus(record.paidAmount, record.totalAmount, record.adminWaiver), paymentStatusOptions)}
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
                icon={<DeleteOutlined style={{ fontSize: 14 }} />}
                style={{ background: "#fef2f2", borderRadius: 8 }}
              />
            </Tooltip>
          </Popconfirm>

          <Dropdown
            menu={{
              items: [
                {
                  key: "pay",
                  label: "Add Payment",
                  icon: <DollarOutlined style={{ color: "#10b981" }} />,
                  onClick: () => onPay(record),
                },
                {
                  key: "bill",
                  label: "Generate Bill",
                  icon: <FileTextOutlined style={{ color: "#3b82f6" }} />,
                  onClick: () => onGenerateInvoice(record),
                },
                {
                  key: "kot",
                  label: "Print KOT",
                  icon: <PrinterOutlined style={{ color: "#f97316" }} />,
                  onClick: () => onGenerateChefSlip(record),
                },
                {
                  type: "divider",
                },
                {
                  key: "status_submenu",
                  label: "Change Status",
                  icon: <CalendarOutlined style={{ color: "#6366f1" }} />,
                  children: orderStatusOptions.map((opt) => ({
                    key: `status_${opt.value}`,
                    label: (
                      <Tag style={{ color: opt.color, background: `${opt.color}1a`, border: `1px solid ${opt.color}33`, borderRadius: 4, margin: 0, fontWeight: 600 }}>
                        {opt.label}
                      </Tag>
                    ),
                    onClick: () => onStatusChange && onStatusChange(record._id, opt.value),
                  })),
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
        showTotal: (total, range) => (
          <Text type="secondary" style={{ fontSize: 13 }}>
            Showing <strong>{range[0]}–{range[1]}</strong> of <strong>{total}</strong> orders
          </Text>
        ),
        showQuickJumper: data?.length > 20,
        size: "default",
        style: {
          marginTop: 16,
          padding: "0 8px",
        },
      }}
      size="middle"
      expandable={{ expandedRowRender }}
      style={{ marginTop: 8 }}
    />
  );
});

export default EventOrdersTable;
