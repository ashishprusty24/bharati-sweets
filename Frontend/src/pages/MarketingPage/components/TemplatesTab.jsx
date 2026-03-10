import React, { useState } from "react";
import {
  Card, Row, Col, Typography, Button, Space, Input, Tag,
  Select, List, Avatar, Tooltip, message, Divider, Empty, Spin
} from "antd";
import {
  WhatsAppOutlined, FacebookOutlined, InstagramOutlined,
  SendOutlined, CopyOutlined, CheckCircleOutlined,
  MessageOutlined, EditOutlined, StarOutlined, CalendarOutlined
} from "@ant-design/icons";

const PLATFORM_ICONS = {
  whatsapp: <WhatsAppOutlined />,
  facebook: <FacebookOutlined />,
  instagram: <InstagramOutlined />,
};
import useFetch from "../../../hooks/useFetch";
import { PLATFORM_CONFIG } from "../config";
import { platformSend, copyToClipboard } from "../helpers";
import "../MarketingPage.css";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ─────────────────────────────────────────────
// Campaign Analytics inline component
// ─────────────────────────────────────────────
const CampaignAnalytics = ({ campaign }) => {
  const a = campaign.analytics || {};
  const metrics = [
    { label: "Sent", value: a.sent || 0, color: "#3b82f6" },
    { label: "Delivered", value: a.delivered || 0, color: "#10b981" },
    { label: "Clicked", value: a.clicked || 0, color: "#f59e0b" },
    { label: "Orders", value: a.ordersGenerated || 0, color: "#8b5cf6" },
    { label: "Revenue", value: `₹${(a.revenue || 0).toLocaleString("en-IN")}`, color: "#ef4444" },
  ];

  return (
    <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
      {metrics.map((m) => (
        <Col key={m.label} xs={8} sm={4}>
          <div className="analytics-metric">
            <Title level={5} className="analytics-metric-value" style={{ color: m.color }}>
              {m.value}
            </Title>
            <Text className="analytics-metric-label">{m.label}</Text>
          </div>
        </Col>
      ))}
    </Row>
  );
};

