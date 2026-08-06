import React, { useState, useMemo } from "react";
import { Card, Table, Tag, Typography, Button, Input, Segmented, Space, Empty } from "antd";
import {
  DownloadOutlined,
  SearchOutlined,
  DollarOutlined,
  ShopOutlined,
  CalendarOutlined,
  HomeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

const SOURCE_CONFIG = {
  shop: { label: "Shop Expense", color: "#ef4444", icon: <ShopOutlined /> },
  home: { label: "Home Expense", color: "#8b5cf6", icon: <HomeOutlined /> },
  ledger: { label: "Daily Counter Sales", color: "#10b981", icon: <ShopOutlined /> },
  event: { label: "Event Order", color: "#3b82f6", icon: <CalendarOutlined /> },
};

const TransactionTable = ({ transactions = [], loading, onGenerateReport }) => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((item) => {
      const matchType =
        typeFilter === "all"
          ? true
          : typeFilter === "revenue"
          ? item.type === "revenue"
          : item.type === "expense";

      const query = searchText.toLowerCase();
      const matchSearch =
        !searchText ||
        (item.description || "").toLowerCase().includes(query) ||
        (item.category || "").toLowerCase().includes(query) ||
        String(item.amount || "").includes(query);

      return matchType && matchSearch;
    });
  }, [transactions, searchText, typeFilter]);

  const columns = [
    {
      title: "Transaction Date",
      dataIndex: "date",
      key: "date",
      width: 140,
      render: (date) => (
        <Text strong style={{ color: "#334155", fontSize: 13 }}>
          {dayjs(date).format("DD MMM YYYY")}
        </Text>
      ),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (desc, record) => (
        <div>
          <Text strong style={{ color: "#0f172a", fontSize: 14, display: "block" }}>
            {desc || "Transaction"}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Category: {record.category ? record.category.replace("_", " ") : "general"}
          </Text>
        </div>
      ),
    },
    {
      title: "Type & Channel",
      key: "type",
      width: 180,
      render: (record) => {
        const isRev = record.type === "revenue";
        const srcKey = record.category === "ledger" ? "ledger" : record.category === "event" ? "event" : record.source === "home" ? "home" : "shop";
        const src = SOURCE_CONFIG[srcKey] || SOURCE_CONFIG.shop;

        return (
          <Space size={6}>
            <Tag
              color={isRev ? "success" : "error"}
              style={{ borderRadius: 6, fontWeight: 700, fontSize: 11 }}
            >
              {isRev ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {isRev ? "REVENUE" : "EXPENSE"}
            </Tag>
            <Tag color={src.color} style={{ borderRadius: 6, fontSize: 11 }}>
              {src.label}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: "Amount (₹)",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 150,
      render: (amt, record) => {
        const isRev = record.type === "revenue";
        return (
          <Text
            strong
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: isRev ? "#059669" : "#e11d48",
            }}
          >
            {isRev ? "+" : "-"}₹{Number(amt || 0).toLocaleString("en-IN")}
          </Text>
        );
      },
      sorter: (a, b) => a.amount - b.amount,
    },
  ];

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 22,
        background: "#ffffff",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)",
        border: "1px solid #f1f5f9",
      }}
    >
      {/* Table Toolbar */}
      <div
        style={{
          display: "flex",
          justify: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Input
            placeholder="Search transactions..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 260, height: 40, borderRadius: 12, background: "#f8fafc" }}
          />

          <Segmented
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { label: `All (${transactions.length})`, value: "all" },
              { label: "Revenue Only", value: "revenue" },
              { label: "Expenses Only", value: "expense" },
            ]}
            style={{ borderRadius: 10, padding: 3, background: "#f1f5f9" }}
          />
        </div>

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={onGenerateReport}
          style={{
            height: 40,
            borderRadius: 10,
            fontWeight: 700,
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            border: "none",
          }}
        >
          Export Report
        </Button>
      </div>

      {/* Table Component */}
      <Table
        columns={columns}
        dataSource={filteredTransactions}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: <Empty description="No financial transactions found" /> }}
        summary={(pageData) => {
          const totalRev = pageData
            .filter((i) => i.type === "revenue")
            .reduce((s, i) => s + (Number(i.amount) || 0), 0);
          const totalExp = pageData
            .filter((i) => i.type === "expense")
            .reduce((s, i) => s + (Number(i.amount) || 0), 0);
          const net = totalRev - totalExp;

          return (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: "#f8fafc" }}>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <Text strong style={{ color: "#0f172a" }}>
                    Page Financial Summary
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Space size={4}>
                    <Tag color="success">Rev: ₹{totalRev.toLocaleString()}</Tag>
                    <Tag color="error">Exp: ₹{totalExp.toLocaleString()}</Tag>
                  </Space>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong style={{ fontSize: 16, color: net >= 0 ? "#059669" : "#dc2626" }}>
                    Net: ₹{net.toLocaleString("en-IN")}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </Card>
  );
};

export default TransactionTable;
