import React from "react";
import { Row, Col, Typography, Card, Table, Tag } from "antd";

const { Text } = Typography;

const EventOrderDetails = ({ record }) => {
  const renderOrderItems = (items = []) => (
    <Card title="Order Items" size="small" style={{ marginBottom: 16 }}>
      <div style={{ overflowX: "auto" }}>
        <Table
          dataSource={items}
          pagination={false}
          rowKey={(item, index) => item._id || item.itemId || index}
          size="small"
          columns={[
            { title: "Item", dataIndex: "name", key: "name" },
            { title: "Price/Pkt", dataIndex: "price", key: "price", width: 80, render: (p, r) => `₹${p || r.unitPrice || 0}` },
            { title: "Qty/Pkt", dataIndex: "quantity", key: "quantity", width: 70 },
            { title: "Total/Pkt", key: "total", width: 80, render: (_, r) => `₹${((r.price || r.unitPrice || 0) * r.quantity).toFixed(2)}` },
          ]}
        />
      </div>
    </Card>
  );

  const renderPayments = (payments = []) => (
    <Card title="💳 Payment Installment History" size="small" style={{ marginBottom: 16 }}>
      <div style={{ overflowX: "auto" }}>
        <Table
          dataSource={payments}
          pagination={false}
          rowKey={(record, index) => index}
          size="small"
          columns={[
            { title: "#", key: "index", width: 50, render: (_, __, i) => i + 1 },
            {
              title: "Date & Time",
              dataIndex: "date",
              key: "date",
              render: (d, r) => {
                const dateVal = d || r.timestamp || r.date;
                if (!dateVal) return "N/A";
                const dt = new Date(dateVal);
                return isNaN(dt.getTime()) ? "N/A" : dt.toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });
              },
            },
            {
              title: "Amount Paid",
              dataIndex: "amount",
              key: "amount",
              render: (a) => <Tag color="green" style={{ fontWeight: 700 }}>₹{Number(a || 0).toLocaleString("en-IN")}</Tag>,
            },
            {
              title: "Payment Method",
              dataIndex: "method",
              key: "method",
              render: (m) => (
                <Tag color="blue" style={{ textTransform: "uppercase", fontWeight: 600 }}>
                  {m === "phonepay" ? "📱 PhonePe" : m === "gpay" ? "📱 GPay" : m === "card" ? "💳 Card" : m === "upi" ? "📱 UPI" : `💵 ${(m || "cash").toUpperCase()}`}
                </Tag>
              ),
            },
          ]}
        />
      </div>
    </Card>
  );

  return (
    <div style={{ padding: "10px" }}>
      <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}><Text strong>Purpose:</Text> {record.purpose}</Col>
        <Col xs={12} sm={8}><Text strong>Packets:</Text> {record.packets || 1}</Col>
        <Col xs={12} sm={8}><Text strong>Discount/Pkt:</Text> ₹{record.discount || 0}</Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}><Text strong>Delivery Address:</Text> {record.address || record.deliveryAddress || "N/A"}</Col>
      </Row>
      
      {renderOrderItems(record.items)}
      
      {record.payments?.length > 0 && renderPayments(record.payments)}
      
      {record.notes && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Special Notes:</Text> {record.notes}
        </div>
      )}
    </div>
  );
};

export default EventOrderDetails;
