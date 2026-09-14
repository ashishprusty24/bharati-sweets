import React, { useRef } from "react";
import { Modal, Button, Typography, Table, Divider, Grid } from "antd";
import { PrinterOutlined, DownloadOutlined, WhatsAppOutlined } from "@ant-design/icons";
import html2pdf from "html2pdf.js";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const RegularKOTModal = ({ visible, order, inventoryItems, onCancel }) => {
  const slipRef = useRef();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (!order) return null;

  const handleDownloadPDF = () => {
    const element = slipRef.current;
    const opt = {
      margin: isMobile ? 5 : 10,
      filename: `KOT_Regular_${order._id.slice(-6)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: isMobile ? 1.5 : 2, useCORS: true, allowTaint: true, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a5", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  const groupedItems = (order.items || []).reduce((acc, item) => {
    const invItem = inventoryItems?.find(
      (i) => i._id === item.itemId || i.name?.toLowerCase() === item.name?.toLowerCase()
    );
    const section = invItem?.kitchenSection || "Uncategorized";
    const currentStock = invItem ? Number(invItem.quantity) || 0 : 0;
    const unit = invItem ? invItem.unit || item.unit || "pcs" : item.unit || "pcs";
    const orderQty = Number(item.quantity) || 0;
    const toPrepare = Math.max(0, orderQty - currentStock);

    if (!acc[section]) acc[section] = [];
    acc[section].push({
      ...item,
      currentStock,
      unit,
      orderQty,
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
        itemsList += `• ${item.name}: ${item.orderQty} ${item.unit} (In Stock: ${item.currentStock} ${item.unit} | Cook: ${item.toPrepare} ${item.unit})\n`;
      });
    });

    const message = `*KITCHEN ORDER TICKET (REGULAR KOT)${sectionName ? ` - ${sectionName}` : ""}*\n` +
      `*No:* RKOT-${order._id.slice(-6).toUpperCase()}\n\n` +
      `*Date:* ${dayjs(order.orderDate).format("MMM D, YYYY h:mm A")}\n\n` +
      `*ITEMS BREAKDOWN (INVENTORY SYNCED):*\n${itemsList}\n` +
      (order.notes ? `\n*SPECIAL INSTRUCTIONS:*\n${order.notes}` : "");

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Modal
      title="Kitchen Order Ticket (Regular)"
      open={visible}
      onCancel={onCancel}
      width={isMobile ? "95vw" : 600}
      centered
      className="responsive-modal"
      styles={{ body: { padding: isMobile ? 8 : 24, maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" } }}
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
            {isMobile ? "PDF" : "Download PDF"}
          </Button>
        </div>
      }
    >
      <div ref={slipRef} style={{ padding: isMobile ? "16px" : "30px", background: "#fff", color: "#333", fontSize: isMobile ? "14px" : "16px" }}>
        {sections.map((section, index) => (
          <div key={section} style={{ pageBreakAfter: index === sections.length - 1 ? "auto" : "always", marginBottom: index === sections.length - 1 ? 0 : 40, border: "1px dashed #ccc", padding: "16px" }}>
            {/* Header */}
            <div style={{ textAlign: "center", borderBottom: "2px dashed #333", paddingBottom: 10, marginBottom: 20, position: "relative" }}>
              <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>KOT - {section}</Title>
              <Text strong>No: RKOT-{order._id.slice(-6).toUpperCase()}</Text>
              <Button 
                type="text" 
                icon={<WhatsAppOutlined />} 
                style={{ position: "absolute", right: 0, top: 0, color: "#25D366", fontSize: "20px" }}
                onClick={() => handleShareWhatsApp(section)}
                title={`Share ${section} on WhatsApp`}
              />
            </div>

            {/* Info */}
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
              <div>
                <Text strong>Customer:</Text> {order.customerName}
              </div>
              <div>
                <Text strong>Date:</Text> {dayjs(order.orderDate).format("MMM D, YYYY h:mm A")}
              </div>
            </div>

            {/* Items Table */}
            <Table
              dataSource={groupedItems[section]}
              pagination={false}
              rowKey={(r, idx) => r._id || r.itemId || idx}
              size="middle"
              bordered
              columns={[
                { title: "Item Description", dataIndex: "name", key: "name", render: (text) => <Text strong>{text}</Text> },
                { title: "Order Qty", dataIndex: "orderQty", key: "orderQty", align: "center", width: 95, render: (q, r) => <Text strong style={{ color: "#2563eb" }}>{q} {r.unit}</Text> },
                { title: "In Stock", dataIndex: "currentStock", key: "currentStock", align: "center", width: 90, render: (s, r) => <Text style={{ color: s >= r.orderQty ? "#16a34a" : "#64748b" }}>{s} {r.unit}</Text> },
                { title: "To Prepare", dataIndex: "toPrepare", key: "toPrepare", align: "center", width: 100, render: (p, r) => (
                  <Text strong style={{ color: p > 0 ? "#dc2626" : "#16a34a" }}>
                    {p > 0 ? `${p} ${r.unit}` : "0"}
                  </Text>
                )},
              ]}
            />
            
            {order.notes && (
              <div style={{ marginTop: 20, padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fef2f2" }}>
                <Text strong style={{ color: "#ef4444" }}>SPECIAL INSTRUCTIONS:</Text><br />
                <Text>{order.notes}</Text>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default RegularKOTModal;
