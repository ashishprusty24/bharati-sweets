import React from "react";
import { Empty, Typography } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const { Text } = Typography;

const EmptyState = ({ message = "No data available for this period", height = 300 }) => {
  return (
    <div style={{ 
      height, 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "rgba(248, 250, 252, 0.5)",
      borderRadius: 16,
      border: "1px dashed #e2e8f0"
    }}>
      <Empty
        image={<InboxOutlined style={{ fontSize: 48, color: "#cbd5e1" }} />}
        description={
          <div style={{ marginTop: 12 }}>
            <Text style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500 }}>
              {message}
            </Text>
          </div>
        }
      />
    </div>
  );
};

export default EmptyState;
