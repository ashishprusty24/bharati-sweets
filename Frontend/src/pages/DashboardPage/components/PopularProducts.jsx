import React from "react";
import { Card, Typography, Button, Progress, Avatar, Space } from "antd";
import useFetch from "../../../hooks/useFetch";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const sampleProducts = [
  { _id: "1", name: "Kaju Katli", quantitySold: 1250, unit: "kg", revenue: 245000, color: "#8b5cf6", icon: "🥮" },
  { _id: "2", name: "Rasgulla", quantitySold: 980, unit: "kg", revenue: 165200, color: "#3b82f6", icon: "🧆" },
  { _id: "3", name: "Gulab Jamun", quantitySold: 850, unit: "kg", revenue: 118750, color: "#10b981", icon: "🍡" },
  { _id: "4", name: "Barfi", quantitySold: 720, unit: "kg", revenue: 97200, color: "#f97316", icon: "🧈" },
];

const PopularProducts = () => {
  const { data: fetchedProducts, loading } = useFetch("/dashboard/popular-products");
  const navigate = useNavigate();

  const productsList = (fetchedProducts && fetchedProducts.length > 0) 
    ? fetchedProducts.map((p, idx) => ({
        ...p,
        color: sampleProducts[idx % 4].color,
        icon: sampleProducts[idx % 4].icon,
      }))
    : sampleProducts;

  const maxQty = Math.max(...productsList.map(p => p.quantitySold || 1000), 1250);

  return (
    <Card 
      bordered={false}
      style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.03)", background: "#ffffff", border: "1px solid #f1f5f9", height: "100%" }}
      loading={loading}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 18 }}>
          Top Selling Products
        </Title>
        <Button type="link" onClick={() => navigate("/inventory")} style={{ color: "#8b5cf6", fontWeight: 600, padding: 0 }}>
          View All
        </Button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {productsList.slice(0, 4).map((item) => {
          const percent = Math.min(100, Math.round((item.quantitySold / maxQty) * 100));
          return (
            <div key={item._id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar 
                size={40} 
                style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {item.icon || "🥮"}
              </Avatar>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Text strong style={{ color: "#0f172a", fontSize: 13 }}>{item.name}</Text>
                  <Space size={12}>
                    <Text type="secondary" style={{ fontSize: 11 }}>{item.quantitySold.toLocaleString()} {item.unit || "kg"}</Text>
                    <Text strong style={{ color: "#0f172a", fontSize: 13 }}>₹{(item.revenue || 0).toLocaleString("en-IN")}</Text>
                  </Space>
                </div>
                <Progress percent={percent} strokeColor={item.color} size="small" showInfo={false} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default PopularProducts;
