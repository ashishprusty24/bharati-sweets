import React from "react";
import { Empty, Typography } from "antd";

const { Text } = Typography;

const EmptyState = ({ message = "No data available", height = 180 }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height,
        width: "100%",
      }}
    >
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Text style={{ color: "#94a3b8", fontSize: 13 }}>{message}</Text>
        }
      />
    </div>
  );
};

export default EmptyState;
