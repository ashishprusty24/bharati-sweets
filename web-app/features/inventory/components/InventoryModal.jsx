import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select } from "antd";

const { Option } = Select;

const InventoryModal = ({ visible, item, defaultType = "Sweets", onCancel, onOk, loading }) => {
  const [form] = Form.useForm();

  const getModalTitle = () => {
    if (item) return "Edit Item";
    if (defaultType === "Snacks") return "Add New Snack";
    if (defaultType === "Namkeens") return "Add New Namkeen";
    return "Add New Sweet";
  };

  const getCategoryOptions = () => {
    if (defaultType === "Snacks") {
      return ["Samosa", "Bara", "Cutlet", "Puri", "Kachori", "Snacks", "Others"];
    }
    if (defaultType === "Namkeens") {
      return ["Bhujia", "Mixture", "Sev", "Gathiya", "Chivda", "Papdi", "Namkeens", "Others"];
    }
    return ["Milk-based", "Flour-based", "Dry fruits", "Fried sweets", "Sweets", "Others"];
  };

  const getSubCategoryOptions = () => {
    if (defaultType === "Namkeens") {
      return ["Spicy Mixture", "Sweet & Sour Mixture", "Ratlami Sev", "Nylon Sev", "Aloo Bhujia", "Other Namkeen"];
    }
    if (defaultType === "Snacks") {
      return ["Hot Snack", "Fried Snack", "Evening Snack", "Other Snack"];
    }
    return ["Special Sweet", "Traditional Sweet", "Dry Sweet", "Bengali Sweet", "Other Sweet"];
  };

  const getDefaultKitchenSection = () => {
    if (defaultType === "Snacks") return "Samosa Section";
    if (defaultType === "Namkeens") return "Namkeen Section";
    return "Sweets";
  };

  const getDefaultCategory = () => {
    const opts = getCategoryOptions();
    return opts[0] || "Others";
  };

  useEffect(() => {
    if (visible) {
      if (item) {
        form.setFieldsValue(item);
      } else {
        form.resetFields();
        form.setFieldsValue({
          kitchenSection: getDefaultKitchenSection(),
          category: getDefaultCategory(),
        });
      }
    }
  }, [visible, item, defaultType, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    values.category = item?.category || values.kitchenSection || defaultType || "General";
    onOk(values);
  };

  const unitOptions = [
    { value: "kg", label: "Kilogram (kg)" },
    { value: "g", label: "Gram (g)" },
    { value: "pieces", label: "Pieces" },
    { value: "packets", label: "Packets" },
    { value: "boxes", label: "Boxes" },
  ];

  return (
    <Modal
      title={getModalTitle()}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={item ? "Update" : "Add"}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Item Name" rules={[{ required: true, message: "Please enter item name" }]}>
          <Input placeholder={defaultType === "Snacks" ? "e.g. Samosa, Bara" : defaultType === "Namkeens" ? "e.g. Mixture, Bhujia" : "e.g. Malai Barfi"} />
        </Form.Item>
        <Form.Item name="kitchenSection" label="Kitchen Section" rules={[{ required: true, message: "Please select kitchen section" }]}>
          <Select placeholder="Select kitchen section">
            <Option value="Sweets">Sweets</Option>
            <Option value="Samosa Section">Samosa Section</Option>
            <Option value="Bara Section">Bara Section</Option>
            <Option value="Namkeen Section">Namkeen Section</Option>
            <Option value="Uncategorized">Uncategorized</Option>
          </Select>
        </Form.Item>

        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]} style={{ flex: 1 }}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="unit" label="Unit" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select placeholder="Select unit">
              {unitOptions.map(u => <Option key={u.value} value={u.value}>{u.label}</Option>)}
            </Select>
          </Form.Item>
        </div>
        <Form.Item name="minStock" label="Minimum Stock" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="costPerUnit" label="Cost per Unit (₹)" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InventoryModal;
