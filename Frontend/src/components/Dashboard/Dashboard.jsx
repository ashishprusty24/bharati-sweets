import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Card, Table, Tag, Typography } from "antd";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import {
  DollarCircleOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
} from "@ant-design/icons";

// Assuming this constant is defined elsewhere, but including it for context
// You should ensure this points to your actual API endpoint.
const API_BASE_URL = "http://localhost:5000/api";

const { Title, Text } = Typography;

// Summary Cards Component
const SummaryCards = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const cardStyles = {
    sales: {
      bg: "#e6f7ff",
      icon: <DollarCircleOutlined style={{ fontSize: 32, color: "#1890ff" }} />,
    },
    profit: {
      bg: "#f6ffed",
      icon: <RiseOutlined style={{ fontSize: 32, color: "#52c41a" }} />,
    },
    pending: {
      bg: "#fffbe6",
      icon: <ShoppingCartOutlined style={{ fontSize: 32, color: "#faad14" }} />,
    },
    lowStock: {
      bg: "#fff1f0",
      icon: <WarningOutlined style={{ fontSize: 32, color: "#f5222d" }} />,
    },
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/summary`);
        const data = await response.json();
        setSummary(data);
      } catch (error) {
        console.error("Error fetching summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <Row gutter={[16, 16]} className="mb-6">
      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{ backgroundColor: cardStyles.sales.bg }}
          className="rounded-lg shadow-md"
        >
          <Row align="middle" gutter={12}>
            <Col>{cardStyles.sales.icon}</Col>
            <Col flex="auto">
              <Title level={5} style={{ margin: 0, color: "#1890ff" }}>
                Total Sales
              </Title>
              <Title level={3} style={{ margin: "4px 0" }}>
                ₹{summary?.totalSales?.toFixed(2) || "0.00"}
              </Title>
              <Text type="secondary">Last 30 days</Text>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{ backgroundColor: cardStyles.profit.bg }}
          className="rounded-lg shadow-md"
        >
          <Row align="middle" gutter={12}>
            <Col>{cardStyles.profit.icon}</Col>
            <Col flex="auto">
              <Title level={5} style={{ margin: 0, color: "#52c41a" }}>
                Net Profit
              </Title>
              <Title level={3} style={{ margin: "4px 0" }}>
                ₹{summary?.netProfit?.toFixed(2) || "0.00"}
              </Title>
              <Text type="secondary">After expenses</Text>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{ backgroundColor: cardStyles.pending.bg }}
          className="rounded-lg shadow-md"
        >
          <Row align="middle" gutter={12}>
            <Col>{cardStyles.pending.icon}</Col>
            <Col flex="auto">
              <Title level={5} style={{ margin: 0, color: "#faad14" }}>
                Pending Orders
              </Title>
              <Title level={3} style={{ margin: "4px 0" }}>
                {summary?.pendingOrders || 0}
              </Title>
              <Text type="secondary">To be fulfilled</Text>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{ backgroundColor: cardStyles.lowStock.bg }}
          className="rounded-lg shadow-md"
        >
          <Row align="middle" gutter={12}>
            <Col>{cardStyles.lowStock.icon}</Col>
            <Col flex="auto">
              <Title level={5} style={{ margin: 0, color: "#f5222d" }}>
                Low Stock
              </Title>
              <Title level={3} style={{ margin: "4px 0" }}>
                {summary?.lowStockItems || 0}
              </Title>
              <Text type="secondary">Needs attention</Text>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

const SalesChart = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/sales`);
        const data = await response.json();
        setSalesData(data);
      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  useEffect(() => {
    if (!loading && chartRef.current) {
      const chartInstance = echarts.init(chartRef.current);

      const option = {
        title: {
          text: "Sales Performance",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          formatter: "{b}<br />₹{c}",
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: salesData.map((item) => item.date),
          axisLabel: { rotate: 45 },
        },
        yAxis: {
          type: "value",
          name: "Amount (₹)",
          axisLabel: {
            formatter: "₹{value}",
          },
        },
        series: [
          {
            name: "Sales",
            type: "line",
            smooth: true,
            data: salesData.map((item) => item.amount),
            lineStyle: { width: 3, color: "#008080" },
            itemStyle: { color: "#008080" },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "rgba(24, 144, 255, 0.5)" },
                  { offset: 1, color: "rgba(24, 144, 255, 0.1)" },
                ],
              },
            },
          },
        ],
      };

      chartInstance.setOption(option);

      // Resize listener
      const resizeHandler = () => chartInstance.resize();
      window.addEventListener("resize", resizeHandler);

      return () => {
        window.removeEventListener("resize", resizeHandler);
        chartInstance.dispose();
      };
    }
  }, [salesData, loading]);

  return (
    <Card loading={loading} className="rounded-lg shadow-md">
      <div ref={chartRef} style={{ height: 400 }}></div>
    </Card>
  );
};

