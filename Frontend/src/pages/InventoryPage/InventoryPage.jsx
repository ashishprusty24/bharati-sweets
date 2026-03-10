import React, { useState, useMemo } from "react";
import { Card, Input, Button, message, Typography } from "antd";
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

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter((item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [inventory, searchText]);

  const handleAddEdit = (item = null) => {
    setEditingItem(item);
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
      <div className="page-header-container">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Inventory</Title>
          <Text type="secondary">Manage your sweets, ingredients, and stock levels.</Text>
        </div>
        <Button 
          type="primary" 
          size="large"
          icon={<PlusOutlined />} 
          onClick={() => handleAddEdit()}
          style={{ borderRadius: 10, height: 45, padding: "0 24px" }}
        >
          Add New Sweet
        </Button>
      </div>

      <Card bordered={false} className="glass-card" style={{ borderRadius: 20 }}>
        <div className="search-filter-row">
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
            onEdit={handleAddEdit}
            onDelete={handleDelete}
          />
        </div>
      </Card>

      <InventoryModal
        visible={isModalVisible}
        item={editingItem}
        loading={loading}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSave}
      />
    </div>
  );
};

export default InventoryPage;
