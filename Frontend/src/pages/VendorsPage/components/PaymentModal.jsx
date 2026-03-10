import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, Row, Col, Divider, DatePicker } from "antd";
import dayjs from "dayjs";

const { Option } = Select;

const PaymentModal = ({ visible, vendor, creditCards, paymentMethods, onCancel, onOk, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && vendor) {
      form.resetFields();
      form.setFieldsValue({
        vendorId: vendor._id,
        date: dayjs(),
        quantity: vendor.dailySupply || vendor.monthlySupply || 0,
        rate: vendor.rate || 0,
        paymentMethod: "cash",
      });
    }
  }, [visible, vendor, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onOk({
      ...values,
      date: values.date.toISOString(),
      amount: values.quantity * values.rate,
    });
  };

  return (
    <Modal
      title={`Make Payment to ${vendor?.name || "Vendor"}`}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="vendorId" hidden><Input /></Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="date" label="Payment Date" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="rate" label="Rate per Unit (₹)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Total Amount">
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.quantity !== curr.quantity || prev.rate !== curr.rate}>
                {({ getFieldValue }) => {
                  const q = getFieldValue("quantity") || 0;
                  const r = getFieldValue("rate") || 0;
                  return <InputNumber value={q * r} disabled style={{ width: "100%" }} />;
                }}
              </Form.Item>
            </Form.Item>
          </Col>
        </Row>
        <Divider>Payment Method</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}>
              <Select placeholder="Select method">
                {paymentMethods.map(m => <Option key={m.value} value={m.value}>{m.label}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.paymentMethod !== curr.paymentMethod}>
              {({ getFieldValue }) => getFieldValue("paymentMethod") === "card" && (
                <Form.Item name="card" label="Credit Card" rules={[{ required: true }]}>
                  <Select placeholder="Select card">
                    {creditCards.map(c => <Option key={c._id} value={c._id}>{c.name} (****{c.last4})</Option>)}
                  </Select>
                </Form.Item>
              )}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default PaymentModal;
