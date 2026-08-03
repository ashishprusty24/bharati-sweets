import React from "react";
import { Table, Button, Tag, Typography, Space, Tooltip, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, DollarOutlined } from "@ant-design/icons";

const { Text } = Typography;

const VendorTable = ({ data, loading, vendorTypes = [], onEdit, onDelete, onPay, expandedRowRender }) => {
  const getTypeTag = (type) => {
    const typeInfo = vendorTypes.find((opt) => opt.value === type);
    return <Tag color="blue">{typeInfo?.label || type}</Tag>;
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
        const total = (record.transactions || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        return <Text strong style={{ color: "#10b981" }}>₹{total.toLocaleString("en-IN")}</Text>;
      },
    },
    {
      title: "Last Payment Date",
      dataIndex: "lastPaymentDate",
      key: "lastPaymentDate",
      render: (date, record) => {
        const txs = record.transactions || [];
        const lastDate = date || (txs.length > 0 ? txs[txs.length - 1].date : null);
        return lastDate ? new Date(lastDate).toLocaleDateString() : <Text type="secondary">No payments yet</Text>;
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="_id"
      loading={loading}
      pagination={{ pageSize: 10 }}
      expandable={{
        expandedRowRender,
        rowExpandable: (record) => record.transactions?.length > 0,
      }}
    />
  );
};

export default VendorTable;
