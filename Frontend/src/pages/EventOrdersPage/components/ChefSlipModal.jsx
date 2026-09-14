import React, { useRef } from "react";
import { Modal, Button, Typography, Row, Col, Table, Tag, Grid } from "antd";
import { DownloadOutlined, WhatsAppOutlined } from "@ant-design/icons";
import html2pdf from "html2pdf.js";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ChefSlipModal = ({ visible, order, inventoryItems, onCancel }) => {
  const slipRef = useRef();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (!order) return null;

  const totalPackets = Number(order.packets) || 1;

  const groupedItems = (order.items || []).reduce((acc, item) => {
    const invItem = inventoryItems?.find(
      (i) => i._id === item.itemId || i.name?.toLowerCase() === item.name?.toLowerCase()
    );
    const section = invItem?.kitchenSection || "Uncategorized";
    const currentStock = invItem ? Number(invItem.quantity) || 0 : 0;
    const unit = invItem ? invItem.unit || item.unit || "pcs" : item.unit || "pcs";
    const qtyPerPacket = Number(item.quantity) || 0;
    const totalOrderQty = qtyPerPacket * totalPackets;
    const toPrepare = Math.max(0, totalOrderQty - currentStock);

    if (!acc[section]) acc[section] = [];
    acc[section].push({
      ...item,
      currentStock,
      unit,
      qtyPerPacket,
      totalOrderQty,
      toPrepare,
    });
    return acc;
  }, {});

  const sections = Object.keys(groupedItems).filter((key) => groupedItems[key].length > 0);

  const handleShareWhatsApp = (sectionName = null) => {
    let itemsList = "";
    const sectionsToShare = sectionName ? [sectionName] : sections;

    sectionsToShare.forEach(sec => {
      itemsList += `\n*${sec}*\n`;
      groupedItems[sec].forEach(item => {
        itemsList += `• ${item.name}: ${item.qtyPerPacket}/pkt (Total Order: ${item.totalOrderQty} ${item.unit} | In Stock: ${item.currentStock} ${item.unit} | Cook: ${item.toPrepare} ${item.unit})\n`;
      });
    });

    const message = `*KITCHEN ORDER TICKET (KOT)${sectionName ? ` - ${sectionName}` : ""}*\n` +
      `*No:* KOT-${order._id.slice(-6).toUpperCase()}\n\n` +
      `*Event:* ${order.purpose}\n` +
      `*Date:* ${dayjs(order.deliveryDate).format("MMM D, YYYY")}\n` +
      `*Delivery Time:* ${order.deliveryTime}\n` +
      `*Delivery Address:* ${order.address || order.deliveryAddress || "N/A"}\n\n` +
      `*ITEMS BREAKDOWN (INVENTORY SYNCED):*\n${itemsList}\n` +
      `*Total Packets:* x${order.packets || 1}${order.packetType ? ` (${order.packetType})` : ''}\n` +
      (order.notes ? `\n*SPECIAL INSTRUCTIONS:*\n${order.notes}` : "");

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleDownloadPDF = () => {
    const element = slipRef.current;
    const opt = {
      margin: isMobile ? 4 : 6,
      filename: `KOT_${order._id.slice(-6)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <Modal
      title="Kitchen Order Ticket (Section-wise KOT)"
      open={visible}
      onCancel={onCancel}
      width={isMobile ? "95vw" : 750}
      centered
      className="responsive-modal"
      styles={{ body: { padding: isMobile ? 8 : 20, maxHeight: "75vh", overflowY: "auto", overflowX: "hidden" } }}
      footer={
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onCancel}>Close</Button>
          <Button 
            icon={<WhatsAppOutlined />} 
            style={{ backgroundColor: "#25D366", color: "white", borderColor: "#25D366" }}
            onClick={() => handleShareWhatsApp()}
          >
            {isMobile ? "WhatsApp All" : "Share All on WhatsApp"}
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>
            {isMobile ? "Download PDF" : "Download Single-Page KOT PDF"}
          </Button>
        </div>
      }
    >
      <div ref={slipRef} style={{ padding: isMobile ? "8px" : "16px", background: "#ffffff", color: "#333", fontSize: isMobile ? "13px" : "14px" }}>
        {sections.map((section, index) => (
          <React.Fragment key={section}>
            <div 
              style={{ 
                pageBreakInside: "avoid", 
                breakInside: "avoid", 
                border: "2px dashed #64748b", 
                borderRadius: 12, 
                padding: "14px 16px", 
                background: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
              }}
            >
              {/* Header */}
              <div style={{ textAlign: "center", borderBottom: "2px dashed #334155", paddingBottom: 8, marginBottom: 12, position: "relative" }}>
                <Title level={isMobile ? 5 : 4} style={{ margin: 0, textTransform: "uppercase", letterSpacing: 1, color: "#0f172a" }}>
                  KOT - {section}
                </Title>
                <Text strong style={{ fontSize: 12, color: "#64748b" }}>
                  No: KOT-{order._id.slice(-6).toUpperCase()}
                </Text>
                <Button 
                  type="text" 
                  icon={<WhatsAppOutlined />} 
                  style={{ position: "absolute", right: 0, top: 0, color: "#25D366", fontSize: "18px" }}
                  onClick={() => handleShareWhatsApp(section)}
                  title={`Share ${section} on WhatsApp`}
                />
              </div>

              {/* Info Details */}
              <div style={{ marginBottom: 12, background: "#f8fafc", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <Row gutter={[12, 6]}>
                  <Col xs={12} sm={12}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Event:</Text> <Text strong style={{ fontSize: 12 }}>{order.purpose}</Text>
                  </Col>
                  <Col xs={12} sm={12}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Date:</Text> <Text strong style={{ fontSize: 12 }}>{dayjs(order.deliveryDate).format("MMM D, YYYY")}</Text>
                  </Col>
                  <Col xs={12} sm={12}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Time:</Text> <Text mark style={{ fontSize: 12, fontWeight: 700 }}>{order.deliveryTime}</Text>
                  </Col>
                  <Col xs={12} sm={12}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Packets:</Text> <Tag color="volcano" style={{ fontWeight: 700, margin: 0 }}>x{order.packets || 1}{order.packetType ? ` (${order.packetType})` : ''}</Tag>
                  </Col>
                  <Col span={24}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Delivery Address:</Text> <Text style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>{order.address || order.deliveryAddress || "N/A"}</Text>
                  </Col>
                </Row>
              </div>

              {/* Items Table */}
              <Table
                dataSource={groupedItems[section]}
                pagination={false}
                rowKey={(r, idx) => r._id || r.itemId || idx}
                size="small"
                bordered
                columns={[
                  { title: "Item Description", dataIndex: "name", key: "name", render: (text) => <Text strong style={{ fontSize: 13 }}>{text}</Text> },
                  { title: "Qty / Packet", dataIndex: "qtyPerPacket", key: "qtyPerPacket", align: "center", width: 95, render: (q) => <Text style={{ fontSize: 13 }}>{q}</Text> },
                  { title: "Total Order", dataIndex: "totalOrderQty", key: "totalOrderQty", align: "center", width: 100, render: (q, r) => <Text strong style={{ fontSize: 13, color: "#2563eb" }}>{q} {r.unit}</Text> },
                  { title: "In Stock", dataIndex: "currentStock", key: "currentStock", align: "center", width: 95, render: (s, r) => <Text style={{ fontSize: 13, color: s >= r.totalOrderQty ? "#16a34a" : "#64748b" }}>{s} {r.unit}</Text> },
                  { title: "To Prepare", dataIndex: "toPrepare", key: "toPrepare", align: "center", width: 105, render: (p, r) => (
                    <Tag color={p > 0 ? "volcano" : "green"} style={{ fontWeight: 700, fontSize: 12 }}>
                      {p > 0 ? `${p} ${r.unit}` : "0"}
                    </Tag>
                  )},
                ]}
              />
              
              {order.notes && (
                <div style={{ marginTop: 10, padding: "6px 10px", border: "1px solid #fca5a5", borderRadius: 6, background: "#fef2f2" }}>
                  <Text strong style={{ color: "#ef4444", fontSize: 11 }}>SPECIAL INSTRUCTIONS:</Text>{" "}
                  <Text style={{ fontSize: 12 }}>{order.notes}</Text>
                </div>
              )}
            </div>

            {index < sections.length - 1 && (
              <div style={{ textAlign: "center", margin: "14px 0", color: "#94a3b8", fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>
                ✂️ - - - - - - - - - - - - - - - CUT HERE - - - - - - - - - - - - - - - ✂️
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </Modal>
  );
};

export default ChefSlipModal;
