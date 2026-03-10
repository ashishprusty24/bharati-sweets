import React, { useRef } from "react";
import { Modal, Button, Typography, Row, Col, Table, Divider } from "antd";
import { PrinterOutlined, DownloadOutlined } from "@ant-design/icons";
import html2pdf from "html2pdf.js";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const InvoiceModal = ({ visible, order, onCancel }) => {
  const invoiceRef = useRef();

  if (!order) return null;

  const handleDownloadPDF = () => {
    const element = invoiceRef.current;
    const opt = {
      margin: 10,
      filename: `Invoice_${order._id.slice(-6)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
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
      width={850}
      footer={[
        <Button key="close" onClick={onCancel}>Close</Button>,
        <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>Download PDF</Button>
      ]}
    >
      <div ref={invoiceRef} style={{ padding: "40px", background: "#fff", color: "#333", fontSize: "14px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #333", paddingBottom: "20px", marginBottom: "30px" }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>BHARATI SWEETS</Title>
            <Text>GST: 21BQIPP9883R1ZQ</Text><br />
            <Text>Contact: +91 94372 XXXXX</Text>
          </div>
          <div style={{ textAlign: "right" }}>
            <Title level={4} style={{ margin: 0 }}>INVOICE</Title>
            <Text>No: INV-{order._id.slice(-6).toUpperCase()}</Text><br />
            <Text>Date: {dayjs().format("MMM D, YYYY")}</Text>
          </div>
        </div>

        {/* Info */}
        <Row gutter={40} style={{ marginBottom: "30px" }}>
          <Col span={12}>
            <Text strong>BILL TO:</Text><br />
            <Text>{order.customerName}</Text><br />
            <Text>{order.phone}</Text><br />
            <Text>{order.address}</Text>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
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
            { title: "Qty/Packet", dataIndex: "quantity", key: "quantity", align: "center" },
            { title: "Price/Packet", dataIndex: "price", key: "price", align: "right", render: (p, item) => `₹${(p * item.quantity).toFixed(2)}` },
          ]}
        />

        {/* Totals */}
        <div style={{ marginTop: "30px", paddingLeft: "50%" }}>
          <Row style={{ marginBottom: "8px" }}>
            <Col span={14}><Text>Subtotal per Packet:</Text></Col>
            <Col span={10} style={{ textAlign: "right" }}><Text>₹{subtotalPerPacket.toFixed(2)}</Text></Col>
          </Row>
          <Row style={{ marginBottom: "8px" }}>
            <Col span={14}><Text>Number of Packets:</Text></Col>
            <Col span={10} style={{ textAlign: "right" }}><Text>x {order.packets || 1}</Text></Col>
          </Row>
          {order.discount > 0 && (
            <>
              <Row style={{ marginBottom: "8px" }}>
                <Col span={14}><Text>Discount Per Packet:</Text></Col>
                <Col span={10} style={{ textAlign: "right" }}><Text>₹{order.discount.toFixed(2)}</Text></Col>
              </Row>
              <Row style={{ marginBottom: "8px" }}>
                <Col span={14}><Text>Total Discount:</Text></Col>
                <Col span={10} style={{ textAlign: "right", color: "#ef4444" }}><Text style={{ color: "inherit" }}>- ₹{(order.discount * (order.packets || 1)).toFixed(2)}</Text></Col>
              </Row>
            </>
          )}
          <Divider style={{ margin: "12px 0" }} />
          <Row style={{ marginBottom: "8px" }}>
            <Col span={14}><Text strong style={{ fontSize: "16px" }}>GRAND TOTAL:</Text></Col>
            <Col span={10} style={{ textAlign: "right" }}><Text strong style={{ fontSize: "16px" }}>₹{totalAmount.toFixed(2)}</Text></Col>
          </Row>
          <Row style={{ marginBottom: "8px" }}>
            <Col span={14}><Text>Advance Paid (Collection):</Text></Col>
            <Col span={10} style={{ textAlign: "right", color: "#10b981" }}><Text style={{ color: "inherit" }}>₹{(order.paidAmount || 0).toFixed(2)}</Text></Col>
          </Row>
          <Divider style={{ margin: "12px 0", borderStyle: "dashed" }} />
          <Row>
            <Col span={14}><Text strong style={{ fontSize: "18px", color: "#d4380d" }}>BALANCE DUE:</Text></Col>
            <Col span={10} style={{ textAlign: "right" }}><Text strong style={{ fontSize: "18px", color: "#d4380d" }}>₹{(totalAmount - (order.paidAmount || 0)).toFixed(2)}</Text></Col>
          </Row>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "100px", borderTop: "1px solid #eee", paddingTop: "20px", textAlign: "center" }}>
          <Text type="secondary">Thank you for your business!</Text>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceModal;
