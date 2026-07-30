import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select } from "antd";

const { Option } = Select;

const InventoryModal = ({ visible, item, onCancel, onOk, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (item) {
        form.setFieldsValue(item);
      } else {
        form.resetFields();
      }
    }
  }, [visible, item, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onOk(values);
  };

  const categoryOptions = ["Milk-based", "Flour-based", "Dry fruits", "Fried sweets", "Others"];
  const unitOptions = [
    { value: "kg", label: "Kilogram (kg)" },
    { value: "g", label: "Gram (g)" },
    { value: "pieces", label: "Pieces" },
    { value: "packets", label: "Packets" },
    { value: "boxes", label: "Boxes" },
  ];

  return (
    <Modal
      title={item ? "Edit Sweet" : "Add Sweet"}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={item ? "Update" : "Add"}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Sweet Name" rules={[{ required: true }]}>
          <Input placeholder="Enter sweet name" />
        </Form.Item>
        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Select placeholder="Select category">
            {categoryOptions.map(cat => <Option key={cat} value={cat}>{cat}</Option>)}
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
