import React, { useRef } from "react";
import { Modal, Button, Typography, Row, Col, Table, Divider, Tag } from "antd";
import { PrinterOutlined, DownloadOutlined } from "@ant-design/icons";
import html2pdf from "html2pdf.js";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const ChefSlipModal = ({ visible, order, onCancel }) => {
  const slipRef = useRef();

  if (!order) return null;

  const handleDownloadPDF = () => {
    const element = slipRef.current;
    const opt = {
      margin: 10,
      filename: `KOT_${order._id.slice(-6)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a5", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <Modal
      title="Kitchen Order Ticket (Cheat Slip)"
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="close" onClick={onCancel}>Close</Button>,
        <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>Download PDF</Button>
      ]}
    >
      <div ref={slipRef} style={{ padding: "30px", background: "#fff", color: "#333", fontSize: "16px", border: "1px dashed #ccc" }}>
        {/* Header */}
        <div style={{ textAlign: "center", borderBottom: "2px dashed #333", paddingBottom: "10px", marginBottom: "20px" }}>
          <Title level={3} style={{ margin: 0 }}>KITCHEN ORDER TICKET</Title>
          <Text strong>No: KOT-{order._id.slice(-6).toUpperCase()}</Text>
        </div>

        {/* Info */}
        <div style={{ marginBottom: "20px", background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>
          <Row gutter={20}>
            <Col span={12}>
              <Text strong>Event:</Text> {order.purpose}
            </Col>
            <Col span={12}>
              <Text strong>Date:</Text> {dayjs(order.deliveryDate).format("MMM D, YYYY")}
            </Col>
            <Col span={24} style={{ marginTop: "8px" }}>
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
            { title: "Item Description", dataIndex: "name", key: "name", render: (text) => <Text strong>{text}</Text> },
            { title: "Qty/Packet", dataIndex: "quantity", key: "quantity", align: "center", width: 120 },
          ]}
        />

        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text strong style={{ fontSize: "18px" }}>Total Packets Required:</Text>
          <Tag color="volcano" style={{ fontSize: "20px", padding: "4px 16px", borderRadius: "8px" }}>
            x {order.packets || 1}
          </Tag>
        </div>
        
        {order.notes && (
          <div style={{ marginTop: "30px", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fef2f2" }}>
            <Text strong style={{ color: "#ef4444" }}>SPECIAL INSTRUCTIONS:</Text><br />
            <Text>{order.notes}</Text>
          </div>
        )}

      </div>
    </Modal>
  );
};

export default ChefSlipModal;
