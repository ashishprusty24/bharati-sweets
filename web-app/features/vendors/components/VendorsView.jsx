"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, Input, Button, Select, message, Typography } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import VendorTable from "./VendorTable";
import VendorModal from "./VendorModal";

const { Title, Text } = Typography;
const { Option } = Select;

const VENDOR_TYPES = [
  { value: "milk", label: "Milk Supplier" },
  { value: "chenna", label: "Chenna Supplier" },
  { value: "raw_material", label: "Raw Material Supplier" },
  { value: "packaging", label: "Packaging Supplier" },
  { value: "other", label: "Other Supplier" },
];

export default function VendorsView() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendors");
      const data = await res.json();
      setVendors(data || []);
    } catch (err) {
      message.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch = v.name?.toLowerCase().includes(searchText.toLowerCase()) || v.contact?.includes(searchText);
      const matchesType = typeFilter === "all" || v.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [vendors, searchText, typeFilter]);

  const handleSave = async (values) => {
    try {
      if (editingVendor) {
        await fetch(`/api/vendors/${editingVendor._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        message.success("Vendor updated successfully");
      } else {
        await fetch("/api/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        message.success("Vendor added successfully");
      }
      setIsModalVisible(false);
      setEditingVendor(null);
      fetchVendors();
    } catch (err) {
      message.error("Failed to save vendor");
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/vendors/${id}`, { method: "DELETE" });
      message.success("Vendor deleted successfully");
      fetchVendors();
    } catch (err) {
      message.error("Failed to delete vendor");
    }
  };

  const openAddEdit = (vendor = null) => {
    setEditingVendor(vendor);
    setIsModalVisible(true);
  };

  return (
    <div style={{ padding: "0 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Vendors & Suppliers</Title>
          <Text type="secondary">Manage milk suppliers, raw material vendors, and outstanding dues.</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => openAddEdit()}
          style={{ borderRadius: 10, height: 45, padding: "0 24px" }}
        >
          Add New Vendor
        </Button>
      </div>

      <Card variant="borderless" style={{ borderRadius: 20 }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <Input
            placeholder="Search vendors..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            style={{ maxWidth: 350, width: "100%", height: 45, borderRadius: 12 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 200, height: 45 }}>
            <Option value="all">All Vendor Types</Option>
            {VENDOR_TYPES.map((t) => (
              <Option key={t.value} value={t.value}>{t.label}</Option>
            ))}
          </Select>
        </div>

        <VendorTable
          data={filteredVendors}
          loading={loading}
          vendorTypes={VENDOR_TYPES}
          onEdit={openAddEdit}
          onDelete={handleDelete}
        />
      </Card>

      <VendorModal
        visible={isModalVisible}
        item={editingVendor}
        vendorTypes={VENDOR_TYPES}
        loading={loading}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSave}
      />
    </div>
  );
}
