import React, { useState, useMemo } from "react";
import { Card, Input, Button, Select, DatePicker, message } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
import useFetch from "../../hooks/useFetch";
import api from "../../services/api";
import ExpenseStats from "./components/ExpenseStats";
import ExpenseChart from "./components/ExpenseChart";
import ExpenseTable from "./components/ExpenseTable";
import ExpenseModal from "./components/ExpenseModal";

const { Option } = Select;
const { RangePicker } = DatePicker;

const ExpensesPage = () => {
  const { data: expenses, loading, refetch } = useFetch("/expenses/list");
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [dateRange, setDateRange] = useState([dayjs().startOf("day"), dayjs().endOf("day")]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

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

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Credit/Debit Card" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "upi", label: "UPI Payment" },
  ];

  const uniqueVendors = useMemo(() => {
    if (!expenses) return [];
    const vendors = expenses.map(e => e.vendor).filter(Boolean);
    return [...new Set(vendors)].sort();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    let result = [...expenses];

    if (searchText) {
      result = result.filter(exp => 
        exp.description.toLowerCase().includes(searchText.toLowerCase()) ||
        exp.notes?.toLowerCase().includes(searchText.toLowerCase()) ||
        exp.vendor?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter(exp => exp.category === categoryFilter);
    }
    
    if (vendorFilter !== "all") {
      result = result.filter(exp => exp.vendor === vendorFilter);
    }

    if (dateRange && dateRange.length === 2) {
      const start = dateRange[0].startOf("day");
      const end = dateRange[1].endOf("day");
      result = result.filter(exp => dayjs(exp.date).isBetween(start, end, null, "[]"));
    }

    return result;
  }, [expenses, searchText, categoryFilter, vendorFilter, dateRange]);

  const stats = useMemo(() => {
    if (!expenses) return { total: 0, monthly: 0, weekly: 0 };
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const thirtyDaysAgo = dayjs().subtract(30, "days").startOf("day");
    const sevenDaysAgo = dayjs().subtract(7, "days").startOf("day");
    
    const monthly = expenses
      .filter(exp => dayjs(exp.date).isSameOrAfter(thirtyDaysAgo))
      .reduce((sum, exp) => sum + exp.amount, 0);
      
    const weekly = expenses
      .filter(exp => dayjs(exp.date).isSameOrAfter(sevenDaysAgo))
      .reduce((sum, exp) => sum + exp.amount, 0);

    return { total, monthly, weekly };
  }, [expenses]);

  const handleAddEdit = (expense = null) => {
    setEditingExpense(expense);
    setIsModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense._id}/update`, values);
        message.success("Expense updated successfully");
      } else {
        await api.post("/expenses/create", values);
        message.success("Expense added successfully");
      }
      setIsModalVisible(false);
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}/delete`);
      message.success("Expense deleted successfully");
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <ExpenseStats stats={stats} />
      
      <ExpenseChart data={filteredExpenses} categories={expenseCategories} />

      <Card>
        <div style={{ display: "flex", gap: 16, marginBottom: 24, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Input
              placeholder="Search expenses..."
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              placeholder="Filter by category"
              style={{ width: 180 }}
              value={categoryFilter}
              onChange={setCategoryFilter}
            >
              <Option value="all">All Categories</Option>
              {expenseCategories.map(cat => <Option key={cat.value} value={cat.value}>{cat.label}</Option>)}
            </Select>
            <Select
              placeholder="Filter by vendor"
              style={{ width: 180 }}
              value={vendorFilter}
              onChange={setVendorFilter}
              showSearch
            >
              <Option value="all">All Vendors</Option>
              {uniqueVendors.map(v => <Option key={v} value={v}>{v}</Option>)}
            </Select>
            <RangePicker value={dateRange} onChange={setDateRange} format="MMM DD, YYYY" />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddEdit()}>
            Add Expense
          </Button>
        </div>

        <ExpenseTable
          data={filteredExpenses}
          loading={loading}
          categories={expenseCategories}
          onEdit={handleAddEdit}
          onDelete={handleDelete}
        />
      </Card>

      <ExpenseModal
        visible={isModalVisible}
        item={editingExpense}
        categories={expenseCategories}
        paymentMethods={paymentMethods}
        loading={loading}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSave}
      />
    </div>
  );
};

export default ExpensesPage;
