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
      setSubmitting(true);
      const values = await form.validateFields();
      await onOk(values);
    } catch (err) {
      setSubmitting(false);
    }
  };

  const autoPurposeOptions = purposeOptions.map(p => ({ value: p }));

  return (
    <Modal
      title={item ? "Edit Event Order" : "Create New Event Order"}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading || submitting}
      okButtonProps={{ disabled: submitting }}
      width={isMobile ? "95vw" : 800}
      centered
      className="responsive-modal"
      styles={{ body: { maxHeight: "70vh", overflowY: "auto", padding: isMobile ? 12 : 24 } }}
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
                placeholder="Type or select purpose (e.g. Wedding, Birthday, Thread Ceremony...)"
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
        <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, marginBottom: 24, border: "1px solid #e2e8f0" }}>
          <Form.Item name="setReminder" valuePropName="checked" style={{ marginBottom: 8 }}>
            <Switch checkedChildren="Reminder ON" unCheckedChildren="Reminder OFF" />
            <Text style={{ marginLeft: 12 }}>Set a yearly reminder for this customer to get repeat business</Text>
          </Form.Item>
          
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.setReminder !== curr.setReminder}>
            {({ getFieldValue }) => getFieldValue("setReminder") && (
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={8}>
                  <Form.Item name="reminderEventType" label="Event Type" rules={[{ required: true, message: "Required" }]}>
                    <AutoComplete
                      options={[
                        { value: "Birthday" },
                        { value: "Anniversary" },
                        { value: "Corporate" },
                        { value: "Thread Ceremony" },
                        { value: "Other" },
                      ]}
                      placeholder="Type or select event type..."
                      filterOption={(inputValue, option) =>
                        option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="reminderEventDate" label="Event Date" rules={[{ required: true, message: "Required" }]}>
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="reminderSecondaryName" label="Secondary Name (Opt)">
                    <Input placeholder="e.g. Spouse/Child" />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </Form.Item>
        </div>

        <Divider>Items Details</Divider>
        <Row gutter={16} align="middle">
          <Col xs={8}>
            <Form.Item name="packets" label="Packets" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={8}>
            <Form.Item name="discount" label="Discount/Pkt">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={8}>
            <Form.Item name="orderStatus" label="Status">
              <Select>
                {orderStatusOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} className="order-item-row" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                  <Form.Item {...restField} name={[name, "itemId"]} rules={[{ required: true }]} style={{ flex: isMobile ? "1 1 100%" : "1 1 200px", marginBottom: 4 }}>
                    <Select placeholder="Select Sweet" showSearch optionFilterProp="children">
                      {inventoryOptions}
                    </Select>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "price"]} rules={[{ required: true }]} style={{ flex: "0 0 90px", marginBottom: 4 }}>
                    <InputNumber placeholder="Price" prefix="₹" style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "quantity"]} rules={[{ required: true }]} style={{ flex: "0 0 70px", marginBottom: 4 }}>
                    <InputNumber placeholder="Qty" style={{ width: "100%" }} />
                  </Form.Item>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} style={{ marginTop: 4 }} />
                </div>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Item</Button>
            </>
          )}
        </Form.List>

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
