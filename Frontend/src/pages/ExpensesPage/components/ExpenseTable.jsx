import React from "react";
import { Table, Tag, Typography, Space, Tooltip, Popconfirm, Button } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

const ExpenseTable = ({ data, loading, categories, onEdit, onDelete }) => {
  const columns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Vendor",
      dataIndex: "vendor",
      key: "vendor",
      render: (text) => <Text type="secondary">{text || "-"}</Text>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (cat) => {
        const info = categories.find(c => c.value === cat);
        return <Tag color={info?.color || "default"}>{info?.label || cat}</Tag>;
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => <Text strong>₹{amount.toFixed(2)}</Text>,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="primary" shape="circle" icon={<EditOutlined />} size="small" onClick={() => onEdit(record)} />
          </Tooltip>
          <Popconfirm title="Delete this expense?" onConfirm={() => onDelete(record._id)}>
            <Tooltip title="Delete">
              <Button danger shape="circle" icon={<DeleteOutlined />} size="small" />
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
      scroll={{ x: 800 }}
      summary={(pageData) => {
        const total = pageData.reduce((sum, item) => sum + item.amount, 0);
        return (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}><Text strong>Page Total</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={1}><Text strong>₹{total.toFixed(2)}</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
            </Table.Summary.Row>
          </Table.Summary>
        );
      }}
    />
  );
};

export default ExpenseTable;
