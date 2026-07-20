import React, { useEffect, memo } from "react";
import { Modal, Form, Input, InputNumber, Select, Row, Col, Grid, Typography, Divider } from "antd";

const { Text } = Typography;

const { Option } = Select;
const { useBreakpoint } = Grid;

const EventPaymentModal = memo(({ visible, order, paymentMethods, onCancel, onOk, loading }) => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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
      width={isMobile ? "95vw" : 520}
      centered
      className="responsive-modal"
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="amount" label="Payment Amount (₹)" rules={[{ required: true }]}>
              <InputNumber min={0.01} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="method" label="Payment Method" rules={[{ required: true }]}>
              <Select placeholder="Select method">
                {paymentMethods.map(m => <Option key={m.value} value={m.value}>{m.label}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.method !== curr.method}>
          {({ getFieldValue }) => {
            const method = getFieldValue("method");
            if (method === "phonepay" || method === "gpay") {
              return (
                <div style={{ textAlign: "center", margin: "20px 0" }}>
                  <Text strong>Scan to Pay ₹{form.getFieldValue("amount") || order?.totalAmount - (order?.paidAmount || 0)}</Text>
                  <Divider style={{ margin: "10px 0" }} />
                  <img 
                    src="/assets/qrcode.jpeg" 
                    alt="Payment QR Code" 
                    style={{ width: "200px", height: "200px", objectFit: "contain", borderRadius: 8, border: "1px solid #e2e8f0" }} 
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">Customer must enter the amount manually after scanning.</Text>
                  </div>
                </div>
              );
            }
            return null;
          }}
        </Form.Item>
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
