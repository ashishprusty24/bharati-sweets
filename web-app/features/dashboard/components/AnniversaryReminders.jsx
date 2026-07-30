"use client";

import React, { useState, useEffect } from "react";
import { Card, List, Typography, Space, Tag, Avatar, Button } from "antd";
import { GiftOutlined, PhoneOutlined, HeartFilled, WhatsAppOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import EmptyState from "./EmptyState";

const { Text } = Typography;

const AnniversaryReminders = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/reminders")
      .then((res) => res.json())
      .then((data) => setUpcoming(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleWhatsApp = (item) => {
    const formattedDate = dayjs(item.eventDate).format("MMMM D");
    const text = `Namaste ${item.customerName}! Wishing you a very Happy ${item.eventType} coming up on ${formattedDate} from Bharati Sweets! Let us know if you'd like to pre-order any sweets for your celebration.`;
    const url = `https://wa.me/91${item.phone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  if (!loading && (!upcoming || upcoming.length === 0)) {
    return (
      <Card
        title={
          <Space>
            <GiftOutlined style={{ color: "#94a3b8" }} />
            <span style={{ fontWeight: 700 }}>Upcoming Annual Events</span>
          </Space>
        }
        variant="borderless"
        style={{ borderRadius: 24, height: "100%" }}
      >
        <EmptyState message="No upcoming events in the next 30 days" height={220} />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <div style={{ background: "#fff0f6", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center" }}>
            <HeartFilled style={{ color: "#eb2f96", fontSize: "18px" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#1e293b" }}>Upcoming Annual Events</span>
        </Space>
      }
      variant="borderless"
      style={{ borderRadius: 24, height: "100%" }}
      loading={loading}
    >
      <List
        dataSource={upcoming}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button key="wa" type="primary" size="small" style={{ background: "#25D366", borderColor: "#25D366" }} icon={<WhatsAppOutlined />} onClick={() => handleWhatsApp(item)}>
                WhatsApp
              </Button>,
              <a key="call" href={`tel:${item.phone}`}><PhoneOutlined /> Call</a>,
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<GiftOutlined />} style={{ backgroundColor: "#ffadd2", color: "#eb2f96" }} />}
              title={<Text strong>{item.customerName}</Text>}
              description={dayjs(item.eventDate).format("MMMM D, YYYY")}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default AnniversaryReminders;
