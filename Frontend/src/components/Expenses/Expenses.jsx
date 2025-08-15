// src/pages/expenses/ExpenseManagementPage.js
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Typography,
  Row,
  Col,
  Card,
  Popconfirm,
  Space,
  Tooltip,
  DatePicker,
  Divider,
  Statistic,
  Badge,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DollarOutlined,
  BarChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import moment from "moment";
import { API_BASE_URL } from "../../common/config";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [echartOptions, setEchartOptions] = useState(null);
  const [stats, setStats] = useState({ total: 0, monthly: 0, weekly: 0 });

  // Expense categories
  const expenseCategories = [
    { value: "ingredients", label: "Ingredients", color: "#1890ff" },
    { value: "packaging", label: "Packaging", color: "#52c41a" },
    { value: "utilities", label: "Utilities", color: "#faad14" },
    { value: "rent", label: "Rent", color: "#f5222d" },
    { value: "salaries", label: "Salaries", color: "#722ed1" },
    { value: "marketing", label: "Marketing", color: "#13c2c2" },
    { value: "equipment", label: "Equipment", color: "#eb2f96" },
    { value: "transportation", label: "Transportation", color: "#a0d911" },
    { value: "other", label: "Other Expenses", color: "#bfbfbf" },
  ];

  // Payment methods
  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Credit/Debit Card" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "upi", label: "UPI Payment" },
  ];

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/list`);
      const data = await response.json();

      setExpenses(data); // Assuming data.expenses is the array of expenses
      setFilteredExpenses(data);
      calculateStats(data);
      generateEchartOptions(data);
    } catch (error) {
      message.error("Failed to fetch expenses");
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [searchText, categoryFilter, dateRange, expenses]);

  const filterExpenses = () => {
    let result = [...expenses];

    // Apply search filter
    if (searchText) {
      result = result.filter(
        (expense) =>
          expense.description
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          expense.notes?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter((expense) => expense.category === categoryFilter);
    }

    // Apply date filter
    if (dateRange && dateRange.length === 2) {
      const start = dateRange[0].startOf("day").toDate();
      const end = dateRange[1].endOf("day").toDate();
      result = result.filter((expense) =>
        moment(expense.date).isBetween(moment(start), moment(end), null, "[]")
      );
    }

    setFilteredExpenses(result);
  };

  const calculateStats = (expenses) => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate monthly expenses (last 30 days)
    const thirtyDaysAgo = moment().subtract(30, "days").startOf("day");
    const monthly = expenses
      .filter((expense) => moment(expense.date).isSameOrAfter(thirtyDaysAgo))
      .reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate weekly expenses (last 7 days)
    const sevenDaysAgo = moment().subtract(7, "days").startOf("day");
    const weekly = expenses
      .filter((expense) => moment(expense.date).isSameOrAfter(sevenDaysAgo))
      .reduce((sum, expense) => sum + expense.amount, 0);

    setStats({ total, monthly, weekly });
  };

  const generateEchartOptions = (expenses) => {
    const categoryTotals = {};

    // Initialize all categories to 0
    expenseCategories.forEach((cat) => {
      categoryTotals[cat.value] = 0;
    });

    // Sum amounts by category
    expenses.forEach((expense) => {
      if (categoryTotals[expense.category] !== undefined) {
        categoryTotals[expense.category] += expense.amount;
      }
    });

    // Format data for ECharts
    const pieData = Object.keys(categoryTotals)
      .filter((key) => categoryTotals[key] > 0)
      .map((key) => ({
        name: expenseCategories.find((cat) => cat.value === key)?.label || key,
        value: categoryTotals[key],
        itemStyle: {
          color: expenseCategories.find((cat) => cat.value === key)?.color,
        },
      }));

    const options = {
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: ₹{c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "right",
        data: pieData.map((item) => item.name),
      },
      series: [
        {
          name: "Expense by Category",
          type: "pie",
          radius: "50%",
          center: ["40%", "50%"], // Center the pie chart to the left to make room for legend on right
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };

    setEchartOptions(options);
  };

  const showModal = (expense = null) => {
    if (expense) {
      form.setFieldsValue({
        ...expense,
        date: expense.date ? moment(expense.date) : null,
      });
      setEditingExpense(expense);
    } else {
      form.resetFields();
      setEditingExpense(null);
    }
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const expenseData = {
        ...values,
        date: values.date.toISOString(),
      };

      let response;
      if (editingExpense) {
        // Update existing expense
        response = await fetch(
          `${API_BASE_URL}/expenses/${editingExpense._id}/update`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(expenseData),
          }
        );
      } else {
        // Create new expense
        response = await fetch(`${API_BASE_URL}/expenses/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(expenseData),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to save expense");
      }

      message.success(
        `Expense ${editingExpense ? "updated" : "added"} successfully!`
      );
      fetchExpenses();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(error.message || "Error saving expense");
      console.error("Error saving expense:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      message.success("Expense deleted successfully!");
      fetchExpenses();
    } catch (error) {
      message.error(error.message || "Error deleting expense");
      console.error("Error deleting expense:", error);
    }
  };

  const getCategoryTag = (category) => {
    const categoryInfo = expenseCategories.find(
      (cat) => cat.value === category
    );
    return (
      <Tag color={categoryInfo?.color || "default"}>
        {categoryInfo?.label || category}
      </Tag>
    );
  };

  const getPaymentMethodTag = (method) => {
    const methodInfo = paymentMethods.find((m) => m.value === method);
    return (
      <Tag color={method === "cash" ? "green" : "blue"}>
        {methodInfo?.label || method}
      </Tag>
    );
  };

  const columns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => getCategoryTag(category),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => <Text strong>₹{amount.toFixed(2)}</Text>,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => moment(date).format("YYYY-MM-DD"),
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method) => getPaymentMethodTag(method),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="primary"
              shape="circle"
              icon={<EditOutlined />}
              size="small"
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure to delete this expense?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                danger
                shape="circle"
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          {/* <Title level={4} style={{ margin: 0 }}>
            <DollarOutlined style={{ marginRight: 8 }} />
            Expense Management
          </Title> */}
          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* Statistics Section */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <Card bordered={false} style={{ flex: 1, background: "#f0f5ff" }}>
            <Statistic
              title="Total Expenses"
              value={stats.total}
              precision={2}
              valueStyle={{ color: "#3f8600" }}
              prefix={<DollarOutlined />}
              suffix="₹"
            />
          </Card>
          <Card bordered={false} style={{ flex: 1, background: "#fff7e6" }}>
            <Statistic
              title="Monthly Expenses"
              value={stats.monthly}
              precision={2}
              valueStyle={{ color: "#faad14" }}
              prefix={<DollarOutlined />}
              suffix="₹"
            />
          </Card>
          <Card bordered={false} style={{ flex: 1, background: "#fff1f0" }}>
            <Statistic
              title="Weekly Expenses"
              value={stats.weekly}
              precision={2}
              valueStyle={{ color: "#cf1322" }}
              prefix={<DollarOutlined />}
              suffix="₹"
            />
          </Card>
        </div>

        {/* Expense Distribution Chart */}
        {echartOptions && (
          <Card
            title={
              <div>
                <PieChartOutlined style={{ marginRight: 8 }} />
                Expense Distribution by Category
              </div>
            }
            style={{ marginBottom: 24 }}
          >
            <div style={{ height: 300 }}>
              <ReactECharts
                option={echartOptions}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          </Card>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <Input
            placeholder="Search expenses..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <Select
            placeholder="Filter by category"
            style={{ width: 200 }}
            value={categoryFilter}
            onChange={setCategoryFilter}
          >
            <Option value="all">All Categories</Option>
            {expenseCategories.map((category) => (
              <Option key={category.value} value={category.value}>
                {category.label}
              </Option>
            ))}
          </Select>

          <RangePicker
            placeholder={["Start Date", "End Date"]}
            style={{ width: 250 }}
            onChange={setDateRange}
          />
        </div>

        {/* Expenses Table */}
        <Table
          columns={columns}
          dataSource={filteredExpenses.map((expense) => ({
            ...expense,
            key: expense._id,
          }))}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          summary={(pageData) => {
            const total = pageData.reduce((sum, item) => sum + item.amount, 0);
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>Page Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>₹{total.toFixed(2)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={3} />
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>

      {/* Expense Form Modal */}
      <Modal
        title={editingExpense ? "Edit Expense" : "Add New Expense"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText={editingExpense ? "Update" : "Add"}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            date: moment(),
            paymentMethod: "cash",
          }}
        >
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please enter expense description" },
            ]}
          >
            <Input placeholder="e.g. Milk Purchase" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[
                  { required: true, message: "Please select expense category" },
                ]}
              >
                <Select placeholder="Select category">
                  {expenseCategories.map((category) => (
                    <Option key={category.value} value={category.value}>
                      {category.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount (₹)"
                rules={[
                  { required: true, message: "Please enter expense amount" },
                ]}
              >
                <InputNumber
                  min={0.01}
                  step={0.01}
                  style={{ width: "100%" }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Date"
                rules={[
                  { required: true, message: "Please select expense date" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                rules={[
                  { required: true, message: "Please select payment method" },
                ]}
              >
                <Select placeholder="Select method">
                  {paymentMethods.map((method) => (
                    <Option key={method.value} value={method.value}>
                      {method.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <TextArea
              placeholder="Additional notes about this expense"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpenseManagement;
