import React, { useState, useMemo } from "react";
import {
  Table,
  Input,
  Button,
  Tag,
  Space,
  Popconfirm,
  message,
  Typography,
  Modal,
  Form,
  Select,
  DatePicker,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  WhatsAppOutlined,
  BellOutlined,
  PhoneOutlined,
  PlusOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import { formatWhatsAppPhone } from "../config";

const { Text } = Typography;
const { Option } = Select;

const RemindersTab = () => {
  const { data: reminders, loading, refetch } = useFetch("/reminders");
  const [searchText, setSearchText] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const handleDelete = async (id) => {
    try {
      await api.delete(`/reminders/${id}`);
      message.success("Reminder deleted successfully");
      refetch();
    } catch (error) {
      console.error(error);
      message.error("Failed to delete reminder");
    }
  };

  const handleCreateReminder = async (values) => {
    setSubmitting(true);
    try {
      await api.post("/reminders", {
        customerName: values.customerName,
        secondaryName: values.secondaryName || "",
        phone: values.phone,
        eventType: values.eventType,
        eventDate: values.eventDate.toISOString(),
        notes: values.notes || "",
      });
      message.success("Customer reminder added successfully!");
      setIsAddModalOpen(false);
      form.resetFields();
      refetch();
    } catch (err) {
      console.error(err);
      message.error(err.message || "Failed to create reminder");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsApp = (reminder) => {
    // Determine the occurrence of the event this year
    const today = new Date();
    const anniv = new Date(reminder.eventDate);
    const thisYearAnniv = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate());

    if (thisYearAnniv < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      thisYearAnniv.setFullYear(today.getFullYear() + 1);
    }

    const formattedDate = dayjs(thisYearAnniv).format("MMMM Do");

    const text = `Hello ${reminder.customerName}, wishing you a very Happy ${reminder.eventType} coming up on ${formattedDate} from Bharati Sweets! 🍬 Let us know if you need any sweets or gift boxes for the occasion.`;
    const formattedPhone = formatWhatsAppPhone(reminder.phone);
    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const filteredReminders = useMemo(() => {
    if (!reminders) return [];
    if (!searchText) return reminders;
    const lower = searchText.toLowerCase();
    return reminders.filter(
      (r) =>
        r.customerName.toLowerCase().includes(lower) ||
        r.phone.includes(searchText) ||
        (r.eventType && r.eventType.toLowerCase().includes(lower))
    );
  }, [reminders, searchText]);

  const columns = [
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: "#1e293b" }}>{text}</Text>
          {record.secondaryName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              & {record.secondaryName}
            </Text>
          )}
          {record.notes && (
            <Text type="secondary" style={{ fontSize: 11, color: "#94a3b8" }}>
              {record.notes}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Phone & Quick Call",
      dataIndex: "phone",
      key: "phone",
      render: (text) => (
        <Tooltip title={`Click to call ${text}`}>
          <a
            href={`tel:${text}`}
            style={{
              color: "#0284c7",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <PhoneOutlined /> {text}
          </a>
        </Tooltip>
      ),
    },
    {
      title: "Event Type",
      dataIndex: "eventType",
      key: "eventType",
      render: (text) => (
        <Tag
          color={
            text === "Birthday"
              ? "purple"
              : text === "Anniversary"
              ? "magenta"
              : text === "Festival"
              ? "gold"
              : "blue"
          }
          style={{ borderRadius: 6, fontWeight: 600 }}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: "Event Date",
      dataIndex: "eventDate",
      key: "eventDate",
      render: (text) => {
        const annivDate = dayjs(text);
        return (
          <Space size={4}>
            <CalendarOutlined style={{ color: "#64748b" }} />
            <Text>{annivDate.format("MMMM D")}</Text>
          </Space>
        );
      },
    },
    {
      title: "Due In",
      key: "status",
      render: (_, record) => {
        const today = new Date();
        const anniv = new Date(record.eventDate);
        const thisYearAnniv = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate());

        if (thisYearAnniv < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
          thisYearAnniv.setFullYear(today.getFullYear() + 1);
        }

        const daysLeft = dayjs(thisYearAnniv).diff(dayjs().startOf("day"), "day");

        if (daysLeft === 0)
          return <Tag color="error" style={{ borderRadius: 6, fontWeight: 700 }}>🎉 Today</Tag>;
        if (daysLeft <= 7)
          return <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600 }}>⚡ In {daysLeft} days</Tag>;
        if (daysLeft <= 30)
          return <Tag color="warning" style={{ borderRadius: 6 }}>In {daysLeft} days</Tag>;
        return <Tag color="default" style={{ borderRadius: 6 }}>In {daysLeft} days</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          {/* Direct Call Button */}
          <Tooltip title={`Call ${record.customerName}`}>
            <Button
              icon={<PhoneOutlined />}
              href={record.phone ? `tel:${record.phone}` : undefined}
              disabled={!record.phone}
              style={{
                borderRadius: 8,
                background: "#e0f2fe",
                color: "#0369a1",
                borderColor: "#bae6fd",
                fontWeight: 600,
              }}
            >
              Call
            </Button>
          </Tooltip>

          {/* WhatsApp Greeting Button */}
          <Tooltip title={`Send WhatsApp to ${record.customerName}`}>
            <Button
              type="primary"
              style={{
                background: "#25D366",
                borderColor: "#25D366",
                borderRadius: 8,
                fontWeight: 600,
              }}
              icon={<WhatsAppOutlined />}
              onClick={() => handleWhatsApp(record)}
            >
              Message
            </Button>
          </Tooltip>

          {/* Delete Button */}
          <Popconfirm
            title="Delete reminder?"
            description="Are you sure you want to delete this reminder?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Text strong style={{ fontSize: 18, color: "#1e293b" }}>
            <BellOutlined style={{ marginRight: 6, color: "#f59e0b" }} />
            Customer Event Reminders
          </Text>
          <br />
          <Text type="secondary">
            Keep track of customer birthdays, wedding anniversaries, and send festive greetings.
          </Text>
        </div>

        <Space wrap>
          <Input
            placeholder="Search by customer or phone..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            style={{ width: 280, borderRadius: 8 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalOpen(true)}
            style={{
              background: "#4a151b",
              borderColor: "#4a151b",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Add Reminder
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredReminders}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />

      {/* Modal: Add Reminder */}
      <Modal
        title="Add Customer Event Reminder"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateReminder}>
          <Form.Item
            name="customerName"
            label="Customer Name"
            rules={[{ required: true, message: "Please enter customer name" }]}
          >
            <Input placeholder="e.g. Ramesh Kumar" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number (for Call & WhatsApp)"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input placeholder="e.g. 9876543210" prefix={<PhoneOutlined />} />
          </Form.Item>

          <Form.Item name="secondaryName" label="Spouse / Family Member Name (Optional)">
            <Input placeholder="e.g. Sunita Kumar" />
          </Form.Item>

          <Form.Item
            name="eventType"
            label="Event Type"
            initialValue="Birthday"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="Birthday">🎂 Birthday</Option>
              <Option value="Anniversary">💍 Wedding Anniversary</Option>
              <Option value="Festival">🪔 Festival / Special Occasion</Option>
              <Option value="Other">⭐ Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="eventDate"
            label="Event Date"
            rules={[{ required: true, message: "Please choose date" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
          </Form.Item>

          <Form.Item name="notes" label="Notes / Sweet Preferences (Optional)">
            <Input.TextArea rows={2} placeholder="e.g. Loves Kaju Katli and Chenna Poda" />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{ background: "#4a151b", borderColor: "#4a151b" }}
            >
              Save Reminder
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default RemindersTab;
