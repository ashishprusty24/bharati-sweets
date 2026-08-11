import React, { useState, useRef } from "react";
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
  Statistic,
  Row,
  Col,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  CalendarOutlined,
  SearchOutlined,
  InboxOutlined,
  GiftOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import html2pdf from "html2pdf.js";
import api from "../../../services/api";

dayjs.extend(utc);

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const PreparationReportModal = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const printRef = useRef();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await api.get(
        `/event-orders/preparation-report?date=${selectedDate.format("YYYY-MM-DD")}`
      );
      setReport(data || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const reportData = report.length > 0 ? report[0] : null;
  const totalItems = reportData?.items?.length || 0;
  const totalQuantity =
    reportData?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  const exportPDF = () => {
    if (!report.length || !reportData) {
      message.warning("No data to export");
      return;
    }
    const element = printRef.current;
    if (!element) return;

    const opt = {
      margin: [6, 6, 6, 6],
      filename: `preparation-report-${selectedDate.format("YYYY-MM-DD")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  const exportCSV = () => {
    if (!report.length) {
      message.warning("No data to export");
      return;
    }
    const items = report[0].items || [];
    const header = ["Name,Quantity"];
    const rows = items.map((i) => `${i.name},${i.quantity}`);
    const csv = [...header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `preparation-report-${selectedDate.format("YYYY-MM-DD")}.csv`;
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
      title: "Item Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => (
        <Text strong style={{ fontSize: 13 }}>
          {name}
        </Text>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
      width: 120,
      align: "right",
      render: (qty) => (
        <Tag
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            color: "#15803d",
            fontWeight: 700,
            fontSize: 13,
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            padding: "2px 12px",
            minWidth: 50,
            textAlign: "center",
          }}
        >
          {qty}
        </Tag>
      ),
    },
  ];

  return (
    <>
      {/* ─── TRIGGER BUTTON ─── */}
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

      {/* ─── MODAL ─── */}
      <Modal
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        title={null}
        width={isMobile ? "95vw" : 680}
        centered
        destroyOnClose
        className="responsive-modal"
        styles={{
          body: { padding: isMobile ? 16 : 24 },
          content: { borderRadius: 20, overflow: "hidden" },
        }}
      >
        {/* Modal Header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileTextOutlined style={{ color: "#fff", fontSize: 16 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontSize: 18 }}>
                Preparation Report
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Daily item preparation summary
              </Text>
            </div>
          </div>
        </div>

        {/* Date Picker + Actions */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            format="DD MMM YYYY"
            style={{
              flex: 1,
              minWidth: 160,
              height: 42,
              borderRadius: 10,
            }}
            suffixIcon={<CalendarOutlined style={{ color: "#6366f1" }} />}
          />
          <Button
            type="primary"
            onClick={fetchReport}
            loading={loading}
            icon={<SearchOutlined />}
            style={{
              height: 42,
              borderRadius: 10,
              fontWeight: 600,
              padding: "0 20px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              border: "none",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
            }}
          >
            {isMobile ? "" : "Fetch Report"}
          </Button>
          <Button
            type="primary"
            onClick={exportPDF}
            disabled={!report.length}
            icon={<DownloadOutlined />}
            style={{
              height: 42,
              borderRadius: 10,
              fontWeight: 700,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              border: "none",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
            }}
          >
            {isMobile ? "PDF" : "Download PDF"}
          </Button>
          <Button
            onClick={exportCSV}
            disabled={!report.length}
            style={{
              height: 42,
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            {isMobile ? "CSV" : "Export CSV"}
          </Button>
        </div>

        {/* Printable Hidden PDF Template */}
        <div style={{ display: "none" }}>
          <div ref={printRef} style={{ padding: "24px", fontFamily: "Helvetica, Arial, sans-serif", color: "#1e293b", background: "#ffffff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #6366f1", paddingBottom: "12px", marginBottom: "16px" }}>
              <div>
                <h2 style={{ margin: 0, color: "#1e1b4b", fontSize: "24px", fontWeight: "800", letterSpacing: "-0.5px" }}>BHARATI SWEETS</h2>
                <p style={{ margin: "2px 0 0 0", color: "#6366f1", fontSize: "13px", fontWeight: "700" }}>DAILY EVENT PREPARATION REPORT</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", display: "block" }}>Delivery Target Date</span>
                <strong style={{ fontSize: "16px", color: "#0f172a" }}>{selectedDate.format("DD MMMM YYYY")}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "20px", background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div><span style={{ color: "#64748b", fontSize: "12px" }}>Total Packets: </span><strong style={{ fontSize: "14px", color: "#4f46e5" }}>{reportData?.packets || 0}</strong></div>
              <div><span style={{ color: "#64748b", fontSize: "12px" }}>Unique Sweets/Items: </span><strong style={{ fontSize: "14px", color: "#059669" }}>{totalItems}</strong></div>
              <div><span style={{ color: "#64748b", fontSize: "12px" }}>Total Quantity Required: </span><strong style={{ fontSize: "14px", color: "#d97706" }}>{totalQuantity}</strong></div>
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
              <span>Bharati Sweets ERP System — Confidential</span>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {reportData ? (
          <>
            {/* Stats Row */}
            <Row gutter={12} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                    borderRadius: 12,
                    padding: isMobile ? "10px 8px" : "12px 16px",
                    textAlign: "center",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                    Delivery
                  </Text>
                  <Text strong style={{ fontSize: isMobile ? 12 : 14, color: "#1e40af" }}>
                    {dayjs(reportData.deliveryDate).utc().format("DD MMM")}
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                    borderRadius: 12,
                    padding: isMobile ? "10px 8px" : "12px 16px",
                    textAlign: "center",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                    Items
                  </Text>
                  <Text strong style={{ fontSize: isMobile ? 14 : 16, color: "#15803d" }}>
                    {totalItems}
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                    borderRadius: 12,
                    padding: isMobile ? "10px 8px" : "12px 16px",
                    textAlign: "center",
                    border: "1px solid #e9d5ff",
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                    Packets
                  </Text>
                  <Text strong style={{ fontSize: isMobile ? 14 : 16, color: "#7c3aed" }}>
                    {reportData.packets || 0}
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
                summary={() =>
                  reportData.items?.length > 0 ? (
                    <Table.Summary fixed>
                      <Table.Summary.Row
                        style={{ background: "#f8fafc" }}
                      >
                        <Table.Summary.Cell index={0} />
                        <Table.Summary.Cell index={1}>
                          <Text strong style={{ fontSize: 13 }}>
                            Total
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                          <Text
                            strong
                            style={{
                              fontSize: 14,
                              color: "#6366f1",
                            }}
                          >
                            {totalQuantity}
                          </Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  ) : null
                }
              />
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: isMobile ? "30px 16px" : "48px 24px",
              background: "#fafbfc",
              borderRadius: 16,
              border: "2px dashed #e2e8f0",
            }}
          >
            <InboxOutlined
              style={{ fontSize: 40, color: "#cbd5e1", marginBottom: 12 }}
            />
            <div>
              <Text type="secondary" style={{ fontSize: 14 }}>
                Select a date &amp; click <strong>Fetch Report</strong> to view
                preparation details
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PreparationReportModal;
