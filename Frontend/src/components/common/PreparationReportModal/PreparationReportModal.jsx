import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Modal,
  DatePicker,
  Table,
  Space,
  message,
  Typography,
  Empty,
  Grid,
  Tag,
  Row,
  Col,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  CalendarOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isBetween from "dayjs/plugin/isBetween";
import html2pdf from "html2pdf.js";
import api from "../../../services/api";

dayjs.extend(utc);
dayjs.extend(isBetween);

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const PreparationReportModal = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState([]);

  // Default to "this_month"
  const [datePreset, setDatePreset] = useState("this_month");
  const [dateRange, setDateRange] = useState([dayjs().startOf("month"), dayjs().endOf("month")]);

  const printRef = useRef();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset === "today") {
      setDateRange([dayjs().startOf("day"), dayjs().endOf("day")]);
    } else if (preset === "tomorrow") {
      const tom = dayjs().add(1, "day");
      setDateRange([tom.startOf("day"), tom.endOf("day")]);
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
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      let url = "/event-orders/preparation-report";
      if (dateRange && dateRange[0] && dateRange[1]) {
        url += `?startDate=${dateRange[0].format("YYYY-MM-DD")}&endDate=${dateRange[1].format("YYYY-MM-DD")}`;
      } else {
        url += `?startDate=2000-01-01&endDate=2099-12-31`;
      }
      const data = await api.get(url);
      setReport(data || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch preparation report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchReport();
    }
  }, [visible, dateRange]);

  const reportData = report.length > 0 ? report[0] : null;
  const totalItems = reportData?.items?.length || 0;
  const totalQuantity =
    reportData?.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0;

  const getFormattedDateLabel = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return "All Event Orders";
    if (dateRange[0].isSame(dateRange[1], "day")) {
      return dateRange[0].format("DD MMMM YYYY");
    }
    return `${dateRange[0].format("DD MMM YYYY")} - ${dateRange[1].format("DD MMM YYYY")}`;
  };

  const exportPDF = () => {
    if (!report.length || !reportData) {
      message.warning("No data to export");
      return;
    }
    const element = printRef.current;
    if (!element) return;

    const opt = {
      margin: [6, 6, 6, 6],
      filename: `prep-report-${dateRange && dateRange[0] ? dateRange[0].format("YYYY-MM-DD") : "all"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  const exportCSV = () => {
    if (!report.length || !reportData) {
      message.warning("No data to export");
      return;
    }
    const items = reportData.items || [];
    const header = ["Item Name,Quantity"];
    const rows = items.map((i) => `"${i.name}",${i.quantity}`);
    const csv = [...header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prep-report-${dateRange && dateRange[0] ? dateRange[0].format("YYYY-MM-DD") : "all"}.csv`;
    a.click();
  };

  const columns = [
    {
      title: "#",
      key: "index",
      width: 50,
      render: (_, __, idx) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {idx + 1}
        </Text>
      ),
    },
    {
      title: "Sweet / Item Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => (
        <Text strong style={{ fontSize: 14, color: "#1e293b" }}>
          {name}
        </Text>
      ),
    },
    {
      title: "Preparation Quantity",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
      width: 160,
      align: "right",
      render: (qty) => (
        <Tag
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            color: "#15803d",
            fontWeight: 700,
            fontSize: 14,
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            padding: "4px 14px",
            minWidth: 60,
            textAlign: "center",
          }}
        >
          {qty.toLocaleString("en-IN")}
        </Tag>
      ),
    },
  ];

  return (
    <>
      {/* TRIGGER BUTTON */}
      <Button
        icon={<FileTextOutlined />}
        onClick={() => setVisible(true)}
        size="large"
        style={{
          borderRadius: 10,
          height: 45,
          padding: "0 20px",
          fontWeight: 600,
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          border: "1px solid #e2e8f0",
          color: "#334155",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Prep Report
      </Button>

      {/* MODAL */}
      <Modal
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        title={null}
        width={isMobile ? "95vw" : 720}
        centered
        destroyOnClose
        styles={{
          body: { padding: isMobile ? 16 : 24, overflowX: "hidden" },
          content: { borderRadius: 20, overflow: "hidden" },
        }}
      >
        {/* Modal Header */}
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              }}
            >
              <FileTextOutlined style={{ color: "#fff", fontSize: 18 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Preparation Report
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Aggregated item requirements for event orders
              </Text>
            </div>
          </div>
        </div>

        {/* Compact Filters & Controls Row */}
        <div
          style={{
            background: "#f8fafc",
            padding: 12,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Presets Bar */}
          <div className="date-presets-scroll-container">
            <Text strong style={{ fontSize: 12, color: "#64748b", flexShrink: 0, marginRight: 2 }}>
              <CalendarOutlined /> Target:
            </Text>
            {[
              { key: "this_month", label: "This Month" },
              { key: "today", label: "Today" },
              { key: "tomorrow", label: "Tomorrow" },
              { key: "yesterday", label: "Yesterday" },
              { key: "this_week", label: "This Week" },
              { key: "last_month", label: "Last Month" },
            ].map((p) => {
              const isActive = datePreset === p.key;
              return (
                <Button
                  key={p.key}
                  size="small"
                  type={isActive ? "primary" : "default"}
                  onClick={() => handlePresetChange(p.key)}
                  style={{
                    borderRadius: 14,
                    height: 30,
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {p.label}
                </Button>
              );
            })}
          </div>

          {/* RangePicker & Action Buttons Row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                setDatePreset("custom");
                setDateRange(dates);
              }}
              style={{ height: 38, borderRadius: 10, flex: 1, minWidth: 200, maxWidth: "100%" }}
              format="DD MMM YYYY"
              placeholder={["Start date", "End date"]}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button
                type="primary"
                onClick={fetchReport}
                loading={loading}
                icon={<SearchOutlined />}
                style={{
                  height: 38,
                  borderRadius: 10,
                  fontWeight: 600,
                  padding: "0 16px",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  border: "none",
                }}
              >
                Fetch
              </Button>
              <Button
                type="primary"
                onClick={exportPDF}
                disabled={!reportData}
                icon={<DownloadOutlined />}
                style={{
                  height: 38,
                  borderRadius: 10,
                  fontWeight: 600,
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "none",
                }}
              >
                PDF
              </Button>
              <Button
                onClick={exportCSV}
                disabled={!reportData}
                style={{
                  height: 38,
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Printable Hidden PDF Template */}
        <div style={{ display: "none" }}>
          <div ref={printRef} style={{ padding: "24px", fontFamily: "Helvetica, Arial, sans-serif", color: "#1e293b", background: "#ffffff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #6366f1", paddingBottom: "12px", marginBottom: "16px" }}>
              <div>
                <h2 style={{ margin: 0, color: "#1e1b4b", fontSize: "24px", fontWeight: "800", letterSpacing: "-0.5px" }}>BHARATI SWEETS</h2>
                <p style={{ margin: "2px 0 0 0", color: "#6366f1", fontSize: "13px", fontWeight: "700" }}>EVENT PREPARATION REPORT</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", display: "block" }}>Target Period</span>
                <strong style={{ fontSize: "16px", color: "#0f172a" }}>{getFormattedDateLabel()}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "20px", background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div><span style={{ color: "#64748b", fontSize: "12px" }}>Total Orders: </span><strong style={{ fontSize: "14px", color: "#3b82f6" }}>{reportData?.totalOrders || reportData?.packets || 0}</strong></div>
              <div><span style={{ color: "#64748b", fontSize: "12px" }}>Total Packets: </span><strong style={{ fontSize: "14px", color: "#4f46e5" }}>{reportData?.packets || 0}</strong></div>
              <div><span style={{ color: "#64748b", fontSize: "12px" }}>Unique Items: </span><strong style={{ fontSize: "14px", color: "#059669" }}>{totalItems}</strong></div>
              <div><span style={{ color: "#64748b", fontSize: "12px" }}>Total Qty: </span><strong style={{ fontSize: "14px", color: "#d97706" }}>{totalQuantity}</strong></div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "24px" }}>
              <thead>
                <tr style={{ background: "#4f46e5", color: "#ffffff" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", width: "50px" }}>#</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Sweet / Item Name</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", width: "160px" }}>Preparation Quantity</th>
                </tr>
              </thead>
              <tbody>
                {(reportData?.items || []).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{idx + 1}</td>
                    <td style={{ padding: "10px 12px", fontWeight: "bold", color: "#1e293b" }}>{item.name}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "bold", color: "#059669", fontSize: "14px" }}>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#e0e7ff", fontWeight: "bold" }}>
                  <td colSpan={2} style={{ padding: "12px", color: "#3730a3", fontSize: "14px" }}>TOTAL UNITS TO PREPARE</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#3730a3", fontSize: "16px" }}>{totalQuantity}</td>
                </tr>
              </tfoot>
            </table>

            <div style={{ paddingTop: "12px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
              <span>Report Generated: {dayjs().format("DD MMM YYYY, hh:mm A")}</span>
              <span>Bharati Sweets ERP System</span>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {reportData && totalItems > 0 ? (
          <>
            {/* Stats Row */}
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                    borderRadius: 12,
                    padding: "10px 12px",
                    textAlign: "center",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                    Total Orders
                  </Text>
                  <Text strong style={{ fontSize: 16, color: "#1e40af" }}>
                    {reportData.totalOrders || reportData.packets || 1}
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                    borderRadius: 12,
                    padding: "10px 12px",
                    textAlign: "center",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                    Unique Sweets/Items
                  </Text>
                  <Text strong style={{ fontSize: 16, color: "#15803d" }}>
                    {totalItems}
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                    borderRadius: 12,
                    padding: "10px 12px",
                    textAlign: "center",
                    border: "1px solid #e9d5ff",
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                    Total Prep Quantity
                  </Text>
                  <Text strong style={{ fontSize: 16, color: "#7c3aed" }}>
                    {totalQuantity.toLocaleString("en-IN")}
                  </Text>
                </div>
              </Col>
            </Row>

            {/* Items Table */}
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #f1f5f9" }}>
              <Table
                columns={columns}
                dataSource={reportData.items}
                rowKey="name"
                loading={loading}
                pagination={
                  reportData.items?.length > 10
                    ? {
                        pageSize: 10,
                        size: "small",
                        showTotal: (total) => (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {total} items total
                          </Text>
                        ),
                      }
                    : false
                }
                size="small"
                style={{ fontSize: 13 }}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: "#f8fafc" }}>
                      <Table.Summary.Cell index={0} />
                      <Table.Summary.Cell index={1}>
                        <Text strong style={{ fontSize: 13, color: "#1e293b" }}>
                          Total Preparation Quantity
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text strong style={{ fontSize: 15, color: "#16a34a" }}>
                          {totalQuantity.toLocaleString("en-IN")}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </div>
          </>
        ) : (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text strong style={{ fontSize: 14, color: "#475569", display: "block", marginBottom: 4 }}>
                    No preparation requirements found for {getFormattedDateLabel()}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Try selecting a different date range or select "This Month" to view monthly preparation report.
                  </Text>
                </div>
              }
            >
              <Button
                type="primary"
                onClick={() => handlePresetChange("this_month")}
                style={{ borderRadius: 10, marginTop: 12 }}
              >
                View This Month Report
              </Button>
            </Empty>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PreparationReportModal;