// ─────────────────────────────────────────────
// Templates Tab
// ─────────────────────────────────────────────
const TemplatesTab = () => {
  const [filter, setFilter] = useState("All");
  const [customMsg, setCustomMsg] = useState("");
  const [selPlatforms, setSelPlatforms] = useState(["whatsapp"]);
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const categories = ["All", "Festival", "Event", "Promotion", "Seasonal"];

  // Fetch from API
  const { data: rawTemplates, loading: templatesLoading } = useFetch("/marketing/templates", { silent: true });
  const { data: rawCampaigns, loading: campaignsLoading } = useFetch("/marketing/campaigns", { silent: true });
  
  const templates = rawTemplates ?? [];
  const campaigns = rawCampaigns ?? [];

  const filtered = filter === "All" ? templates : templates.filter((t) => t.category === filter);

  const handleCopyTemplate = async (content) => {
    const copied = await copyToClipboard(content);
    if (copied) {
      message.success("Copied!");
    }
  };

  return (
    <Row gutter={[28, 28]}>
      <Col xs={24} xl={16}>
        <Card
          bordered={false}
          className="mkt-card"
          title={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <Title level={4} style={{ margin: 0 }}>Message Templates</Title>
              <Space wrap>
                {categories.map((c) => (
                  <Button
                    key={c}
                    size="small"
                    type={filter === c ? "primary" : "default"}
                    onClick={() => setFilter(c)}
                    style={{ borderRadius: 8 }}
                  >
                    {c}
                  </Button>
                ))}
              </Space>
            </div>
          }
        >
          {templatesLoading ? (
            <div style={{ padding: 40, textAlign: "center" }}><Spin /></div>
          ) : filtered.length === 0 ? (
            <Empty description="No templates found" />
          ) : (
            <Row gutter={[20, 20]}>
              {filtered.map((t) => (
                <Col xs={24} md={12} key={t._id || t.id}>
                  <Card bordered={false} hoverable className="template-card" bodyStyle={{ padding: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <Tag color="blue" className="tag-rounded" style={{ fontWeight: 600, marginBottom: 6 }}>{t.category}</Tag>
                        <Title level={5} style={{ margin: 0, color: "#1e293b" }}>{t.title}</Title>
                      </div>
                      <Tooltip title="Copy">
                        <Button
                          shape="circle"
                          icon={<CopyOutlined />}
                          onClick={() => handleCopyTemplate(t.content)}
                        />
                      </Tooltip>
                    </div>
                    <div className="template-content-preview">{t.content}</div>
                    <Space wrap>
                      {(t.platforms || []).map((p) => {
                        const cfg = PLATFORM_CONFIG[p];
                        if (!cfg) return null;
                        return (
                          <Button
                            key={p}
                            icon={PLATFORM_ICONS[p]}
                            onClick={() => platformSend(p, t.content, null)}
                            style={{
                              background: cfg.bg,
                              color: cfg.textColor,
                              borderColor: "transparent",
                              borderRadius: 10,
                              fontWeight: 600,
                              height: 36,
                            }}
                          >
                            {cfg.label}
                          </Button>
                        );
                      })}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card>

        {/* Campaign History */}
        <Card
          bordered={false}
          className="mkt-card"
          style={{ marginTop: 24 }}
          title={<Title level={4} style={{ margin: 0 }}>Recent Campaigns</Title>}
        >
          {campaignsLoading ? (
            <div style={{ padding: 40, textAlign: "center" }}><Spin /></div>
          ) : campaigns.length === 0 ? (
            <Empty description="No campaigns yet. Send your first campaign from the Customer WhatsApp tab!" />
          ) : (
            <List
              dataSource={campaigns}
              renderItem={(camp) => {
                const cfg = PLATFORM_CONFIG[camp.platform] || {};
                const a = camp.analytics || {};
                const rate = a.sent > 0 ? Math.round((a.delivered / a.sent) * 100) : 0;
                const isExpanded = expandedCampaign === camp._id;

                return (
                  <List.Item
                    className="campaign-item"
                    style={{ cursor: "pointer", flexDirection: "column", alignItems: "stretch" }}
                    onClick={() => setExpandedCampaign(isExpanded ? null : camp._id)}
                  >
                    <div className="campaign-item-row">
                      <Avatar icon={PLATFORM_ICONS[camp.platform]} style={{ background: cfg.bg, color: cfg.color, flexShrink: 0 }} />
                      <div className="campaign-info">
                        <Text strong style={{ display: "block", color: "#1e293b" }}>{camp.title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <CalendarOutlined /> {new Date(camp.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · {cfg.label || camp.platform}
                        </Text>
                      </div>
                      <Space size="large">
                        <div className="campaign-stat">
                          <Text strong className="campaign-stat-value">{a.sent || 0}</Text>
                          <Text type="secondary" className="campaign-stat-label">Sent</Text>
                        </div>
                        <div className="campaign-stat">
                          <Text strong className="campaign-stat-value" style={{ color: "#10b981" }}>{a.delivered || 0}</Text>
                          <Text type="secondary" className="campaign-stat-label">Delivered</Text>
                        </div>
                        <div className="campaign-stat">
                          <Text strong className="campaign-stat-value" style={{ color: rate > 75 ? "#10b981" : "#f59e0b" }}>{rate}%</Text>
                          <Text type="secondary" className="campaign-stat-label">Open Rate</Text>
                        </div>
                        <Tag
                          color={camp.status === "completed" || camp.status === "sent" ? "success" : camp.status === "scheduled" ? "processing" : "default"}
                          icon={<CheckCircleOutlined />}
                          className="tag-rounded"
                        >
                          {camp.status}
                        </Tag>
                      </Space>
                    </div>
                    {/* Expandable analytics */}
                    {isExpanded && <CampaignAnalytics campaign={camp} />}
                  </List.Item>
                );
              }}
            />
          )}
        </Card>
      </Col>

      <Col xs={24} xl={8}>
        {/* Custom Broadcast */}
        <Card
          bordered={false}
          className="mkt-card"
          style={{ marginBottom: 24 }}
          title={
            <Space>
              <EditOutlined style={{ color: "#3b82f6" }} />
              <span className="mkt-card-title">Custom Broadcast</span>
            </Space>
          }
        >
          <TextArea
            rows={6}
            placeholder={"Write your message...\n\nTip: Use *bold* and _italic_ for WhatsApp."}
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            className="broadcast-textarea"
          />
          <div style={{ marginBottom: 14 }}>
            <Text strong style={{ display: "block", marginBottom: 8, color: "#475569" }}>Broadcast on:</Text>
            <Select mode="multiple" value={selPlatforms} onChange={setSelPlatforms} style={{ width: "100%" }} placeholder="Select platforms">
              <Option value="whatsapp"><WhatsAppOutlined style={{ color: "#25D366", marginRight: 6 }} />WhatsApp</Option>
              <Option value="facebook"><FacebookOutlined style={{ color: "#1877F2", marginRight: 6 }} />Facebook</Option>
              <Option value="instagram"><InstagramOutlined style={{ color: "#E1306C", marginRight: 6 }} />Instagram</Option>
            </Select>
          </div>
          <Button
            block
            type="primary"
            size="large"
            icon={<SendOutlined />}
            onClick={() => selPlatforms.forEach((p) => platformSend(p, customMsg, null))}
            className="broadcast-btn"
          >
            Broadcast Now
          </Button>
        </Card>

        {/* Platform Access */}
        <Card
          bordered={false}
          className="mkt-card"
          title={
            <Space>
              <StarOutlined style={{ color: "#f59e0b" }} />
              <span className="mkt-card-title">Platform Access</span>
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            {[
              { href: "https://business.whatsapp.com/", icon: <WhatsAppOutlined />, label: "WhatsApp Business", bg: "#dcfce7", color: "#166534" },
              { href: "https://business.facebook.com/", icon: <FacebookOutlined />, label: "Meta Business Suite", bg: "#dbeafe", color: "#1e40af" },
              { href: "https://business.instagram.com/", icon: <InstagramOutlined />, label: "Instagram Business", bg: "linear-gradient(135deg,#fce7f3,#fde68a)", color: "#9d174d" },
            ].map((item) => (
              <Button
                key={item.label}
                block
                size="large"
                icon={item.icon}
                href={item.href}
                target="_blank"
                className="platform-link-btn"
                style={{ background: item.bg, color: item.color }}
              >
                {item.label}
              </Button>
            ))}
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default TemplatesTab;
