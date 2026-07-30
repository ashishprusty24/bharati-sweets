import React, { useRef } from "react";
import { Modal, Button, Typography, Table, Grid } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const RegularKOTModal = ({ visible, order, onCancel }) => {
  const slipRef = useRef();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (!order) return null;

  return (
    <Modal
      title="Kitchen Order Ticket (Regular)"
      open={visible}
      onCancel={onCancel}
      width={isMobile ? "95vw" : 500}
      centered
      footer={
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onCancel}>Close</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => window.print()}>
            Print
          </Button>
        </div>
      }
    >
      <div ref={slipRef} style={{ padding: isMobile ? "16px" : "30px", background: "#fff", color: "#333", border: "1px dashed #ccc" }}>
        <div style={{ textAlign: "center", borderBottom: "2px dashed #333", paddingBottom: 10, marginBottom: 20 }}>
          <Title level={4} style={{ margin: 0 }}>KITCHEN ORDER TICKET</Title>
          <Text strong>No: RKOT-{order._id ? order._id.slice(-6).toUpperCase() : ""}</Text>
        </div>

        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
          <div>
            <Text strong>Customer:</Text> {order.customerName}
          </div>
          <div>
            <Text strong>Date:</Text> {dayjs(order.orderDate).format("MMM D, YYYY h:mm A")}
          </div>
        </div>

        <Table
          dataSource={order.items}
          pagination={false}
          rowKey={(r, i) => r._id || i}
          size="middle"
          bordered
          columns={[
            { title: "Item", dataIndex: "name", key: "name", render: (text) => <Text strong>{text}</Text> },
            { title: "Qty", dataIndex: "quantity", key: "quantity", align: "center", width: 100 },
          ]}
        />
      </div>
    </Modal>
  );
};

export default RegularKOTModal;
