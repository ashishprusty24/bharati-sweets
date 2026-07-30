import React, { useState } from "react";
import {
  Card, Row, Col, Typography, Button, Space, Input, Tag,
  Select, Slider, Steps, Alert, message
} from "antd";
import {
  FacebookOutlined, InstagramOutlined, CheckCircleOutlined,
  EditOutlined, EnvironmentOutlined, AimOutlined,
  ThunderboltOutlined, DollarOutlined, SendOutlined,
  ExclamationCircleOutlined, BarChartOutlined
} from "@ant-design/icons";
import { AD_OBJECTIVES } from "./config";
import { copyToClipboard } from "./helpers";
import "./MarketingPage.css";

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SocialAdsTab = () => {
  const [adCaption, setAdCaption] = useState(
    "🍬 Fresh & Traditional Sweets by Bharati Sweets!\n\n✅ Handcrafted daily\n✅ Bulk orders for weddings & events\n✅ Delivery available\n\n📍 Visit us today or call to order!"
  );
  const [location, setLocation] = useState("Bhubaneswar, Odisha");
  const [radius, setRadius] = useState(50);
  const [objective, setObjective] = useState("AWARENESS");
  const [budget, setBudget] = useState(200);
  const [adPlatform, setAdPlatform] = useState("both");

  const estimatedReach = Math.round(radius * radius * 3.14 * 8);

  const openMetaAdsManager = async () => {
    if (!adCaption.trim() || !location.trim()) {
      message.warning("Please fill in ad caption and location.");
      return;
    }
    window.open("https://adsmanager.facebook.com/adsmanager/creation", "_blank");
    const copied = await copyToClipboard(adCaption);
    if (copied) {
      message.success({
        content: "Ad caption copied! Paste it in Meta Ads Manager. Set location to: " + location + " within " + radius + "km.",
        duration: 6,
      });
    }
  };

  const openBoostFacebook = async () => {
    window.open("https://www.facebook.com/ads/create", "_blank");
    const copied = await copyToClipboard(adCaption);
    if (copied) {
      message.info({
        content: `Caption copied! In Facebook, create a post, click "Boost Post", then set location to ${location} with ${radius}km radius.`,
        duration: 8,
      });
    }
  };

  const openInstagramAd = async () => {
    window.open("https://business.instagram.com/", "_blank");
    const copied = await copyToClipboard(adCaption);
    if (copied) {
      message.info({
        content: `Caption copied! In Instagram, go to a post → Promote → set location to ${location}, radius ${radius}km.`,
        duration: 8,
      });
    }
  };

  const selectedObjective = AD_OBJECTIVES.find((o) => o.value === objective);

  const quickFillTemplates = [
    { id: 1, title: "Festival Greetings", content: "🎉 Bharati Sweets wishes you a joyful celebration!\n\nIndulge in our handcrafted sweets this festive season. 🍬 Fresh. Traditional. Delicious.\n\n📍 Visit us or call to place your order." },
    { id: 2, title: "Wedding Orders", content: "💍 Planning a wedding or special event?\n\nTrust Bharati Sweets for premium bulk orders with custom packaging.\n\n✅ Freshly made on order\n✅ Attractive gift wrapping\n✅ Deliveries across the city" },
    { id: 3, title: "New Launch", content: "🌟 New Arrival at Bharati Sweets!\n\nWe're excited to introduce our latest creation — made with finest ingredients and traditional recipes.\n\nBe the first to taste it!" },
  ];

  return (
    <Row gutter={[28, 28]}>
      <Col xs={24} xl={15}>
        <Card
          variant="borderless"
          className="mkt-card"
          title={
            <Space>
              <AimOutlined style={{ color: "#ef4444" }} />
              <span className="mkt-card-title">Local Ad Creator</span>
              <Tag color="red" className="tag-rounded">Location Targeted</Tag>
            </Space>
          }
        >
          <Alert
            type="info"
            showIcon
            icon={<ExclamationCircleOutlined />}
            message="How it works"
            description="Compose your ad below → set your location + radius → click Launch Ad to open Meta Ads Manager with your ad caption ready to paste."
            style={{ marginBottom: 24, borderRadius: 12 }}
            closable
          />

          <div style={{ marginBottom: 20 }}>
            <Text strong className="text-label">📝 Ad Caption / Post Text</Text>
            <TextArea
              rows={6}
              value={adCaption}
              onChange={(e) => setAdCaption(e.target.value)}
              className="ad-textarea"
              placeholder="Write your ad text here..."
              showCount
              maxLength={2200}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Quick fill: </Text>
              {quickFillTemplates.map((t) => (
                <Button
                  key={t.id}
                  size="small"
                  className="quick-fill-btn"
                  onClick={() => setAdCaption(t.content)}
                >
                  {t.title}
                </Button>
              ))}
            </div>
          </div>

          <Row gutter={24} style={{ marginBottom: 20 }}>
            <Col xs={24} md={12}>
              <Text strong className="text-label">
                <EnvironmentOutlined style={{ marginRight: 6, color: "#ef4444" }} />
                Location (City / Area)
              </Text>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bhubaneswar, Odisha"
                className="ad-location-input"
                prefix={<EnvironmentOutlined style={{ color: "#94a3b8" }} />}
              />
            </Col>
            <Col xs={24} md={12}>
              <Text strong className="text-label">
                📏 Radius: <span className="text-blue fw-800">{radius} km</span>
              </Text>
              <Slider
                min={1}
                max={80}
                value={radius}
                onChange={setRadius}
                marks={{ 1: "1km", 25: "25km", 50: "50km", 80: "80km" }}
              />
            </Col>
          </Row>

          <div style={{ marginBottom: 24 }}>
            <Text strong className="text-label">
              <DollarOutlined style={{ marginRight: 6, color: "#f59e0b" }} />
              Daily Budget: <span className="text-green fw-800">₹{budget}/day</span>
            </Text>
            <Slider
              min={50}
              max={2000}
              step={50}
              value={budget}
              onChange={setBudget}
              marks={{ 50: "₹50", 500: "₹500", 1000: "₹1k", 2000: "₹2k" }}
            />
          </div>

          <Row gutter={12}>
            <Col xs={24} md={14}>
              <Button
                block
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={openMetaAdsManager}
                className="ad-launch-btn"
              >
                Launch in Meta Ads Manager
              </Button>
            </Col>
            <Col xs={12} md={5}>
              <Button
                block
                size="large"
                icon={<FacebookOutlined />}
                onClick={openBoostFacebook}
                className="ad-boost-facebook-btn"
              >
                Boost
              </Button>
            </Col>
            <Col xs={12} md={5}>
              <Button
                block
                size="large"
                icon={<InstagramOutlined />}
                onClick={openInstagramAd}
                className="ad-boost-instagram-btn"
              >
                Promote
              </Button>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

export default SocialAdsTab;
