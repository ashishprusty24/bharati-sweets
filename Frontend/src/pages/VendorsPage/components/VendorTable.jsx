import React from "react";
import { Table, Button, Tag, Typography, Space, Tooltip, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, DollarOutlined } from "@ant-design/icons";

const { Text } = Typography;

const VendorTable = ({ data, loading, vendorTypes, onEdit, onDelete, onPay, expandedRowRender }) => {
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
      render: (contact) => <Text>{contact}</Text>,
    },
    {
      title: "Supply Details",
      key: "supply",
      render: (_, record) => (
        <div>
          <Text>{record.suppliedItems?.join(", ") || "N/A"}</Text>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">
              {record.dailySupply ? `${record.dailySupply} ${record.type === "milk" ? "liters/day" : "kg/day"}` : 
               record.monthlySupply ? `${record.monthlySupply} kg/month` : "No supply data"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Payment Due",
      dataIndex: "paymentDue",
      key: "due",
      render: (due) => <Text strong>₹{due || 0}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Make Payment">
            <Button type="primary" icon={<DollarOutlined />} onClick={() => onPay(record)}>Pay</Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="default" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Popconfirm title="Delete this vendor?" onConfirm={() => onDelete(record._id)}>
            <Tooltip title="Delete">
              <Button type="primary" danger icon={<DeleteOutlined />} />
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
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1000 }}
      expandable={{
        expandedRowRender,
        rowExpandable: (record) => record.transactions?.length > 0,
      }}
    />
  );
};

export default VendorTable;
