import React, { useState, useMemo } from "react";
import { Card, Input, Button, message, Typography, Space } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import useFetch from "../../hooks/useFetch";
import api from "../../services/api";
import InventoryTable from "./components/InventoryTable";
import InventoryModal from "./components/InventoryModal";

const { Title, Text } = Typography;

const InventoryPage = () => {
  const { data: inventory, loading, refetch } = useFetch("/inventory/list");
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [defaultType, setDefaultType] = useState("Sweets");

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter((item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [inventory, searchText]);

  const handleAddEdit = (item = null, type = "Sweets") => {
    setEditingItem(item);
    setDefaultType(type);
    setIsModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem._id}/update`, values);
        message.success("Item updated successfully");
      } else {
        await api.post("/inventory/create", values);
        message.success("Item added successfully");
      }
      setIsModalVisible(false);
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/inventory/${id}/delete`);
      message.success("Item deleted successfully");
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: "0 8px" }}>
      <div className="page-header-container" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Inventory</Title>
          <Text type="secondary">Manage your sweets, snacks, namkeens, ingredients, and stock levels.</Text>
        </div>
        <Space wrap size="middle">
          <Button 
            type="primary" 
            size="large"
            icon={<PlusOutlined />} 
            onClick={() => handleAddEdit(null, "Sweets")}
            style={{ borderRadius: 10, height: 42, padding: "0 18px", fontWeight: 600, background: "#10b981", borderColor: "#10b981" }}
          >
            Add Sweets
          </Button>
          <Button 
            type="primary" 
            size="large"
            icon={<PlusOutlined />} 
            onClick={() => handleAddEdit(null, "Snacks")}
            style={{ borderRadius: 10, height: 42, padding: "0 18px", fontWeight: 600, background: "#f59e0b", borderColor: "#f59e0b" }}
          >
            Add Snacks
          </Button>
          <Button 
            type="primary" 
            size="large"
            icon={<PlusOutlined />} 
            onClick={() => handleAddEdit(null, "Namkeens")}
            style={{ borderRadius: 10, height: 42, padding: "0 18px", fontWeight: 600, background: "#8b5cf6", borderColor: "#8b5cf6" }}
          >
            Add Namkeens
          </Button>
        </Space>
      </div>

      <Card bordered={false} className="glass-card" style={{ borderRadius: 20 }}>
        <div className="search-filter-row" style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search items by name..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            style={{ 
              maxWidth: 350, 
              width: "100%",
              height: 45, 
              borderRadius: 12,
              background: "#f8fafc",
              border: "1px solid #e2e8f0"
            }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="responsive-table-container">
          <InventoryTable
            data={filteredInventory}
            loading={loading}
            onEdit={(item) => handleAddEdit(item, "Sweets")}
            onDelete={handleDelete}
          />
        </div>
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
};

export default InventoryPage;
