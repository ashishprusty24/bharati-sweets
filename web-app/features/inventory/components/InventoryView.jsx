"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, Input, Button, Select, message, Typography } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import InventoryTable from "./InventoryTable";
import InventoryModal from "./InventoryModal";

const { Title, Text } = Typography;
const { Option } = Select;

export default function InventoryView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      message.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name?.toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchText, categoryFilter]);

  const handleSave = async (values) => {
    try {
      if (editingItem) {
        await fetch(`/api/inventory/${editingItem._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        message.success("Sweet updated successfully");
      } else {
        await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        message.success("Sweet added successfully");
      }
      setIsModalVisible(false);
      setEditingItem(null);
      fetchInventory();
    } catch (err) {
      message.error("Failed to save sweet");
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      message.success("Sweet deleted successfully");
      fetchInventory();
    } catch (err) {
      message.error("Failed to delete sweet");
    }
  };

  const [defaultType, setDefaultType] = useState("Sweets");

  const openAddEdit = (item = null, type = "Sweets") => {
    setEditingItem(item);
    setDefaultType(type);
    setIsModalVisible(true);
  };

  return (
    <div style={{ padding: "0 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Inventory</Title>
          <Text type="secondary">Track sweets, snacks, namkeens, ingredients, and stock levels.</Text>
        </div>
        <Space wrap size="middle">
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => openAddEdit(null, "Sweets")}
            style={{ borderRadius: 10, height: 42, padding: "0 18px", fontWeight: 600, background: "#10b981", borderColor: "#10b981" }}
          >
            Add Sweets
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => openAddEdit(null, "Snacks")}
            style={{ borderRadius: 10, height: 42, padding: "0 18px", fontWeight: 600, background: "#f59e0b", borderColor: "#f59e0b" }}
          >
            Add Snacks
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => openAddEdit(null, "Namkeens")}
            style={{ borderRadius: 10, height: 42, padding: "0 18px", fontWeight: 600, background: "#8b5cf6", borderColor: "#8b5cf6" }}
          >
            Add Namkeens
          </Button>
        </Space>
      </div>

      <Card variant="borderless" style={{ borderRadius: 20 }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <Input
            placeholder="Search items..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            style={{ maxWidth: 350, width: "100%", height: 45, borderRadius: 12 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 200, height: 45 }}
          >
            <Option value="all">All Categories</Option>
            <Option value="Milk-based">Milk-based</Option>
            <Option value="Flour-based">Flour-based</Option>
            <Option value="Dry fruits">Dry fruits</Option>
            <Option value="Fried sweets">Fried sweets</Option>
            <Option value="Snacks">Snacks</Option>
            <Option value="Namkeens">Namkeens</Option>
            <Option value="Others">Others</Option>
          </Select>
        </div>

        <InventoryTable
          data={filteredItems}
          loading={loading}
          onEdit={(item) => openAddEdit(item, "Sweets")}
          onDelete={handleDelete}
        />
      </Card>

      <InventoryModal
        visible={isModalVisible}
        item={editingItem}
        defaultType={defaultType}
        loading={loading}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSave}
      />
    </div>
  );
}
