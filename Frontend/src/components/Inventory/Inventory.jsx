"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Typography,
  Card,
  Popconfirm,
  Space,
  Tooltip,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { API_BASE_URL } from "../../common/config";

const { Text } = Typography;
const { Option } = Select;

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Indian Sweet Options
  const sweetOptions = [
    "Rasgulla",
    "Gulab Jamun",
    "Kaju Katli",
    "Barfi",
    "Jalebi",
    "Ladoo",
    "Sandesh",
    "Peda",
    "Soan Papdi",
    "Cham Cham",
    "Motichoor Ladoo",
    "Imarti",
    "Balushahi",
    "Rasmalai",
    "Kalakand",
    "Kesar Katli",
    "Milk Cake",
  ];

  const categoryOptions = [
    "Milk-based",
    "Flour-based",
    "Dry fruits",
    "Fried sweets",
    "Others",
  ];

  const unitOptions = [
    { value: "kg", label: "Kilogram (kg)" },
    { value: "g", label: "Gram (g)" },
    { value: "pieces", label: "Pieces" },
    { value: "packets", label: "Packets" },
    { value: "boxes", label: "Boxes" },
  ];

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/list`);
      const data = await response.json();
      setInventory(data);
      setFilteredInventory(data);
    } catch (error) {
      message.error("Failed to fetch inventory");
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = inventory.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredInventory(filtered);
    } else {
      setFilteredInventory(inventory);
    }
  }, [searchText, inventory]);

  const showModal = (item = null) => {
    if (item) {
      // Convert MongoDB _id to id for form compatibility
      form.setFieldsValue({ ...item, id: item._id });
      setEditingItem(item);
    } else {
      form.resetFields();
      setEditingItem(null);
    }
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const url = editingItem
        ? `${API_BASE_URL}/inventory/${editingItem._id}/update`
        : `${API_BASE_URL}/inventory/create`;

      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to save item");
      }

      message.success(editingItem ? "Item updated!" : "Item added!");
      fetchInventory();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(error.message || "Error saving item");
      console.error("Error saving item:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${id}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      message.success("Item deleted!");
      fetchInventory();
    } catch (error) {
      message.error(error.message || "Error deleting item");
      console.error("Error deleting item:", error);
    }
  };

  const getStatusTag = (status, quantity, minStock) => {
    if (quantity <= 0) {
      return <Tag color="red">Out of Stock</Tag>;
    }

    switch (status) {
      case "in-stock":
        return <Tag color="green">In Stock</Tag>;
      case "low-stock":
        return <Tag color="orange">Low Stock</Tag>;
      case "out-of-stock":
        return <Tag color="red">Out of Stock</Tag>;
      default:
        return quantity > minStock ? (
          <Tag color="green">In Stock</Tag>
        ) : (
          <Tag color="orange">Low Stock</Tag>
        );
    }
  };

  const columns = [
    {
      title: "Sweet Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
      responsive: ["xs", "sm", "md", "lg"],
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      responsive: ["md"],
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (qty, record) => `${qty} ${record.unit}`,
    },
    {
      title: "Cost",
      dataIndex: "costPerUnit",
      key: "cost",
      render: (cost) => `₹${cost}/unit`,
      responsive: ["md"],
    },

    {
      title: "Status",
      key: "status",
      render: (_, record) =>
        getStatusTag(record.status, record.quantity, record.minStock),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="primary"
              shape="circle"
              icon={<EditOutlined />}
              size="small"
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this sweet?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                danger
                shape="circle"
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              gap: 8,
            }}
          >
            <Input
              placeholder="Search sweets..."
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Add Sweet
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredInventory.map((item) => ({
            ...item,
            key: item._id,
          }))}
          rowKey="_id"
          loading={loading}
          // pagination={{ pageSize: 5 }}
          scroll={{ x: true }}
          size="small"
        />
      </Card>

      <Modal
        title={editingItem ? "Edit Sweet" : "Add Sweet"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText={editingItem ? "Update" : "Add"}
        confirmLoading={loading}
        // Make the modal content flexible
        style={{ width: "100%", maxWidth: "none" }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <div style={{ display: "flex", gap: "16px" }}>
            <Form.Item
              name="name"
              label="Sweet Name"
              rules={[{ required: true, message: "Please enter a sweet" }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Enter sweet name" />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Please select a category" }]}
              style={{ flex: 1 }} // Take up available space
            >
              <Select placeholder="Select category" style={{ width: "100%" }}>
                {categoryOptions.map((category) => (
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[{ required: true, message: "Please enter quantity" }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="unit"
              label="Unit"
              rules={[{ required: true, message: "Please select a unit" }]}
            >
              <Select placeholder="Select unit" style={{ width: "100%" }}>
                {unitOptions.map((u) => (
                  <Option key={u.value} value={u.value}>
                    {u.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="minStock"
            label="Minimum Stock"
            rules={[{ required: true, message: "Please enter minimum stock" }]}
            style={{ flex: 1 }}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="costPerUnit"
            label="Cost per Unit (₹)"
            rules={[{ required: true, message: "Please enter cost per unit" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Inventory;
