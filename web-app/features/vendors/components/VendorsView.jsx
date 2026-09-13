"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, Input, Button, Select, message, Typography, DatePicker, Row, Col, Statistic, Tag, Modal, Grid } from "antd";
import { SearchOutlined, PlusOutlined, CalendarOutlined, DollarOutlined, HistoryOutlined, UserOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import VendorTable from "./VendorTable";
import VendorModal from "./VendorModal";

dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const VENDOR_TYPES = [
  { value: "milk", label: "Milk Supplier" },
  { value: "chenna", label: "Chenna Supplier" },
  { value: "raw_material", label: "Raw Material Supplier" },
  { value: "packaging", label: "Packaging Supplier" },
  { value: "other", label: "Other Supplier" },
];

export default function VendorsView() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  // Mobile custom date modal state
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendors");
      const data = await res.json();
      setVendors(data || []);
    } catch (err) {
      message.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handlePresetChange = (preset) => {
    if (preset === "custom" && isMobile) {
      setTempStartDate(dateRange?.[0] || dayjs().startOf("month"));
      setTempEndDate(dateRange?.[1] || dayjs().endOf("month"));
      setIsDateModalOpen(true);
      return;
    }

    setDatePreset(preset);
    if (preset === "today") {
      setDateRange([dayjs().startOf("day"), dayjs().endOf("day")]);
    } else if (preset === "yesterday") {
      const y = dayjs().subtract(1, "day");
      setDateRange([y.startOf("day"), y.endOf("day")]);
    } else if (preset === "this_week") {
      setDateRange([dayjs().startOf("week"), dayjs().endOf("week")]);
    } else if (preset === "this_month") {
      setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
    } else if (preset === "last_month") {
      const m = dayjs().subtract(1, "month");
      setDateRange([m.startOf("month"), m.endOf("month")]);
    } else if (preset === "all") {
      setDateRange(null);
    }
  };

  const handleApplyCustomModal = () => {
    if (tempStartDate && tempEndDate) {
      setDatePreset("custom");
      setDateRange([tempStartDate.startOf("day"), tempEndDate.endOf("day")]);
    } else {
      setDatePreset("all");
      setDateRange(null);
    }
    setIsDateModalOpen(false);
  };
      setDateRange([m.startOf("month"), m.endOf("month")]);
    } else if (preset === "all") {
      setDateRange(null);
    }
  };

  const isTxInDateRange = (txDate) => {
    if (!dateRange || dateRange.length !== 2 || !dateRange[0] || !dateRange[1]) return true;
    const d = dayjs(txDate);
    return d.isBetween(dateRange[0].startOf("day"), dateRange[1].endOf("day"), null, "[]");
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        !searchText ||
        v.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        v.contact?.includes(searchText);
      const matchesType = typeFilter === "all" || v.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [vendors, searchText, typeFilter]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!vendors) return { periodTotalPaid: 0, periodTxCount: 0, activeVendorsCount: 0, allTimeTotalPaid: 0 };
    let periodTotalPaid = 0;
    let periodTxCount = 0;
    let activeVendorsSet = new Set();
    let allTimeTotalPaid = 0;

    vendors.forEach((vendor) => {
      (vendor.transactions || []).forEach((t) => {
        const amt = Number(t.amount) || 0;
        allTimeTotalPaid += amt;
        if (isTxInDateRange(t.date)) {
          periodTotalPaid += amt;
          periodTxCount += 1;
          activeVendorsSet.add(vendor._id);
        }
      });
    });

    return {
      periodTotalPaid,
      periodTxCount,
      activeVendorsCount: activeVendorsSet.size,
      allTimeTotalPaid,
    };
  }, [vendors, dateRange]);

  const handleSave = async (values) => {
    try {
      if (editingVendor) {
        await fetch(`/api/vendors/${editingVendor._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        message.success("Vendor updated successfully");
      } else {
        await fetch("/api/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        message.success("Vendor added successfully");
      }
      setIsModalVisible(false);
      setEditingVendor(null);
      fetchVendors();
    } catch (err) {
      message.error("Failed to save vendor");
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/vendors/${id}`, { method: "DELETE" });
      message.success("Vendor deleted successfully");
      fetchVendors();
    } catch (err) {
      message.error("Failed to delete vendor");
    }
  };

  const openAddEdit = (vendor = null) => {
    setEditingVendor(vendor);
    setIsModalVisible(true);
  };

  const renderVendorTransactions = (vendor) => {
    const txs = (vendor.transactions || []).filter((t) => isTxInDateRange(t.date));
    return (
      <Card title={`Transaction History - ${vendor.name}`} size="small" style={{ borderRadius: 12 }}>
        {txs.length === 0 ? (
          <Text type="secondary">No transactions in selected date range.</Text>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {txs.map((t, idx) => (
              <div key={t._id || idx} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
                <div>
                  <Text strong>{new Date(t.date).toLocaleDateString("en-IN")}</Text>
                  <Tag color="blue" style={{ marginLeft: 8 }}>{t.paymentMethod || "cash"}</Tag>
                </div>
                <Text strong style={{ color: "#10b981" }}>₹{(Number(t.amount) || 0).toLocaleString("en-IN")}</Text>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: "0 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Vendors & Suppliers</Title>
          <Text type="secondary">Manage milk suppliers, raw material vendors, and filter transaction records by date range.</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => openAddEdit()}
          style={{ borderRadius: 10, height: 42, padding: "0 24px" }}
        >
          Add New Vendor
        </Button>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ borderRadius: 16, background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#fff" }}>
            <Statistic
              title={<span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 500 }}><DollarOutlined /> Total Paid ({datePreset === "all" ? "All Time" : "Selected Period"})</span>}
              value={summaryMetrics.periodTotalPaid}
              precision={0}
              prefix="₹"
              valueStyle={{ color: "#10b981", fontWeight: 700, fontSize: 24 }}
            />
            {datePreset !== "all" && (
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                All Time: ₹{summaryMetrics.allTimeTotalPaid.toLocaleString("en-IN")}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={12} sm={8}>
          <Card variant="borderless" style={{ borderRadius: 16, background: "#ffffff", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <Statistic
              title={<span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}><HistoryOutlined /> Transactions</span>}
              value={summaryMetrics.periodTxCount}
              valueStyle={{ color: "#3b82f6", fontWeight: 700, fontSize: 24 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8}>
          <Card variant="borderless" style={{ borderRadius: 16, background: "#ffffff", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <Statistic
              title={<span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}><UserOutlined /> Active Vendors</span>}
              value={summaryMetrics.activeVendorsCount}
              suffix={`/ ${vendors?.length || 0}`}
              valueStyle={{ color: "#8b5cf6", fontWeight: 700, fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" style={{ borderRadius: 20 }}>
        {/* Filters Row */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          {/* Row 1: Search & Type */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Input
              placeholder="Search vendors..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              style={{ flex: 1, minWidth: 220, height: 42, borderRadius: 12 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 180, height: 42 }}>
              <Option value="all">All Vendor Types</Option>
              {VENDOR_TYPES.map((t) => (
                <Option key={t.value} value={t.value}>{t.label}</Option>
              ))}
            </Select>
          </div>

          {/* Row 2: Date Filter Presets & RangePicker */}
          <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 14, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div className="date-presets-scroll-container">
                <Text strong style={{ fontSize: 13, marginRight: 2, color: "#475569", flexShrink: 0 }}>
                  <CalendarOutlined /> Date Filter:
                </Text>
                {[
                  { key: "all", label: "All Time" },
                  { key: "today", label: "Today" },
                  { key: "yesterday", label: "Yesterday" },
                  { key: "this_week", label: "This Week" },
                  { key: "this_month", label: "This Month" },
                  { key: "last_month", label: "Last Month" },
                ].map((preset) => {
                  const isActive = datePreset === preset.key;
                  return (
                    <Button
                      key={preset.key}
                      size="small"
                      type={isActive ? "primary" : "default"}
                      onClick={() => handlePresetChange(preset.key)}
                      style={{
                        borderRadius: 16,
                        height: 32,
                        fontSize: 12,
                        fontWeight: isActive ? 600 : 500,
                        boxShadow: isActive ? "0 2px 6px rgba(99, 102, 241, 0.25)" : "none",
                      }}
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>

              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  setDatePreset("custom");
                  setDateRange(dates);
                }}
                style={{ height: 38, borderRadius: 10, flex: 1, minWidth: 220, maxWidth: "100%" }}
                format="DD MMM YYYY"
                placeholder={["Start date", "End date"]}
              />
            </div>

            {dateRange && dateRange[0] && dateRange[1] && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Tag color="purple" style={{ borderRadius: 10, padding: "2px 10px", fontSize: 12, margin: 0 }}>
                  Range: <strong>{dateRange[0].format("DD MMM YYYY")} - {dateRange[1].format("DD MMM YYYY")}</strong>
                </Tag>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => handlePresetChange("all")}
                  style={{ fontSize: 11, color: "#64748b", height: 22, padding: "0 6px" }}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        <VendorTable
          data={filteredVendors}
          loading={loading}
          vendorTypes={VENDOR_TYPES}
          onEdit={openAddEdit}
          onDelete={handleDelete}
          dateRange={dateRange}
          expandedRowRender={renderVendorTransactions}
        />
      </Card>

      <VendorModal
        visible={isModalVisible}
        item={editingVendor}
        vendorTypes={VENDOR_TYPES}
        loading={loading}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSave}
      />
    </div>
  );
}
