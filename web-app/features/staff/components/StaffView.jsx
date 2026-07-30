"use client";

import React, { useState, useEffect } from "react";
import { Card, Table, Button, Input, Modal, Form, InputNumber, message, Typography, Tag } from "antd";
import { PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { formatCurrency } from "../../../utils/currency";

const { Title, Text } = Typography;

export default function StaffView() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      setStaffList(data || []);
    } catch (err) {
      message.error("Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      message.success("Staff member added");
      setModalVisible(false);
      form.resetFields();
      fetchStaff();
    } catch (err) {
      message.error("Failed to save staff member");
    }
  };

  const columns = [
    { title: "Staff Name", dataIndex: "name" },
    { title: "Position / Role", dataIndex: "position", render: (p) => <Tag color="cyan">{p}</Tag> },
    { title: "Contact", dataIndex: "contact" },
    {
      title: "Monthly Salary",
      dataIndex: "salary",
      align: "right",
      render: (amt) => <Text strong style={{ color: "#7c3aed" }}>₹{formatCurrency(amt)}</Text>,
    },
  ];

  return (
    <div style={{ padding: "0 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Staff & Employees</Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
          Add Staff Member
        </Button>
      </div>

      <Card bordered={false} style={{ borderRadius: 20 }}>
        <Table dataSource={staffList} columns={columns} rowKey="_id" loading={loading} />
      </Card>

      <Modal title="Add Staff Member" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleSave} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Staff Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., Arjun, Dilip, Sridhar" />
          </Form.Item>
          <Form.Item name="position" label="Role / Position" rules={[{ required: true }]}>
            <Input placeholder="e.g., Sweets Maker, Helper, Counter Staff" />
          </Form.Item>
          <Form.Item name="contact" label="Contact Phone" rules={[{ required: true }]}>
            <Input placeholder="9876543210" />
          </Form.Item>
          <Form.Item name="salary" label="Monthly Salary (₹)" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} prefix="₹" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
