import React, { useRef } from "react";
import { Modal, Button, Typography, Row, Col, Table, Divider, Grid } from "antd";
import { PrinterOutlined, DownloadOutlined } from "@ant-design/icons";
import html2pdf from "html2pdf.js";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const InvoiceModal = ({ visible, order, onCancel }) => {
  const invoiceRef = useRef();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (!order) return null;

  const handleDownloadPDF = () => {
    const element = invoiceRef.current;
    const opt = {
      margin: isMobile ? 5 : 10,
      filename: `Invoice_${order._id.slice(-6)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { 
        scale: isMobile ? 1.5 : 2, 
        useCORS: true, 
        allowTaint: true,
        scrollY: 0,
        windowWidth: 800,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  const subtotalPerPacket = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = (subtotalPerPacket * (order.packets || 1)) - ((order.discount || 0) * (order.packets || 1));

  return (
    <Modal
      title="Invoice Preview"
      open={visible}
      onCancel={onCancel}
      width={isMobile ? "95vw" : 850}
      centered
      className="responsive-modal"
      styles={{ body: { padding: isMobile ? 8 : 24, maxHeight: "70vh", overflowY: "auto" } }}
      footer={[
        <Button key="close" onClick={onCancel}>Close</Button>,
        <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>
          {isMobile ? "PDF" : "Download PDF"}
        </Button>
      ]}
    >
      <div ref={invoiceRef} style={{ padding: isMobile ? "16px" : "40px", background: "#fff", color: "#333", fontSize: isMobile ? "12px" : "14px" }}>
        {/* Header */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", borderBottom: "2px solid #333", paddingBottom: isMobile ? 12 : 20, marginBottom: isMobile ? 16 : 30, gap: isMobile ? 8 : 0 }}>
          <div>
            <Title level={isMobile ? 4 : 2} style={{ margin: 0 }}>BHARATI SWEETS</Title>
            <Text style={{ fontSize: isMobile ? 11 : 14 }}>GST: 21BQIPP9883R1ZQ</Text><br />
            <Text style={{ fontSize: isMobile ? 11 : 14 }}>Contact: +91 94372 XXXXX</Text>
          </div>
          <div style={{ textAlign: isMobile ? "left" : "right" }}>
            <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>INVOICE</Title>
            <Text style={{ fontSize: isMobile ? 11 : 14 }}>No: INV-{order._id.slice(-6).toUpperCase()}</Text><br />
            <Text style={{ fontSize: isMobile ? 11 : 14 }}>Date: {dayjs().format("MMM D, YYYY")}</Text>
          </div>
        </div>

        {/* Info */}
        <Row gutter={isMobile ? 16 : 40} style={{ marginBottom: isMobile ? 16 : 30 }}>
          <Col xs={24} sm={12} style={{ marginBottom: isMobile ? 12 : 0 }}>
            <Text strong>BILL TO:</Text><br />
            <Text>{order.customerName}</Text><br />
            <Text>{order.phone}</Text><br />
            <Text>{order.address}</Text>
          </Col>
          <Col xs={24} sm={12} style={{ textAlign: isMobile ? "left" : "right" }}>
            <Text strong>EVENT DETAILS:</Text><br />
            <Text>{order.purpose}</Text><br />
            <Text>Date: {dayjs(order.deliveryDate).format("MMM D, YYYY")}</Text><br />
            <Text>Time: {order.deliveryTime}</Text>
          </Col>
        </Row>

        {/* Items Table */}
        <Table
          dataSource={order.items}
          pagination={false}
          rowKey="_id"
          size="small"
          columns={[
            { title: "Description", dataIndex: "name", key: "name" },
            { title: isMobile ? "Qty" : "Qty/Packet", dataIndex: "quantity", key: "quantity", align: "center", width: isMobile ? 50 : undefined },
            { title: "Price", dataIndex: "price", key: "price", align: "right", render: (p, item) => `₹${(p * item.quantity).toFixed(2)}`, width: isMobile ? 70 : undefined },
          ]}
        />

        {/* Totals */}
        <div style={{ marginTop: isMobile ? 16 : 30, paddingLeft: isMobile ? 0 : "50%" }}>
          <Row style={{ marginBottom: 8 }}>
            <Col span={14}><Text>Subtotal/Packet:</Text></Col>
            <Col span={10} style={{ textAlign: "right" }}><Text>₹{subtotalPerPacket.toFixed(2)}</Text></Col>
          </Row>
          <Row style={{ marginBottom: 8 }}>
            <Col span={14}><Text>Packets:</Text></Col>
            <Col span={10} style={{ textAlign: "right" }}><Text>x {order.packets || 1}</Text></Col>
          </Row>
          {order.discount > 0 && (
            <>
              <Row style={{ marginBottom: 8 }}>
                <Col span={14}><Text>Discount/Packet:</Text></Col>
                <Col span={10} style={{ textAlign: "right" }}><Text>₹{order.discount.toFixed(2)}</Text></Col>
              </Row>
              <Row style={{ marginBottom: 8 }}>
                <Col span={14}><Text>Total Discount:</Text></Col>
                <Col span={10} style={{ textAlign: "right", color: "#ef4444" }}><Text style={{ color: "inherit" }}>- ₹{(order.discount * (order.packets || 1)).toFixed(2)}</Text></Col>
              </Row>
            </>
          )}
          <Divider style={{ margin: "12px 0" }} />
          <Row style={{ marginBottom: 8 }}>
            <Col span={14}><Text strong style={{ fontSize: isMobile ? 14 : 16 }}>GRAND TOTAL:</Text></Col>
            <Col span={10} style={{ textAlign: "right" }}><Text strong style={{ fontSize: isMobile ? 14 : 16 }}>₹{totalAmount.toFixed(2)}</Text></Col>
          </Row>
          <Row style={{ marginBottom: 8 }}>
            <Col span={14}><Text>Advance Paid:</Text></Col>
            <Col span={10} style={{ textAlign: "right", color: "#10b981" }}><Text style={{ color: "inherit" }}>₹{(order.paidAmount || 0).toFixed(2)}</Text></Col>
          </Row>
          <Divider style={{ margin: "12px 0", borderStyle: "dashed" }} />
          <Row>
            <Col span={14}><Text strong style={{ fontSize: isMobile ? 15 : 18, color: "#d4380d" }}>BALANCE DUE:</Text></Col>
            <Col span={10} style={{ textAlign: "right" }}><Text strong style={{ fontSize: isMobile ? 15 : 18, color: "#d4380d" }}>₹{(totalAmount - (order.paidAmount || 0)).toFixed(2)}</Text></Col>
          </Row>
        </div>

        {/* Footer */}
        <div style={{ marginTop: isMobile ? 40 : 100, borderTop: "1px solid #eee", paddingTop: 20, textAlign: "center" }}>
          <Text type="secondary">Thank you for your business!</Text>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceModal;
