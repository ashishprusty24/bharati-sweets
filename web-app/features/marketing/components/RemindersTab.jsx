import React, { useState, useEffect, useMemo } from "react";
import { Table, Input, Button, Tag, Space, Popconfirm, message, Typography } from "antd";
import { SearchOutlined, DeleteOutlined, WhatsAppOutlined, BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { formatWhatsAppPhone } from "./config";

const { Text } = Typography;

const RemindersTab = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/reminders");
      const data = await res.json();
      setReminders(data || []);
    } catch (err) {
      message.error("Failed to fetch reminders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleDelete = async (id) => {
    try {
      message.success("Reminder deleted successfully");
      fetchReminders();
    } catch (error) {
      message.error("Failed to delete reminder");
    }
  };

  const handleWhatsApp = (reminder) => {
    const today = new Date();
    const anniv = new Date(reminder.eventDate);
    const thisYearAnniv = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate());
    
    if (thisYearAnniv < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      thisYearAnniv.setFullYear(today.getFullYear() + 1);
    }
    
    const formattedDate = dayjs(thisYearAnniv).format("MMMM D");
    
    const text = `Hello ${reminder.customerName}, wishing you a very Happy ${reminder.eventType} coming up on ${formattedDate} from Bharati Sweets! Let us know if you need any sweets for the occasion.`;
    const formattedPhone = formatWhatsAppPhone(reminder.phone);
    const url = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const filteredReminders = useMemo(() => {
    if (!reminders) return [];
    if (!searchText) return reminders;
    const lower = searchText.toLowerCase();
    return reminders.filter(r => 
      r.customerName?.toLowerCase().includes(lower) || 
      r.phone?.includes(searchText)
    );
  }, [reminders, searchText]);

  const columns = [
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.secondaryName && <Text type="secondary" style={{ fontSize: 12 }}>& {record.secondaryName}</Text>}
        </Space>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Event Type",
      dataIndex: "eventType",
      key: "eventType",
      render: (text) => (
        <Tag color={text === "Birthday" ? "purple" : text === "Anniversary" ? "magenta" : "blue"}>
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
        return <Text>{annivDate.format("MMMM D")}</Text>;
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const today = new Date();
        const anniv = new Date(record.eventDate);
        const thisYearAnniv = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate());
        
        if (thisYearAnniv < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
          thisYearAnniv.setFullYear(today.getFullYear() + 1);
        }
        
        const daysLeft = dayjs(thisYearAnniv).diff(dayjs().startOf("day"), "day");
        
        if (daysLeft === 0) return <Tag color="error">Today</Tag>;
        if (daysLeft <= 30) return <Tag color="warning">In {daysLeft} days</Tag>;
        return <Tag color="default">In {daysLeft} days</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            style={{ background: "#25D366" }} 
            icon={<WhatsAppOutlined />} 
            onClick={() => handleWhatsApp(record)}
          >
            Message
          </Button>
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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <Text strong style={{ fontSize: 16 }}><BellOutlined /> All CRM Reminders</Text>
          <br />
          <Text type="secondary">Manage your saved customer events and send WhatsApp greetings.</Text>
        </div>
        <Input
          placeholder="Search by customer or phone..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>
      <Table 
        columns={columns} 
        dataSource={filteredReminders} 
        rowKey="_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default RemindersTab;
