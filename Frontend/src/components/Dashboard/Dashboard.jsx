import React, { useState, useEffect } from "react";
import { Row, Col, Card, Table, Tag, Typography } from "antd";
import ReactECharts from "echarts-for-react";

// Assuming this constant is defined elsewhere, but including it for context
// You should ensure this points to your actual API endpoint.
const API_BASE_URL = "http://localhost:5000/api";

const { Title, Text } = Typography;

// Summary Cards Component
const SummaryCards = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div>Loading...</div>;

  return (
    <Row gutter={[16, 16]} className="mb-6">
      <Col xs={24} sm={12} lg={6}>
        <Card variant="filled" className="rounded-lg shadow-md">
          <Title level={5} className="text-blue-500 m-0">
            Total Sales
          </Title>
          <Title level={3} className="my-2">
            ₹{summary?.totalSales?.toFixed(2) || "0.00"}
          </Title>
          <Text className="text-gray-500">Last 30 days</Text>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card variant="filled" className="rounded-lg shadow-md">
          <Title level={5} className="text-green-500 m-0">
            Net Profit
          </Title>
          <Title level={3} className="my-2">
            ₹{summary?.netProfit?.toFixed(2) || "0.00"}
          </Title>
          <Text className="text-gray-500">After expenses</Text>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card variant="filled" className="rounded-lg shadow-md">
          <Title level={5} className="text-yellow-500 m-0">
            Pending Orders
          </Title>
          <Title level={3} className="my-2">
            {summary?.pendingOrders || 0}
          </Title>
          <Text className="text-gray-500">To be fulfilled</Text>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card variant="filled" className="rounded-lg shadow-md">
          <Title level={5} className="text-red-500 m-0">
            Low Stock
          </Title>
          <Title level={3} className="my-2">
            {summary?.lowStockItems || 0}
          </Title>
          <Text className="text-gray-500">Items need attention</Text>
        </Card>
      </Col>
    </Row>
  );
};

// Sales Chart Component
const SalesChart = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getOption = () => ({
    title: {
      text: "Sales Performance",
      left: "center",
      textStyle: {
        fontWeight: "normal",
      },
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
      axisLabel: {
        rotate: 45,
      },
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
        data: salesData.map((item) => item.amount),
        smooth: true,
        lineStyle: {
          width: 3,
          color: "#1890ff",
        },
        itemStyle: {
          color: "#1890ff",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(24, 144, 255, 0.5)",
              },
              {
                offset: 1,
                color: "rgba(24, 144, 255, 0.1)",
              },
            ],
          },
        },
      },
    ],
  });

  return (
    <Card loading={loading} className="rounded-lg shadow-md">
      <ReactECharts option={getOption()} style={{ height: 400 }} />
    </Card>
  );
};

// Expense Chart Component
const ExpenseChart = () => {
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getOption = () => ({
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
  });

  // Helper function to assign colors to expense categories
  const getCategoryColor = (category) => {
    const colors = {
      ingredients: "#1890ff",
      packaging: "#52c41a",
      utilities: "#faad14",
      rent: "#f5222d",
      salaries: "#722ed1",
      marketing: "#13c2c2",
      equipment: "#eb2f96",
      transportation: "#a0d911",
      other: "#bfbfbf",
    };
    return colors[category] || "#d9d9d9";
  };

  return (
    <Card loading={loading} className="rounded-lg shadow-md">
      <ReactECharts option={getOption()} style={{ height: 400 }} />
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
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={14}>
          <SalesChart />
        </Col>
        <Col xs={24} lg={10}>
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
