import React from "react";
import { Row, Col, Typography, Card, Table, Tag } from "antd";
import { PhoneOutlined } from "@ant-design/icons";

const { Text } = Typography;

const EventOrderDetails = ({ record }) => {
  const renderOrderItems = (items) => (
    <Card title="Order Items" size="small" style={{ marginBottom: 16 }}>
      <div style={{ overflowX: "auto" }}>
        <Table
          dataSource={items}
          pagination={false}
          rowKey={(record) => record._id || record.itemId}
          size="small"
          columns={[
            { title: "Item", dataIndex: "name", key: "name" },
            { title: "Price/Pkt", dataIndex: "price", key: "price", width: 80, render: (p) => `₹${p}` },
            { title: "Qty/Pkt", dataIndex: "quantity", key: "quantity", width: 70 },
            { title: "Total/Pkt", key: "total", width: 80, render: (_, r) => `₹${(r.price * r.quantity).toFixed(2)}` },
          ]}
        />
      </div>
    </Card>
  );

  const renderPayments = (payments) => (
    <Card title="Payment History" size="small" style={{ marginBottom: 16 }}>
      <div style={{ overflowX: "auto" }}>
        <Table
          dataSource={payments}
          pagination={false}
          rowKey={(record, index) => index}
          size="small"
          columns={[
            { title: "Date", dataIndex: "date", key: "date", render: (d) => new Date(d).toLocaleDateString() },
            { title: "Amount", dataIndex: "amount", key: "amount", render: (a) => `₹${a}` },
            { title: "Method", dataIndex: "method", key: "method" },
          ]}
        />
      </div>
    </Card>
  );

  return (
    <div style={{ padding: "10px" }}>
      <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Text strong>Customer:</Text> {record.customerName}
        </Col>
        <Col xs={24} sm={8}>
          <Text strong>Phone:</Text>{" "}
          {record.phone ? (
            <a
              href={`tel:${record.phone}`}
              style={{
                color: "#0284c7",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                textDecoration: "none",
                marginLeft: 4,
                backgroundColor: "#e0f2fe",
                padding: "2px 8px",
                borderRadius: 12,
                border: "1px solid #bae6fd",
                fontSize: 12,
              }}
            >
              <PhoneOutlined /> {record.phone} (Call)
            </a>
          ) : (
            "N/A"
          )}
        </Col>
        <Col xs={24} sm={8}><Text strong>Purpose:</Text> {record.purpose}</Col>
        <Col xs={12} sm={8}><Text strong>Packets:</Text> {record.packets || 1}</Col>
        <Col xs={12} sm={8}><Text strong>Discount/Pkt:</Text> ₹{record.discount || 0}</Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}><Text strong>Delivery Address:</Text> {record.address}</Col>
      </Row>
      
      {renderOrderItems(record.items)}
      
      {record.payments?.length > 0 && renderPayments(record.payments)}

      {record.adminWaiver > 0 && (
        <Card size="small" style={{ marginBottom: 16, background: "#fffbeb", borderColor: "#fde68a" }}>
          <Text strong style={{ color: "#b45309" }}>🛡️ Owner Shortage / Admin Waiver Audit Record:</Text>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <Tag color="green" style={{ borderRadius: 6, fontWeight: 600 }}>💵 Customer Paid: ₹{(record.paidAmount || 0).toLocaleString()}</Tag>
            <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600 }}>🛡️ Admin Waived: ₹{record.adminWaiver.toLocaleString()}</Tag>
            <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>📊 Total Settled: ₹{((record.paidAmount || 0) + record.adminWaiver).toLocaleString()}</Tag>
          </div>
        </Card>
      )}
      
      {record.notes && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Special Notes:</Text> {record.notes}
        </div>
      )}
    </div>
  );
};

export default EventOrderDetails;
