import React, { useEffect, memo, useMemo } from "react";
import { Modal, Form, Input, InputNumber, Select, Row, Col, DatePicker, Space, Button, Divider } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;

const EventOrderModal = memo(({ visible, item, inventoryItems, purposeOptions, deliveryTimeOptions, orderStatusOptions, onCancel, onOk, loading }) => {
  const [form] = Form.useForm();

  // Memoize options to prevent heavy re-mapping on every form keystroke
  const inventoryOptions = useMemo(() => {
    return inventoryItems.map(inv => (
      <Option key={inv._id} value={inv._id}>
        {inv.name}
      </Option>
    ));
  }, [inventoryItems]);

  useEffect(() => {
    if (visible) {
      if (item) {
        form.setFieldsValue({
          ...item,
          deliveryDate: dayjs(item.deliveryDate),
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          deliveryDate: dayjs(),
          orderStatus: "pending",
          packets: 1,
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
      title={item ? "Edit Event Order" : "Create New Event Order"}
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
              <Input placeholder="Customer name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone" label="Phone Number" rules={[{ required: true }]}>
              <Input placeholder="Phone number" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="purpose" label="Event Purpose" rules={[{ required: true }]}>
              <Select placeholder="Select purpose">
                {purposeOptions.map(p => <Option key={p} value={p}>{p}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="deliveryDate" label="Delivery Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="deliveryTime" label="Delivery Time" rules={[{ required: true }]}>
              <Select placeholder="Select time">
                {deliveryTimeOptions.map(t => <Option key={t} value={t}>{t}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="address" label="Delivery Address" rules={[{ required: true }]}>
          <Input.TextArea rows={2} />
        </Form.Item>

        <Divider>Items Details</Divider>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Form.Item name="packets" label="Number of Packets" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="discount" label="Discount per Packet">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="orderStatus" label="Order Status">
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
                <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                  <Form.Item {...restField} name={[name, "itemId"]} rules={[{ required: true }]} style={{ width: 300 }}>
                    <Select placeholder="Select Sweet" showSearch optionFilterProp="children">
                      {inventoryOptions}
                    </Select>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "price"]} rules={[{ required: true }]}>
                    <InputNumber placeholder="Price" prefix="₹" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "quantity"]} rules={[{ required: true }]}>
                    <InputNumber placeholder="Qty/Packet" />
                  </Form.Item>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Item</Button>
            </>
          )}
        </Form.List>

        <Form.Item name="notes" label="Special Notes">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
});

export default EventOrderModal;
