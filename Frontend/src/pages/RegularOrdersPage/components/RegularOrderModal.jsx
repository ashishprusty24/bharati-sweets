import React, { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, Row, Col, Divider, Space, Button, Typography, Switch, DatePicker } from "antd";
import { PlusOutlined, DeleteOutlined, UserOutlined, PhoneOutlined, WalletOutlined, BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { Text } = Typography;

const RegularOrderModal = ({ visible, item, inventoryItems, paymentMethods, onCancel, onOk, loading }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setSubmitting(false);
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
    if (submitting) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onOk(values);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={item ? "Edit Regular Order" : "Create New Regular Order"}
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
          {item ? "Update Order" : "Create Order"}
        </Button>
      ]}
      width={isMobile ? "95vw" : 800}
      centered
      className="responsive-modal"
      styles={{ content: { padding: isMobile ? 15 : 24, overflow: "hidden" }, body: { maxHeight: "75vh", overflowY: "auto", overflowX: "hidden" } }}
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
              {fields.map(({ key, name, ...restField }, index) => (
                <div
                  key={key}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "10px 12px",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 13, color: "#334155" }}>
                      Item #{index + 1}
                    </Text>
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                        style={{ background: "#fef2f2", borderRadius: 6, fontSize: 12, padding: "2px 8px" }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <Row gutter={[10, 10]}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        {...restField}
                        name={[name, "itemId"]}
                        rules={[{ required: true, message: "Select item" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          placeholder="Select Sweet"
                          showSearch
                          optionFilterProp="children"
                          onChange={(value) => {
                            const selected = inventoryItems.find((inv) => inv._id === value);
                            if (selected) {
                              const items = form.getFieldValue("items");
                              items[name] = { ...items[name], itemId: value, price: selected.costPerUnit };
                              form.setFieldsValue({ items });
                            }
                          }}
                        >
                          {inventoryItems.map((inv) => (
                            <Option key={inv._id} value={inv._id}>
                              {inv.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Item
                        {...restField}
                        name={[name, "price"]}
                        rules={[{ required: true, message: "Price" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber placeholder="Price" prefix="₹" style={{ width: "100%" }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Item
                        {...restField}
                        name={[name, "quantity"]}
                        rules={[{ required: true, message: "Qty" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber placeholder="Qty" style={{ width: "100%" }} min={1} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ borderRadius: 10, marginTop: 4, height: 38 }}>
                + Add Sweet / Item
              </Button>
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
                    src="/assets/qrcode.png"
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
