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
import api from "../../../services/api";
import { PLATFORM_CONFIG, SEGMENT_CONFIG, MAX_POPUP_TABS } from "../config";
import { platformSend, nameInitials, avatarColor, copyToClipboard } from "../helpers";
import "../MarketingPage.css";

const { Text, Paragraph } = Typography;

const CustomerListTab = ({ onCampaignSent }) => {
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

    // Save campaign to backend so stats and history stay accurate
    try {
      await api.post("/marketing/campaigns", {
        title: activeTemplate
          ? (templates.find((t) => (t._id || t.id) === activeTemplate)?.title || "WhatsApp Broadcast")
          : `WhatsApp Broadcast (${targets.length} customers)`,
        platform: "whatsapp",
        templateId: activeTemplate || null,
        message: msg,
        recipients: targets.map((t) => ({ phone: t.phone, customerName: t.customerName })),
        scheduledAt: scheduleDate ? scheduleDate.toISOString() : null,
        status: scheduleDate ? "scheduled" : "sent",
      });
      if (onCampaignSent) onCampaignSent();
    } catch (err) {
      console.error("Failed to record campaign history:", err);
    }

    if (scheduleDate) {
      message.success(
        `Campaign scheduled for ${targets.length} customer(s) on ${scheduleDate.format("DD MMM YYYY, hh:mm A")}!`
      );
      setBulkMsg("");
      setSelected([]);
      setScheduleDate(null);
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
            <div className="customer-header" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <Space>
                <TeamOutlined style={{ color: "#3b82f6" }} />
                <span className="mkt-card-title">Customer Contacts</span>
                <Tag className="tag-rounded" style={{ fontWeight: 600 }}>
                  {filtered.length} contacts
                </Tag>
              </Space>
              <Space style={{ flexWrap: "wrap" }}>
                {selected.length > 0 && (
                  <>
                    <Tag color="blue" className="tag-rounded" style={{ fontWeight: 600 }}>
                      {selected.length} selected
                    </Tag>
                    {/* Call first selected customer */}
                    {selected[0] && (
                      <Button
                        size="small"
                        icon={<PhoneOutlined />}
                        href={`tel:${selected[0]}`}
                        style={{ borderRadius: 8, borderColor: "#38bdf8", color: "#0284c7", fontWeight: 600 }}
                      >
                        Call First
                      </Button>
                    )}
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
          extra={null}
        >
          {/* Search moved into body for mobile overflow handling */}
          <div style={{ marginBottom: 20 }}>
            <Input
              placeholder="Search name or phone…"
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", borderRadius: 10, height: 40 }}
              allowClear
            />
          </div>
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
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <Text strong className="customer-name">
                            {customer.customerName}
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
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                          <a
                            href={customer.phone ? `tel:${customer.phone}` : "#"}
                            className="customer-phone-link"
                            onClick={(e) => e.stopPropagation()}
                            title={`Click to call ${customer.customerName}`}
                          >
                            <PhoneOutlined style={{ marginRight: 4, color: "#0284c7" }} />
                            {customer.phone || "No phone"}
                          </a>
                          {customer.orderCount > 0 && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              · {customer.orderCount} order{customer.orderCount > 1 ? "s" : ""}
                              {customer.totalSpent ? ` (₹${Number(customer.totalSpent).toLocaleString("en-IN")})` : ""}
                            </Text>
                          )}
                        </div>
                      </div>
                      <Space onClick={(e) => e.stopPropagation()} size="small">
                        {/* Call button */}
                        <Tooltip title={`Call ${customer.customerName} (${customer.phone || "No phone"})`}>
                          <Button
                            shape="circle"
                            icon={<PhoneOutlined />}
                            className="call-btn"
                            href={customer.phone ? `tel:${customer.phone}` : undefined}
                            disabled={!customer.phone}
                          />
                        </Tooltip>
                        {/* WhatsApp button */}
                        <Tooltip title={`WhatsApp ${customer.customerName}`}>
                          <Button
                            shape="circle"
                            icon={<WhatsAppOutlined />}
                            className="whatsapp-btn"
                            disabled={!customer.phone}
                            onClick={() => {
                              platformSend(
                                "whatsapp",
                                `Namaste ${customer.customerName}! 🙏\n\nThank you for choosing *Bharati Sweets*. We'd love to have you back! 🍬`,
                                customer.phone
                              );
                            }}
                          />
                        </Tooltip>
                      </Space>
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