// Expense Chart Component
const ExpenseChart = () => {
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const fetchExpenseData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/expenses`);
        const data = await response.json();
        setExpenseData(data);
      } catch (error) {
        console.error("Error fetching expense data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseData();
  }, []);

  useEffect(() => {
    if (!loading && chartRef.current) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }

      const option = {
        title: {
          text: "Expense Breakdown",
          left: "center",
          textStyle: {
            fontWeight: "normal",
          },
        },
        tooltip: {
          trigger: "item",
          formatter: "{b}: ₹{c} ({d}%)",
        },
        legend: {
          orient: "vertical",
          right: 10,
          top: "center",
        },
        series: [
          {
            name: "Expenses",
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: true,
                fontSize: "18",
                fontWeight: "bold",
                formatter: "{b}\n₹{c}",
              },
            },
            labelLine: {
              show: false,
            },
            data: expenseData.map((item) => ({
              value: item.amount,
              name: item.category,
              itemStyle: {
                color: getCategoryColor(item.category),
              },
            })),
          },
        ],
      };

      chartInstance.current.setOption(option);
      window.addEventListener("resize", chartInstance.current.resize);
    }

    return () => {
      if (chartInstance.current) {
        window.removeEventListener("resize", chartInstance.current.resize);
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [expenseData, loading]);

  const getCategoryColor = (category) => {
    const colors = {
      ingredients: "#4C78A8", // A cool, calming blue
      packaging: "#F58518", // A warm, energetic orange
      utilities: "#E45756", // A bold, eye-catching red
      rent: "#72B7B2", // A soft, pleasing teal
      salaries: "#54A24B", // A fresh, natural green
      marketing: "#B5799D", // A muted, sophisticated purple
      equipment: "#FF9DA7", // A light, gentle pink
      transportation: "#9D7460", // An earthy, grounded brown
      other: "#BAB0AC", // A neutral gray for less important categories
    };
    return colors[category] || "#d3d3d3"; // A default light gray
  };

  return (
    <Card loading={loading} className="rounded-lg shadow-md">
      <div ref={chartRef} style={{ height: 400 }} />
    </Card>
  );
};

// Popular Products Component
const PopularProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/dashboard/popular-products`
        );
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching popular products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularProducts();
  }, []);

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: "Quantity Sold",
      dataIndex: "quantitySold",
      key: "quantitySold",
      align: "right",
      render: (text) => <Text>{text} kg</Text>,
    },
    {
      title: "Revenue",
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      render: (text) => <Text strong>₹{text?.toFixed(2)}</Text>,
    },
  ];

  return (
    <Card
      title="Top Selling Products"
      className="rounded-lg shadow-md"
      loading={loading}
    >
      <Table
        columns={columns}
        dataSource={products}
        rowKey="_id"
        pagination={false}
        size="small"
      />
    </Card>
  );
};

// Pending Orders Component
const PendingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/dashboard/pending-orders`
        );
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching pending orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrders();
  }, []);

  const columns = [
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      render: (id) => <Text strong>{id?.substring(0, 8)}...</Text>,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Delivery Date",
      key: "delivery",
      render: (_, record) => (
        <Text>
          {new Date(record.deliveryDate).toLocaleDateString()}{" "}
          {record.deliveryTime}
        </Text>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, record) => <Text strong>₹{record.totalAmount}</Text>,
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag color="orange">
          {record.orderStatus.charAt(0).toUpperCase() +
            record.orderStatus.slice(1)}
        </Tag>
      ),
    },
  ];

  return (
    <Card
      title="Pending Event Orders"
      className="rounded-lg shadow-md"
      loading={loading}
    >
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="_id"
        pagination={{ pageSize: 5 }}
        size="small"
      />
    </Card>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  return (
    <div className="bg-gray-100 p-8 min-h-screen">
      <SummaryCards />
      <Row gutter={[16, 16]} style={{ margin: "5px 0px" }}>
        <Col xs={24} lg={12}>
          <SalesChart />
        </Col>
        <Col xs={24} lg={12}>
          <ExpenseChart />
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <PopularProducts />
        </Col>
        <Col xs={24} lg={12}>
          <PendingOrders />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
