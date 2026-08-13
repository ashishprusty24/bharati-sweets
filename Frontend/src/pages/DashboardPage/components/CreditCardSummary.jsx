import React from "react";
import { Card, Typography, Space, Progress, Button, List, Tag } from "antd";
import { CreditCardOutlined, BankOutlined, ArrowRightOutlined } from "@ant-design/icons";
import useFetch from "../../../hooks/useFetch";
import { useNavigate } from "react-router-dom";
import EmptyState from "./EmptyState";

const { Text } = Typography;

const CreditCardSummary = () => {
  const { data, loading } = useFetch("/dashboard/financial-health");
  const navigate = useNavigate();

  const creditCards = data?.creditCards || [];
  const ccLoans = data?.ccLoans || [];

  if (!loading && creditCards.length === 0 && ccLoans.length === 0) {
    return (
      <Card 
        title={
          <Space>
            <CreditCardOutlined style={{ color: "#ef4444" }} />
            <span style={{ fontWeight: 700 }}>Credit Cards & CC Loans</span>
          </Space>
        } 
        bordered={false}
        className="premium-shadow"
        style={{ borderRadius: 24, height: "100%" }}
      >
        <EmptyState message="No credit card or loan accounts configured" height={220} />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <div style={{ 
            background: "#fee2e2", 
            padding: "8px", 
            borderRadius: "10px", 
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <CreditCardOutlined style={{ color: "#ef4444", fontSize: "18px" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#1e293b" }}>Credit Cards & CC Loan Payables</span>
        </Space>
      } 
      bordered={false}
      className="premium-shadow"
      style={{ borderRadius: 24, height: "100%" }}
      loading={loading}
      extra={
        <Button 
          type="text" 
          onClick={() => navigate("/credit-cards")}
          icon={<ArrowRightOutlined />}
          style={{ color: "#3b82f6", fontWeight: 600 }}
        >
          Credit Cards
        </Button>
      }
    >
      <List
        dataSource={[...creditCards.map(c => ({ ...c, isCard: true })), ...ccLoans.map(l => ({ ...l, isCard: false }))].slice(0, 5)}
        renderItem={(item) => {
          if (item.isCard) {
            const limit = Number(item.totalLimit || item.creditLimit || 100000);
            const used = Number(item.outstandingBalance || item.currentBalance || 0);
            const percent = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));

            return (
              <List.Item style={{ border: "none", padding: "8px 0" }}>
                <div style={{ 
                  width: "100%", 
                  background: "#ffffff",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.02)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Space size="small">
                      <CreditCardOutlined style={{ color: "#ef4444", fontSize: 16 }} />
                      <Text strong style={{ color: "#1e293b", fontSize: 14 }}>{item.cardName} (•••• {item.last4Digits})</Text>
                    </Space>
                    <Tag color="red" style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}>
                      Due: ₹{used.toLocaleString("en-IN")}
                    </Tag>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Limit: ₹{limit.toLocaleString("en-IN")}</Text>
                    <div style={{ width: "45%" }}>
                      <Progress percent={percent} status={percent >= 80 ? "exception" : "normal"} size="small" showInfo={false} />
                    </div>
                  </div>
                </div>
              </List.Item>
            );
          } else {
            const limit = Number(item.sanctionedLimit || item.loanLimit || 500000);
            const used = Number(item.outstandingPrincipal || item.currentDrawdown || 0);
            const percent = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));

            return (
              <List.Item style={{ border: "none", padding: "8px 0" }}>
                <div style={{ 
                  width: "100%", 
                  background: "#ffffff",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.02)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Space size="small">
                      <BankOutlined style={{ color: "#0d7377", fontSize: 16 }} />
                      <Text strong style={{ color: "#1e293b", fontSize: 14 }}>{item.bankName || "CC Loan Account"}</Text>
                    </Space>
                    <Tag color="teal" style={{ fontWeight: 700, borderRadius: 6, margin: 0, background: "#f0fdfa", color: "#0d7377", border: "1px solid #ccfbf1" }}>
                      Used: ₹{used.toLocaleString("en-IN")}
                    </Tag>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Sanctioned: ₹{limit.toLocaleString("en-IN")}</Text>
                    <div style={{ width: "45%" }}>
                      <Progress percent={percent} size="small" showInfo={false} strokeColor="#0d7377" />
                    </div>
                  </div>
                </div>
              </List.Item>
            );
          }
        }}
      />
    </Card>
  );
};

export default CreditCardSummary;
