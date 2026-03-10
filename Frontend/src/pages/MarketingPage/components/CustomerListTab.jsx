import React, { useState, useMemo } from "react";
import {
  Card, Row, Col, Typography, Button, Space, Input, Tag,
  List, Avatar, Tooltip, message, Checkbox, Divider,
  Empty, Spin, DatePicker, Alert
} from "antd";
import {
  WhatsAppOutlined, SendOutlined, TeamOutlined,
  SearchOutlined, PhoneOutlined, CheckSquareOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CopyOutlined
} from "@ant-design/icons";
import useFetch from "../../../hooks/useFetch";
import { PLATFORM_CONFIG, SEGMENT_CONFIG, MAX_POPUP_TABS } from "../config";
import { platformSend, nameInitials, avatarColor, copyToClipboard } from "../helpers";
import "../MarketingPage.css";

const { Text, Paragraph } = Typography;

const CustomerListTab = () => {
  const { data: rawCustomers, loading } = useFetch("/customers");
  const customers = rawCustomers ?? [];
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [bulkMsg, setBulkMsg] = useState("");
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [segmentFilter, setSegmentFilter] = useState("All");
  const [scheduleDate, setScheduleDate] = useState(null);

  // Templates for quick-fill (loaded from API ideally, kept minimal locally as fallback)
  const { data: rawTemplates } = useFetch("/marketing/templates", { silent: true });
  const templates = rawTemplates ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (customers || []).filter((c) => {
      const matchesSearch =
        c.customerName?.toLowerCase().includes(q) || c.phone?.includes(q);
      const matchesSegment =
        segmentFilter === "All" || c.segment === segmentFilter;
      return matchesSearch && matchesSegment;
    });
  }, [customers, search, segmentFilter]);

  // Segment counts
  const segmentCounts = useMemo(() => {
    const counts = { All: (customers || []).length };
    (customers || []).forEach((c) => {
      counts[c.segment] = (counts[c.segment] || 0) + 1;
    });
    return counts;
  }, [customers]);

  const toggleSelect = (phone) =>
    setSelected((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );

  const selectAll = () => setSelected(filtered.map((c) => c.phone));
  const clearAll = () => setSelected([]);

  const sendBulkWhatsApp = async (templateContent) => {
    const msg = templateContent || bulkMsg;
    if (!msg.trim()) {
      message.warning("Please type a message first.");
      return;
    }
    const targets = customers.filter((c) => selected.includes(c.phone));
    if (!targets.length) {
      message.warning("Select at least one customer.");
      return;
    }

    // If more than MAX_POPUP_TABS, copy message and show warning
    if (targets.length > MAX_POPUP_TABS) {
      const copied = await copyToClipboard(msg);
      if (copied) {
        message.info({
          content: `Message copied! Opening WhatsApp for first ${MAX_POPUP_TABS} customers. For the rest, paste the message manually.`,
          duration: 6,
        });
      }
      // Only open first MAX_POPUP_TABS tabs
      targets.slice(0, MAX_POPUP_TABS).forEach((c, i) => {
        setTimeout(
          () => window.open(PLATFORM_CONFIG.whatsapp.getUrl(msg, c.phone), "_blank"),
          i * 600
        );
      });
    } else {
      targets.forEach((c, i) => {
        setTimeout(
          () => window.open(PLATFORM_CONFIG.whatsapp.getUrl(msg, c.phone), "_blank"),
          i * 600
        );
      });
      message.success(`Opening WhatsApp for ${targets.length} customer(s)…`);
    }
    setBulkMsg("");
    setSelected([]);
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={14}>
        <Card
          bordered={false}
          className="mkt-card"
          title={
            <div className="customer-header">
              <Space>
                <TeamOutlined style={{ color: "#3b82f6" }} />
                <span className="mkt-card-title">Customer Contacts</span>
                <Tag className="tag-rounded" style={{ fontWeight: 600 }}>
                  {filtered.length} contacts
                </Tag>
              </Space>
              <Space>
                {selected.length > 0 && (
                  <>
                    <Tag color="blue" className="tag-rounded" style={{ fontWeight: 600 }}>
                      {selected.length} selected
                    </Tag>
                    <Button size="small" onClick={clearAll} style={{ borderRadius: 8 }}>
                      Clear
                    </Button>
                  </>
                )}
                <Button
                  size="small"
                  icon={<CheckSquareOutlined />}
                  onClick={selectAll}
                  style={{ borderRadius: 8 }}
                >
                  Select All
                </Button>
              </Space>
            </div>
          }
          extra={
            <Input
              placeholder="Search name or phone…"
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200, borderRadius: 10 }}
              allowClear
            />
          }
        >
          {/* Segment Filters */}
          <div className="segment-filters">
            {Object.entries(SEGMENT_CONFIG).map(([key, cfg]) => (
              <Button
                key={key}
                className="segment-filter-btn"
                type={segmentFilter === key ? "primary" : "default"}
                onClick={() => setSegmentFilter(key)}
                style={
                  segmentFilter === key
                    ? { background: cfg.color, borderColor: cfg.color }
                    : {}
                }
              >
                {cfg.label}
                {segmentCounts[key] ? ` (${segmentCounts[key]})` : " (0)"}
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Empty description="No customers found" style={{ padding: 40 }} />
          ) : (
            <List
              dataSource={filtered}
              pagination={{ pageSize: 8, size: "small" }}
              renderItem={(customer) => {
                const isSelected = selected.includes(customer.phone);
                return (
                  <List.Item
                    onClick={() => toggleSelect(customer.phone)}
                    className={`customer-item ${isSelected ? "customer-item-selected" : "customer-item-unselected"}`}
                  >
                    <div className="customer-item-row">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelect(customer.phone)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Avatar
                        style={{
                          background: avatarColor(customer.customerName),
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {nameInitials(customer.customerName)}
                      </Avatar>
                      <div className="customer-info">
                        <Text strong className="customer-name">
                          {customer.customerName}
                        </Text>
                        <Text type="secondary" className="customer-phone">
                          <PhoneOutlined style={{ marginRight: 4 }} />
                          {customer.phone}
                          {customer.orderCount > 0 && (
                            <span className="customer-orders">
                              · {customer.orderCount} order
                              {customer.orderCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </Text>
                        {/* Customer Tags */}
                        {customer.tags?.map((tag) => (
                          <Tag
                            key={tag}
                            className="customer-segment-tag"
                            color={
                              tag === "VIP" ? "gold" :
                              tag === "Frequent Buyer" ? "blue" :
                              tag === "Wholesale" ? "purple" :
                              tag === "Inactive" ? "red" : "default"
                            }
                          >
                            {tag}
                          </Tag>
                        ))}
                      </div>
                      <Tooltip title={`WhatsApp ${customer.customerName}`}>
                        <Button
                          shape="circle"
                          icon={<WhatsAppOutlined />}
                          className="whatsapp-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            platformSend(
                              "whatsapp",
                              `Namaste ${customer.customerName}! 🙏\n\nThank you for choosing *Bharati Sweets*. We'd love to have you back! 🍬`,
                              customer.phone
                            );
                          }}
                        />
                      </Tooltip>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        {/* Bulk WhatsApp */}
        <Card
          bordered={false}
          className="bulk-card"
          title={
            <Space>
              <SendOutlined style={{ color: "#25D366" }} />
              <span className="mkt-card-title">Bulk WhatsApp</span>
              {selected.length > 0 && (
                <Tag color="green" className="tag-rounded">
                  {selected.length} selected
                </Tag>
              )}
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
            {selected.length === 0
              ? "Select customers on the left, then write your message."
              : `Ready to message ${selected.length} customer${selected.length > 1 ? "s" : ""}.`}
          </Paragraph>

          {/* Popup blocker warning */}
          {selected.length > MAX_POPUP_TABS && (
            <Alert
              type="warning"
              showIcon
              className="popup-warning"
              message={`${selected.length} customers selected`}
              description={`Your browser may block popups beyond ${MAX_POPUP_TABS} tabs. We'll open the first ${MAX_POPUP_TABS} and copy the message so you can paste for the rest.`}
            />
          )}

          <Input.TextArea
            rows={5}
            placeholder={"Write your WhatsApp message here...\n\nTip: Use *bold* for formatting."}
            value={bulkMsg}
            onChange={(e) => setBulkMsg(e.target.value)}
            className="bulk-textarea"
          />

          {/* Schedule option */}
          <div className="schedule-section" style={{ marginBottom: 14 }}>
            <Text className="schedule-label">
              <ClockCircleOutlined style={{ marginRight: 6 }} />
              Schedule for later (optional)
            </Text>
            <DatePicker
              showTime
              value={scheduleDate}
              onChange={setScheduleDate}
              placeholder="Send now (or pick date/time)"
              style={{ width: "100%", borderRadius: 12 }}
              format="DD MMM YYYY  hh:mm A"
            />
          </div>

          <Button
            block
            type="primary"
            size="large"
            icon={scheduleDate ? <ClockCircleOutlined /> : <WhatsAppOutlined />}
            disabled={selected.length === 0 || !bulkMsg.trim()}
            className="bulk-send-btn"
            onClick={() => sendBulkWhatsApp(bulkMsg)}
          >
            {scheduleDate
              ? `Schedule for ${selected.length || 0} Customer${selected.length !== 1 ? "s" : ""}`
              : `Send to ${selected.length || 0} Customer${selected.length !== 1 ? "s" : ""}`}
          </Button>

          <Divider style={{ margin: "16px 0 12px" }}>or use a template</Divider>

          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            {(templates.length > 0 ? templates.slice(0, 3) : []).map((t) => (
              <div
                key={t._id || t.id}
                onClick={() => {
                  setActiveTemplate(t._id || t.id);
                  setBulkMsg(t.content);
                }}
                className={`template-mini ${activeTemplate === (t._id || t.id) ? "template-mini-active" : "template-mini-inactive"}`}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text strong style={{ fontSize: 13, color: "#1e293b" }}>
                    {t.title}
                  </Text>
                  <Tag className="tag-sm">{t.category}</Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {t.content.slice(0, 60)}…
                </Text>
              </div>
            ))}
          </Space>
        </Card>

        {/* Tips */}
        <Card bordered={false} className="tips-card" bodyStyle={{ padding: 20 }}>
          <Text strong style={{ display: "block", marginBottom: 12, color: "#1e293b", fontSize: 16 }}>
            💡 Tips
          </Text>
          <Space direction="vertical" size={8}>
            {[
              "Best time to send: 7–9 PM",
              "Personalise with customer name",
              "Use *bold* for WhatsApp emphasis",
              "Avoid sending more than once a week",
              "Keep message under 500 characters",
            ].map((tip, i) => (
              <div key={i} className="tip-item">
                <CheckCircleOutlined className="tip-icon" />
                <Text className="tip-text">{tip}</Text>
              </div>
            ))}
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default CustomerListTab;
