import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, Row, Col, Divider } from "antd";

const { Option } = Select;

const VendorModal = ({ visible, item, vendorTypes, onCancel, onOk, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (item) {
        form.setFieldsValue({ ...item, suppliedItems: item.suppliedItems || [] });
      } else {
        form.resetFields();
      }
    }
  }, [visible, item, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onOk(values);
  };

  return (
    <Modal
      title={item ? "Edit Vendor" : "Add New Vendor"}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={700}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="name" label="Vendor Name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Milk Supplier" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" label="Vendor Type" rules={[{ required: true }]}>
              <Select placeholder="Select type">
                {vendorTypes.map(v => <Option key={v.value} value={v.value}>{v.label}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="contact" label="Contact Number" rules={[{ required: true }]}>
              <Input placeholder="Contact number" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="suppliedItems" label="Supplied Items" rules={[{ required: true }]}>
              <Select mode="tags" placeholder="e.g. Milk, Chenna" tokenSeparators={[","]}>
                {["Milk", "Chenna", "Sugar", "Ghee", "Flour", "Packaging"].map(i => <Option key={i} value={i}>{i}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="address" label="Address" rules={[{ required: true }]}>
          <Input.TextArea placeholder="Full address" rows={2} />
        </Form.Item>
        <Divider>Supply Details</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="dailySupply" label="Daily Supply Quantity">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="monthlySupply" label="Monthly Supply Quantity">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="rate" label="Rate per Unit (₹)" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default VendorModal;
