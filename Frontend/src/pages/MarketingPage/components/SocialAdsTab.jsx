import React, { useState } from "react";
import {
  Card, Row, Col, Typography, Button, Space, Input, Tag,
  Select, Slider, Steps, Alert, Divider, message
} from "antd";
import {
  FacebookOutlined, InstagramOutlined, CheckCircleOutlined,
  EditOutlined, EnvironmentOutlined, AimOutlined,
  ThunderboltOutlined, DollarOutlined, SendOutlined,
  ExclamationCircleOutlined, BarChartOutlined
} from "@ant-design/icons";
import { AD_OBJECTIVES } from "../config";
import { copyToClipboard } from "../helpers";
import "../MarketingPage.css";

const { Title, Text } = Typography;
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

  // Estimated reach (rough approximation)
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

  // Quick-fill templates (minimal fallback)
  const quickFillTemplates = [
    { id: 1, title: "Festival Greetings", content: "🎉 Bharati Sweets wishes you a joyful celebration!\n\nIndulge in our handcrafted sweets this festive season. 🍬 Fresh. Traditional. Delicious.\n\n📍 Visit us or call to place your order." },
    { id: 2, title: "Wedding Orders", content: "💍 Planning a wedding or special event?\n\nTrust Bharati Sweets for premium bulk orders with custom packaging.\n\n✅ Freshly made on order\n✅ Attractive gift wrapping\n✅ Deliveries across the city" },
    { id: 3, title: "New Launch", content: "🌟 New Arrival at Bharati Sweets!\n\nWe're excited to introduce our latest creation — made with finest ingredients and traditional recipes.\n\nBe the first to taste it!" },
  ];

  return (
    <Row gutter={[28, 28]}>
      {/* Left: Ad Composer */}
      <Col xs={24} xl={15}>
        <Card
          bordered={false}
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
            description="Compose your ad below → set your location + radius → click Launch Ad to open Meta Ads Manager with your ad caption ready to paste. Meta allows you to target people within 1km–80km of your shop."
            style={{ marginBottom: 24, borderRadius: 12 }}
            closable
          />

          {/* Ad Caption */}
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

          {/* Location + Radius */}
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
                tooltip={{ formatter: (v) => `${v} km` }}
                trackStyle={{ background: "#3b82f6", height: 6 }}
                handleStyle={{ borderColor: "#3b82f6", width: 18, height: 18, marginTop: -6 }}
              />
            </Col>
          </Row>

          {/* Objective */}
          <div style={{ marginBottom: 20 }}>
            <Text strong className="text-label">🎯 Campaign Objective</Text>
            <Row gutter={[10, 10]}>
              {AD_OBJECTIVES.map((obj) => (
                <Col xs={12} sm={8} key={obj.value} style={{ flex: "0 0 20%", maxWidth: "20%" }}>
                  <div
                    onClick={() => setObjective(obj.value)}
                    className={`ad-objective-card ${objective === obj.value ? "ad-objective-active" : "ad-objective-inactive"}`}
                  >
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{obj.icon}</div>
                    <Text
                      strong
                      style={{
                        fontSize: 12,
                        color: objective === obj.value ? "#1d4ed8" : "#1e293b",
                        display: "block",
                      }}
                    >
                      {obj.label}
                    </Text>
                  </div>
                </Col>
              ))}
            </Row>
            {selectedObjective && (
              <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
                ℹ️ {selectedObjective.desc}
              </Text>
            )}
          </div>

          {/* Budget */}
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
              tooltip={{ formatter: (v) => `₹${v}` }}
              trackStyle={{ background: "#10b981", height: 6 }}
              handleStyle={{ borderColor: "#10b981", width: 18, height: 18, marginTop: -6 }}
            />
          </div>

          {/* Platform & Launch */}
          <div style={{ marginBottom: 16 }}>
            <Text strong className="text-label">Platform</Text>
            <Select value={adPlatform} onChange={setAdPlatform} style={{ width: "100%" }}>
              <Option value="both">Facebook + Instagram (Recommended)</Option>
              <Option value="facebook">Facebook only</Option>
              <Option value="instagram">Instagram only</Option>
            </Select>
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

      {/* Right: Summary + Guide */}
      <Col xs={24} xl={9}>
        {/* Ad Summary */}
        <Card
          bordered={false}
          className="mkt-card"
          style={{ marginBottom: 24 }}
          title={
            <Space>
              <BarChartOutlined style={{ color: "#3b82f6" }} />
              <span className="mkt-card-title">Ad Summary</span>
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }} size={0}>
            {[
              { label: "Location", value: location || "Not set", icon: <EnvironmentOutlined style={{ color: "#ef4444" }} /> },
              { label: "Radius", value: `${radius} km`, icon: "📏" },
              { label: "Objective", value: selectedObjective?.label, icon: selectedObjective?.icon },
              { label: "Daily Budget", value: `₹${budget}/day`, icon: <DollarOutlined style={{ color: "#10b981" }} /> },
              {
                label: "Platform",
                value: adPlatform === "both" ? "Facebook + Instagram" : adPlatform === "facebook" ? "Facebook" : "Instagram",
                icon: "📱",
              },
            ].map((row, i) => (
              <div key={i} className="ad-summary-row" style={{ borderBottom: i < 4 ? "1px solid #f8fafc" : "none" }}>
                <Space>
                  <span>{row.icon}</span>
                  <Text type="secondary" style={{ fontSize: 13 }}>{row.label}</Text>
                </Space>
                <Text strong className="text-dark" style={{ fontSize: 13 }}>{row.value}</Text>
              </div>
            ))}
          </Space>

          <Divider style={{ margin: "16px 0" }} />

          <div className="ad-reach-box">
            <Text strong style={{ display: "block", marginBottom: 4, color: "#1e293b" }}>
              📡 Estimated Reach
            </Text>
            <Title level={2} className="ad-reach-value">
              {estimatedReach.toLocaleString("en-IN")}+
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              people within {radius}km of {location || "your location"}
            </Text>
            <Text className="ad-reach-disclaimer">
              ⚠️ Estimated reach (approximation) — actual results depend on Meta's ad delivery.
            </Text>
          </div>
        </Card>

        {/* Step-by-step Guide */}
        <Card
          bordered={false}
          className="mkt-card"
          title={
            <Space>
              <CheckCircleOutlined style={{ color: "#10b981" }} />
              <span className="mkt-card-title">How to Launch Ad</span>
            </Space>
          }
        >
          <Steps
            direction="vertical"
            size="small"
            current={-1}
            items={[
              {
                title: <Text strong style={{ fontSize: 13 }}>Fill in your ad details</Text>,
                description: <Text type="secondary" style={{ fontSize: 12 }}>Write caption, set location and radius above</Text>,
                icon: <EditOutlined />,
              },
              {
                title: <Text strong style={{ fontSize: 13 }}>Click "Launch in Meta Ads Manager"</Text>,
                description: <Text type="secondary" style={{ fontSize: 12 }}>Your caption is auto-copied to clipboard</Text>,
                icon: <ThunderboltOutlined />,
              },
              {
                title: <Text strong style={{ fontSize: 13 }}>In Meta Ads Manager</Text>,
                description: (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>• Click "Create Campaign"</Text>
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>• Choose your objective</Text>
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>• Under Audience → Location: type your city</Text>
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>• Set radius to {radius}km</Text>
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>• Paste your caption in the ad text field</Text>
                  </div>
                ),
                icon: <AimOutlined />,
              },
              {
                title: <Text strong style={{ fontSize: 13 }}>Or use "Boost Post"</Text>,
                description: <Text type="secondary" style={{ fontSize: 12 }}>Post on Facebook/Instagram first, then click Boost → set location → radius</Text>,
                icon: <SendOutlined />,
              },
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default SocialAdsTab;
