import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, Row, Col, Divider, Space, Button, Typography, Switch, DatePicker } from "antd";
import { PlusOutlined, DeleteOutlined, UserOutlined, PhoneOutlined, WalletOutlined, BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { Text } = Typography;

const RegularOrderModal = ({ visible, item, inventoryItems, paymentMethods, onCancel, onOk, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (item) {
        form.setFieldsValue({
          ...item,
          paymentMethod: item.payment.method,
          paymentAmount: item.payment.amount,
          cardId: item.payment.cardId,
          items: item.items.map(i => ({ ...i, key: i._id || i.itemId }))
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          paymentMethod: "cash",
          paymentAmount: 0,
          items: [{}],
        });
      }
    }
  }, [visible, item, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onOk(values);
  };

  return (
    <Modal
      title={item ? "Edit Regular Order" : "Create New Regular Order"}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={800}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="customerName" label="Customer Name" rules={[{ required: true }]}>
              <Input prefix={<UserOutlined />} placeholder="Customer name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone" label="Phone Number" rules={[{ required: true }]}>
              <Input prefix={<PhoneOutlined />} placeholder="Phone number" />
            </Form.Item>
          </Col>
        </Row>

        <Divider><BellOutlined /> Smart CRM Reminder</Divider>
        <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, marginBottom: 24, border: "1px solid #e2e8f0" }}>
          <Form.Item name="setReminder" valuePropName="checked" style={{ marginBottom: 8 }}>
            <Switch checkedChildren="Reminder ON" unCheckedChildren="Reminder OFF" />
            <Text style={{ marginLeft: 12 }}>Set a yearly reminder for this customer to get repeat business</Text>
          </Form.Item>
          
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.setReminder !== curr.setReminder}>
            {({ getFieldValue }) => getFieldValue("setReminder") && (
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={8}>
                  <Form.Item name="eventType" label="Event Type" rules={[{ required: true, message: "Required" }]}>
                    <Select placeholder="Type">
                      <Option value="Birthday">Birthday</Option>
                      <Option value="Anniversary">Anniversary</Option>
                      <Option value="Corporate">Corporate</Option>
                      <Option value="Other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="eventDate" label="Event Date" rules={[{ required: true, message: "Required" }]}>
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="secondaryName" label="Secondary Name (Opt)">
                    <Input placeholder="e.g. Spouse/Child" />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </Form.Item>
        </div>

        <Divider>Order Items</Divider>
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                  <Form.Item {...restField} name={[name, "itemId"]} rules={[{ required: true }]} style={{ width: 250 }}>
                    <Select placeholder="Select sweet" showSearch optionFilterProp="children">
                      {inventoryItems.map(inv => <Option key={inv._id} value={inv._id}>{inv.name}</Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "price"]} rules={[{ required: true }]}>
                    <InputNumber placeholder="Price" prefix="₹" style={{ width: 120 }} />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "quantity"]} rules={[{ required: true }]}>
                    <InputNumber placeholder="Qty" style={{ width: 100 }} />
                  </Form.Item>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Item</Button>
            </>
          )}
        </Form.List>

        <Divider>Payment Details</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}>
              <Select placeholder="Select method">
                {paymentMethods.map(m => <Option key={m.value} value={m.value}>{m.label}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="paymentAmount" label="Payment Amount (₹)" rules={[{ required: true }]}>
              <InputNumber prefix={<WalletOutlined />} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.paymentMethod !== curr.paymentMethod}>
          {({ getFieldValue }) => {
            const method = getFieldValue("paymentMethod");
            if (method === "phonepay" || method === "gpay") {
              return (
                <div style={{ textAlign: "center", margin: "20px 0" }}>
                  <Text strong>Scan to Pay ₹{form.getFieldValue("paymentAmount") || 0}</Text>
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
        
        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.paymentMethod !== curr.paymentMethod}>
          {({ getFieldValue }) => getFieldValue("paymentMethod") === "card" && (
            <Form.Item name="cardId" label="Card ID" rules={[{ required: true }]}>
              <Input placeholder="Enter card ID" />
            </Form.Item>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RegularOrderModal;
