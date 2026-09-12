import React, { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, Row, Col, DatePicker, Button } from "antd";
import dayjs from "dayjs";

const { TextArea } = Input;

const ExpenseModal = ({ visible, item, categories, paymentMethods, onCancel, onOk, loading }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setSubmitting(false);
      if (item) {
        form.setFieldsValue({ ...item, date: dayjs(item.date) });
      } else {
        form.resetFields();
        form.setFieldsValue({ date: dayjs(), paymentMethod: "cash" });
      }
    }
  }, [visible, item, form]);

  const handleSubmit = async () => {
    if (submitting) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onOk({ ...values, date: values.date.format("YYYY-MM-DD") });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={item ? "Edit Expense" : "Add Expense"}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
          style={{ backgroundColor: "#4a151b", borderColor: "#4a151b" }}
        >
          {item ? "Update Expense" : "Add Expense"}
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="description" label="Description" rules={[{ required: true }]}>
              <Input placeholder="e.g. Milk Purchase" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="vendor" label="Vendor Name">
              <Input placeholder="e.g. Annapurna Bakery" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
              <Select placeholder="Select category">
                {categories.map(c => <Select.Option key={c.value} value={c.value}>{c.label}</Select.Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}>
              <Select placeholder="Select method">
                {paymentMethods.map(m => <Select.Option key={m.value} value={m.value}>{m.label}</Select.Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="notes" label="Notes">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExpenseModal;
