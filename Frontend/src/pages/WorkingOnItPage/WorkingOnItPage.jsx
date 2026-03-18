import React from "react";
import { Button, Result, Typography } from "antd";
import { ToolOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph } = Typography;

const WorkingOnItPage = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 120px)",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
          borderRadius: 24,
          padding: "40px 32px",
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
          border: "1px solid rgba(255,255,255,0.4)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            margin: "0 auto 24px",
            background: "linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 16px rgba(99, 102, 241, 0.15)",
          }}
        >
          <ToolOutlined style={{ fontSize: 36, color: "#6366f1" }} />
        </div>

        <Title level={2} style={{ marginBottom: 12, fontWeight: 700, color: "#1e293b" }}>
          We're Working On It
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 32 }}>
          This feature is currently under development. Thanks for your patience—our team is building something awesome for you!
        </Paragraph>

        <Button
          type="primary"
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{
            height: 48,
            borderRadius: 12,
            padding: "0 28px",
            fontSize: 15,
            fontWeight: 600,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            border: "none",
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
          }}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default WorkingOnItPage;
