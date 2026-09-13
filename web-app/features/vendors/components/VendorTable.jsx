import React from "react";
import { Table, Button, Tag, Typography, Space, Tooltip, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, DollarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const { Text } = Typography;

const VendorTable = ({
  data,
  loading,
  vendorTypes = [],
  onEdit,
  onDelete,
  onPay,
  expandedRowRender,
  dateRange,
}) => {
  const getTypeTag = (type) => {
    const typeInfo = vendorTypes.find((opt) => opt.value === type);
    return <Tag color="blue">{typeInfo?.label || type}</Tag>;
  };

  const isTxInDateRange = (txDate) => {
    if (!dateRange || dateRange.length !== 2 || !dateRange[0] || !dateRange[1]) return true;
    const d = dayjs(txDate);
    return d.isBetween(dateRange[0].startOf("day"), dateRange[1].endOf("day"), null, "[]");
  };

  const columns = [
    {
      title: "Vendor Name",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <div style={{ marginTop: 4 }}>{getTypeTag(record.type)}</div>
        </div>
      ),
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      render: (contact, record) => (
        <div>
          <Text>{contact}</Text>
          {record.address && <div style={{ fontSize: 11, color: "#64748b" }}>{record.address}</div>}
        </div>
      ),
    },
    {
      title: "Total Paid",
      key: "totalPaid",
      render: (_, record) => {
        const txs = record.transactions || [];
        const totalAllTime = txs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const hasDateFilter = dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1];
        const periodTotal = hasDateFilter
          ? txs.filter((t) => isTxInDateRange(t.date)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
          : totalAllTime;

        return (
          <div>
            <Text strong style={{ color: "#10b981", fontSize: 15 }}>
              ₹{periodTotal.toLocaleString("en-IN")}
            </Text>
            {hasDateFilter && (
              <div style={{ fontSize: 11, color: "#64748b" }}>
                All time: ₹{totalAllTime.toLocaleString("en-IN")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Last Payment Date",
      dataIndex: "lastPaymentDate",
      key: "lastPaymentDate",
      render: (date, record) => {
        const txs = record.transactions || [];
        const filteredTxs = (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1])
          ? txs.filter((t) => isTxInDateRange(t.date))
          : txs;

        const lastTx = filteredTxs.length > 0 ? filteredTxs[filteredTxs.length - 1] : null;
        const lastDate = lastTx ? lastTx.date : (date || null);

        return lastDate ? (
          new Date(lastDate).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        ) : (
          <Text type="secondary">No payments in range</Text>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          {onPay && (
            <Tooltip title="Make Payment">
              <Button
                type="primary"
                size="small"
                icon={<DollarOutlined />}
                style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
                onClick={() => onPay(record)}
              />
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="Edit Vendor">
              <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete Vendor">
              <Popconfirm
                title="Are you sure you want to delete this vendor?"
                onConfirm={() => onDelete(record._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
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
      pagination={{ pageSize: 10 }}
      scroll={{ x: 800 }}
      expandable={{
        expandedRowRender,
        rowExpandable: (record) => (record.transactions || []).length > 0,
      }}
    />
  );
};

export default VendorTable;
