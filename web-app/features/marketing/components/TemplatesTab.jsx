import React, { useState, useEffect } from "react";
import {
  Card, Row, Col, Typography, Button, Space, Input, Tag,
  Select, List, Avatar, Tooltip, message, Divider, Empty, Spin
} from "antd";
import {
  WhatsAppOutlined, FacebookOutlined, InstagramOutlined,
  SendOutlined, CopyOutlined, CheckCircleOutlined,
  EditOutlined, StarOutlined, CalendarOutlined
} from "@ant-design/icons";
import { PLATFORM_CONFIG } from "./config";
import { platformSend, copyToClipboard } from "./helpers";
import "./MarketingPage.css";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PLATFORM_ICONS = {
  whatsapp: <WhatsAppOutlined />,
  facebook: <FacebookOutlined />,
  instagram: <InstagramOutlined />,
};

const TemplatesTab = () => {
  const [filter, setFilter] = useState("All");
  const [customMsg, setCustomMsg] = useState("");
  const [selPlatforms, setSelPlatforms] = useState(["whatsapp"]);
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  const categories = ["All", "Festival", "Event", "Promotion", "Seasonal"];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/marketing/templates").then((r) => r.json()).catch(() => []),
      fetch("/api/marketing/campaigns").then((r) => r.json()).catch(() => []),
    ]).then(([tData, cData]) => {
      setTemplates(tData || []);
      setCampaigns(cData || []);
    }).finally(() => setLoading(false));
  }, []);

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
          variant="borderless"
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
          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}><Spin /></div>
          ) : filtered.length === 0 ? (
            <Empty description="No templates found" />
          ) : (
            <Row gutter={[20, 20]}>
              {filtered.map((t) => (
                <Col xs={24} md={12} key={t._id || t.id}>
                  <Card variant="borderless" hoverable className="template-card" bodyStyle={{ padding: 22 }}>
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
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card>
      </Col>

      <Col xs={24} xl={8}>
        <Card
          variant="borderless"
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
      </Col>
    </Row>
  );
};

export default TemplatesTab;
