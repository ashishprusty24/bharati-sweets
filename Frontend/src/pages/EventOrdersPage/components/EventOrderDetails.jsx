import React from "react";
import { Row, Col, Typography, Card, Table, Tag } from "antd";

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
        <Col xs={24} sm={8}><Text strong>Purpose:</Text> {record.purpose}</Col>
        <Col xs={12} sm={8}><Text strong>Packets:</Text> {record.packets || 1}</Col>
        <Col xs={12} sm={8}><Text strong>Discount/Pkt:</Text> ₹{record.discount || 0}</Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}><Text strong>Delivery Address:</Text> {record.address}</Col>
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
