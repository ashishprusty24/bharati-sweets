import React, { useRef } from "react";
import { Modal, Button, Typography, Row, Col, Table, Divider, Tag, Grid } from "antd";
import { PrinterOutlined, DownloadOutlined, WhatsAppOutlined } from "@ant-design/icons";
import html2pdf from "html2pdf.js";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ChefSlipModal = ({ visible, order, onCancel }) => {
  const slipRef = useRef();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (!order) return null;

  const handleShareWhatsApp = () => {
    const itemsList = order.items
      .map((item) => `• *${item.name}*: ${item.quantity}`)
      .join("\n");

    const message = `*KITCHEN ORDER TICKET (KOT)*\n` +
      `*No:* KOT-${order._id.slice(-6).toUpperCase()}\n\n` +
      `*Event:* ${order.purpose}\n` +
      `*Date:* ${dayjs(order.deliveryDate).format("MMM D, YYYY")}\n` +
      `*Delivery Time:* ${order.deliveryTime}\n\n` +
      `*ITEMS:*\n${itemsList}\n\n` +
      `*Total Packets:* x${order.packets || 1}\n` +
      (order.notes ? `\n*SPECIAL INSTRUCTIONS:*\n${order.notes}` : "");

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleDownloadPDF = () => {
    const element = slipRef.current;
    const opt = {
      margin: isMobile ? 5 : 10,
      filename: `KOT_${order._id.slice(-6)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: isMobile ? 1.5 : 2, useCORS: true, allowTaint: true, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a5", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <Modal
      title="Kitchen Order Ticket"
      open={visible}
      onCancel={onCancel}
      width={isMobile ? "95vw" : 600}
      centered
      className="responsive-modal"
      styles={{ body: { padding: isMobile ? 8 : 24, maxHeight: "70vh", overflowY: "auto" } }}
      footer={
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onCancel}>Close</Button>
          <Button 
            icon={<WhatsAppOutlined />} 
            style={{ backgroundColor: "#25D366", color: "white", borderColor: "#25D366" }}
            onClick={handleShareWhatsApp}
          >
            {isMobile ? "WhatsApp" : "Share on WhatsApp"}
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>
            {isMobile ? "PDF" : "Download PDF"}
          </Button>
        </div>
      }
    >
      <div ref={slipRef} style={{ padding: isMobile ? "16px" : "30px", background: "#fff", color: "#333", fontSize: isMobile ? "14px" : "16px", border: "1px dashed #ccc" }}>
        {/* Header */}
        <div style={{ textAlign: "center", borderBottom: "2px dashed #333", paddingBottom: 10, marginBottom: 20 }}>
          <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>KITCHEN ORDER TICKET</Title>
          <Text strong>No: KOT-{order._id.slice(-6).toUpperCase()}</Text>
        </div>

        {/* Info */}
        <div style={{ marginBottom: 20, background: "#f8fafc", padding: 12, borderRadius: 8 }}>
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
              <Text strong>Event:</Text> {order.purpose}
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>Date:</Text> {dayjs(order.deliveryDate).format("MMM D, YYYY")}
            </Col>
            <Col span={24}>
              <Text strong>Delivery Time:</Text> <Text mark>{order.deliveryTime}</Text>
            </Col>
          </Row>
        </div>

        {/* Items Table */}
        <Table
          dataSource={order.items}
          pagination={false}
          rowKey="_id"
          size="middle"
          bordered
          columns={[
            { title: "Item", dataIndex: "name", key: "name", render: (text) => <Text strong>{text}</Text> },
            { title: "Qty/Pkt", dataIndex: "quantity", key: "quantity", align: "center", width: isMobile ? 70 : 120 },
          ]}
        />

        <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text strong style={{ fontSize: isMobile ? 15 : 18 }}>Total Packets:</Text>
          <Tag color="volcano" style={{ fontSize: isMobile ? 16 : 20, padding: "4px 16px", borderRadius: 8 }}>
            x {order.packets || 1}
          </Tag>
        </div>
        
        {order.notes && (
          <div style={{ marginTop: 20, padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fef2f2" }}>
            <Text strong style={{ color: "#ef4444" }}>SPECIAL INSTRUCTIONS:</Text><br />
            <Text>{order.notes}</Text>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ChefSlipModal;
