import React from "react";
import { Card, List, Typography, Space, Tag, Avatar, Button } from "antd";
import { GiftOutlined, PhoneOutlined, HeartFilled, WhatsAppOutlined } from "@ant-design/icons";
import useFetch from "../../../hooks/useFetch";
import dayjs from "dayjs";
import EmptyState from "./EmptyState";

import { formatWhatsAppPhone } from "../../MarketingPage/config";

const { Text } = Typography;

const AnniversaryReminders = () => {
  const { data: upcoming, loading } = useFetch("/dashboard/upcoming-reminders");

  const handleWhatsApp = (item) => {
    const formattedDate = dayjs(item.date).format("MMMM Do");
    const text = `Namaste ${item.customerName}! Wishing you a very Happy ${item.eventType} coming up on ${formattedDate} from Bharati Sweets! Let us know if you'd like to pre-order any sweets for your celebration.`;
    const formattedPhone = formatWhatsAppPhone(item.phone);
    const url = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
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
        bordered={false}
        className="premium-shadow"
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
          <div style={{
            background: "#fff0f6",
            padding: "8px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <HeartFilled style={{ color: "#eb2f96", fontSize: "18px" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#1e293b" }}>Upcoming Annual Events</span>
        </Space>
      }
      bordered={false}
      className="premium-shadow"
      style={{ borderRadius: 24, height: "100%" }}
      loading={loading}
      bodyStyle={{ padding: "0 16px" }}
    >
      <List
        dataSource={upcoming || []}
        renderItem={item => {
          const annivDate = dayjs(item.date);
          const isToday = annivDate.isSame(dayjs().startOf("day"), "day");
          const daysLeft = annivDate.diff(dayjs().startOf("day"), "day");

          return (
            <List.Item
              actions={[
                <Button 
                  type="primary" 
                  size="small"
                  style={{ background: "#25D366", borderColor: "#25D366" }} 
                  icon={<WhatsAppOutlined />} 
                  onClick={() => handleWhatsApp(item)}
                >
                  WhatsApp
                </Button>,
                <a href={`tel:${item.phone}`}><PhoneOutlined /> Call</a>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<GiftOutlined />} style={{ backgroundColor: '#ffadd2', color: '#eb2f96' }} />}
                title={
                  <Space>
                    <Text strong>{item.customerName}</Text>
                    {item.spouseName && <Text type="secondary">& {item.spouseName}</Text>}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">{annivDate.format("MMMM D, YYYY")}</Text>
                    <Space size={4} style={{ marginTop: 4 }}>
                      <Tag color="purple" style={{ margin: 0 }}>{item.eventType || "Event"}</Tag>
                      {isToday ? (
                        <Tag color="magenta">Today!</Tag>
                      ) : (
                        <Tag color="blue">In {daysLeft} days</Tag>
                      )}
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default AnniversaryReminders;
