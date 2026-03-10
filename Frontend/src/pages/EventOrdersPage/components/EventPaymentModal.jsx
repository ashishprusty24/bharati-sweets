import React, { useEffect, memo } from "react";
import { Modal, Form, Input, InputNumber, Select, Row, Col, Divider } from "antd";

const { Option } = Select;

const EventPaymentModal = memo(({ visible, order, paymentMethods, onCancel, onOk, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && order) {
      form.resetFields();
      form.setFieldsValue({
        amount: order.totalAmount - (order.paidAmount || 0),
        method: "cash",
      });
    }
  }, [visible, order, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onOk(values);
  };

  return (
    <Modal
      title={`Record Payment for ${order?.customerName}`}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="amount" label="Payment Amount (₹)" rules={[{ required: true }]}>
              <InputNumber min={0.01} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="method" label="Payment Method" rules={[{ required: true }]}>
              <Select placeholder="Select method">
                {paymentMethods.map(m => <Option key={m.value} value={m.value}>{m.label}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.method !== curr.method}>
          {({ getFieldValue }) => getFieldValue("method") === "card" && (
            <Form.Item name="cardId" label="Card ID" rules={[{ required: true }]}>
              <Input placeholder="Enter card ID" />
            </Form.Item>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
});

export default EventPaymentModal;
