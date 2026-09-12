import React, { useEffect, memo, useMemo, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, AutoComplete, Row, Col, DatePicker, Button, Divider, Grid, Switch, Typography, Tag } from "antd";
import { PlusOutlined, DeleteOutlined, BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text } = Typography;

const EventOrderModal = memo(({ visible, item, inventoryItems = [], purposeOptions = [], deliveryTimeOptions = [], orderStatusOptions = [], onCancel, onOk, loading }) => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [submitting, setSubmitting] = useState(false);

  const inventoryOptions = useMemo(() => {
    return (inventoryItems || []).map(inv => (
      <Option key={inv._id} value={inv._id}>
        {inv.name}
      </Option>
    ));
  }, [inventoryItems]);

  useEffect(() => {
    if (visible) {
      setSubmitting(false);
      if (item) {
        const initialAdvance = item.advancePayment ?? item.advancePaid ?? item.paidAmount ?? (item.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0) ?? 0;
        const initialMethod = item.advancePaymentMethod ?? item.paymentMethod ?? (item.payments && item.payments[0]?.method) ?? "cash";

        form.setFieldsValue({
          ...item,
          deliveryDate: dayjs(item.deliveryDate || item.eventDate),
          phone: item.customerPhone || item.phone,
          advancePayment: initialAdvance,
          advancePaymentMethod: initialMethod,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          deliveryDate: dayjs(),
          orderStatus: "pending",
          packets: 1,
          items: [{}],
          advancePayment: 0,
          advancePaymentMethod: "cash",
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

  const autoPurposeOptions = purposeOptions.map(p => ({ value: p }));

  return (
    <Modal
      title={item ? "Edit Event Order" : "Create New Event Order"}
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
          {item ? "Update Event Order" : "Create Event Order"}
        </Button>
      ]}
      width={isMobile ? "95vw" : 800}
      centered
      className="responsive-modal"
      styles={{ content: { padding: isMobile ? 15 : 24, overflow: "hidden" }, body: { maxHeight: "75vh", overflowY: "auto", overflowX: "hidden" } }}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="customerName" label="Customer Name" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Customer name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Phone number" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="purpose" label="Event Purpose (Select or Type Custom)" rules={[{ required: true, message: "Required" }]}>
              <AutoComplete
                options={autoPurposeOptions}
                placeholder="Type or select purpose (e.g. Wedding, Birthday, Sacred Thread...)"
                filterOption={(inputValue, option) =>
                  option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                }
              />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="deliveryDate" label="Delivery Date" rules={[{ required: true, message: "Required" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="deliveryTime" label="Delivery Time" rules={[{ required: true, message: "Required" }]}>
              <Select placeholder="Select time">
                {deliveryTimeOptions.map(t => <Option key={t} value={t}>{t}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="address" label="Delivery Address" rules={[{ required: true, message: "Required" }]}>
          <Input.TextArea rows={2} placeholder="Delivery address" />
        </Form.Item>

        <Divider><BellOutlined /> Smart CRM Reminder</Divider>
        <div style={{ background: "#f8fafc", padding: isMobile ? 12 : 16, borderRadius: 10, marginBottom: 20, border: "1px solid #e2e8f0" }}>
          <Form.Item name="setReminder" valuePropName="checked" style={{ marginBottom: 4 }}>
            <Switch checkedChildren="Reminder ON" unCheckedChildren="Reminder OFF" />
            <Text style={{ marginLeft: 12, fontSize: isMobile ? 12 : 13 }}>Set yearly reminder for repeat business</Text>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.setReminder !== curr.setReminder}>
            {({ getFieldValue }) => getFieldValue("setReminder") && (
              <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                <Col xs={24} sm={8}>
                  <Form.Item name="reminderEventType" label="Event Type" rules={[{ required: true, message: "Required" }]}>
                    <Select placeholder="Select Type">
                      <Option value="Birthday">🎂 Birthday</Option>
                      <Option value="Anniversary">💍 Anniversary</Option>
                      <Option value="Corporate">🏢 Corporate</Option>
                      <Option value="Other">⭐ Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={12} sm={8}>
                  <Form.Item name="reminderEventDate" label="Event Date" rules={[{ required: true, message: "Required" }]}>
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={12} sm={8}>
                  <Form.Item name="reminderSecondaryName" label="Secondary Name">
                    <Input placeholder="e.g. Spouse/Child" />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </Form.Item>
        </div>

        <Divider>Items & Quantity Details</Divider>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Form.Item name="packets" label="Packets" rules={[{ required: true, message: "Required" }]}>
              <InputNumber min={1} style={{ width: "100%" }} placeholder="1" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="packetType" label="Packet Type">
              <Input placeholder="e.g. Box, Thali" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="discount" label="Discount / Pkt">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" prefix="₹" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="orderStatus" label="Status">
              <Select placeholder="Status">
                {orderStatusOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>

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
                    padding: isMobile ? "10px 12px" : "12px 14px",
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
                          placeholder="Select Sweet / Item"
                          showSearch
                          optionFilterProp="label"
                          options={(inventoryItems || []).map(inv => ({
                            value: inv._id,
                            label: inv.name,
                            desc: `₹${inv.costPerUnit}/${inv.unit}`
                          }))}
                          optionRender={(option) => (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>{option.label}</span>
                              <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>{option.data.desc}</Tag>
                            </div>
                          )}
                          onChange={(value) => {
                            const selected = (inventoryItems || []).find(inv => inv._id === value);
                            if (selected) {
                              const items = form.getFieldValue("items");
                              items[name] = { ...items[name], itemId: value, price: selected.costPerUnit };
                              form.setFieldsValue({ items });
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Item
                        {...restField}
                        name={[name, "price"]}
                        rules={[{ required: true, message: "Price" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber placeholder="Price (₹)" prefix="₹" style={{ width: "100%" }} min={0} />
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

        {/* 1 Packet Total */}
        <Form.Item noStyle shouldUpdate>
          {({ getFieldValue }) => {
            const items = getFieldValue("items") || [];
            const total = items.reduce((sum, item) => sum + ((Number(item?.price) || 0) * (Number(item?.quantity) || 0)), 0);
            return total > 0 ? (
              <div style={{
                marginTop: 12, padding: "10px 16px", borderRadius: 8,
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <Text strong style={{ color: "#166534" }}>1 Packet Price ({items.filter(i => i?.price && i?.quantity).length} sweets)</Text>
                <Text strong style={{ color: "#166534", fontSize: 16 }}>₹{total}</Text>
              </div>
            ) : null;
          }}
        </Form.Item>

        <Form.Item name="notes" label="Special Notes" style={{ marginTop: 16 }}>
          <Input.TextArea rows={2} />
        </Form.Item>

        <Divider>Advance Payment & Method</Divider>
        <Row gutter={16}>
          <Col xs={12} sm={12}>
            <Form.Item name="advancePayment" label="Advance Payment (₹)">
              <InputNumber prefix="₹" style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={12}>
            <Form.Item name="advancePaymentMethod" label="Payment Method">
              <Select placeholder="Select method">
                <Option value="cash">Cash</Option>
                <Option value="phonepay">PhonePe</Option>
                <Option value="gpay">Google Pay</Option>
                <Option value="card">Card</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
});

export default EventOrderModal;
