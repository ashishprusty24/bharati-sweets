import React from "react";
import { Card, Table, Tag, Typography, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

const TransactionTable = ({ transactions, loading, onGenerateReport }) => {
  const expenseCategories = {
    ingredients: { label: "Ingredients", color: "#1890ff" },
    packaging: { label: "Packaging", color: "#52c41a" },
    utilities: { label: "Utilities", color: "#faad14" },
    rent: { label: "Rent", color: "#f5222d" },
    salaries: { label: "Salaries", color: "#722ed1" },
    marketing: { label: "Marketing", color: "#13c2c2" },
    equipment: { label: "Equipment", color: "#eb2f96" },
    transportation: { label: "Transportation", color: "#a0d911" },
    other: { label: "Other", color: "#bfbfbf" },
  };

  const revenueTypes = {
    regular: { label: "Regular Orders", color: "#52c41a" },
    event: { label: "Event Orders", color: "#1890ff" },
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("MMM D, YYYY"),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Category",
      key: "category",
      render: (record) => {
        const config = record.type === "revenue" ? revenueTypes : expenseCategories;
        const item = config[record.category];
        return (
          <Tag color={item?.color || "#bfbfbf"}>
            {item?.label || record.category}
          </Tag>
        );
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount, record) => (
        <Text strong type={record.type === "revenue" ? "success" : "danger"}>
          ₹{amount.toLocaleString()}
        </Text>
      ),
      align: "right",
      sorter: (a, b) => a.amount - b.amount,
    },
  ];

  return (
    <Card
      bordered={false}
      className="glass-card"
      style={{ borderRadius: 20 }}
      title={<span style={{ fontWeight: 700 }}>Financial Transactions</span>}
      extra={
        <Button 
          type="primary" 
          icon={<DownloadOutlined />} 
          onClick={onGenerateReport}
          style={{ borderRadius: 8 }}
        >
          Report
        </Button>
      }
    >
      <div className="responsive-table-container">
        <Table
          columns={columns}
          dataSource={transactions || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
          summary={(pageData) => {
            const total = pageData.reduce(
              (sum, item) => sum + (item.type === "revenue" ? item.amount : -item.amount),
              0
            );
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong>Page Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong type={total >= 0 ? "success" : "danger"}>
                      ₹{total.toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </div>
    </Card>
  );
};

export default TransactionTable;
