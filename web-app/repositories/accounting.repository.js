import connectDB from "../database/mongodb";
import Expense from "../models/Expense";
import RegularOrder from "../models/RegularOrder";
import EventOrder from "../models/EventOrder";

export const getFinancialSummary = async (startDate, endDate) => {
  await connectDB();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const [expenses, regularOrders, eventOrders] = await Promise.all([
    Expense.find({ date: { $gte: start, $lte: end } }).lean(),
    RegularOrder.find({ orderDate: { $gte: start, $lte: end } }).lean(),
    EventOrder.find({ createdAt: { $gte: start, $lte: end } }).lean(),
  ]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const regularRevenue = regularOrders.reduce(
    (sum, o) => sum + (o.payment?.amount ?? o.totalAmount ?? 0),
    0
  );
  const eventRevenue = eventOrders.reduce(
    (sum, o) => sum + (o.totalAmount ?? o.advancePaid ?? 0),
    0
  );

  const totalRevenue = regularRevenue + eventRevenue;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;

  const expenseDistribution = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
    return acc;
  }, {});

  const profitTrend = [];
  let current = new Date(start);
  while (current < end) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekExpenses = expenses.filter(e => e.date >= weekStart && e.date <= weekEnd).reduce((sum, e) => sum + (e.amount || 0), 0);
    const weekRegularRevenue = regularOrders.filter(o => o.orderDate >= weekStart && o.orderDate <= weekEnd).reduce((sum, o) => sum + (o.payment?.amount ?? 0), 0);
    const weekEventRevenue = eventOrders.filter(o => o.createdAt >= weekStart && o.createdAt <= weekEnd).reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

    profitTrend.push({ period: `Week ${profitTrend.length + 1}`, profit: weekRegularRevenue + weekEventRevenue - weekExpenses });
    current.setDate(current.getDate() + 7);
  }

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    expenseDistribution,
    revenueDistribution: { regular: regularRevenue, event: eventRevenue },
    profitTrend,
    assets: { cash: 125000, inventory: 68500, equipment: 215000 },
  };
};

export const getTransactions = async (startDate, endDate) => {
  await connectDB();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const [expenses, regularOrders, eventOrders] = await Promise.all([
    Expense.find({ date: { $gte: start, $lte: end } }).lean(),
    RegularOrder.find({ orderDate: { $gte: start, $lte: end } }).lean(),
    EventOrder.find({ createdAt: { $gte: start, $lte: end } }).lean(),
  ]);

  return [
    ...expenses.map(e => ({ id: e._id.toString(), date: e.date, description: e.description, type: "expense", category: e.category, amount: e.amount })),
    ...regularOrders.map(o => ({ id: o._id.toString(), date: o.orderDate, description: `Order from ${o.customerName}`, type: "revenue", category: "regular", amount: o.payment?.amount ?? o.totalAmount ?? 0 })),
    ...eventOrders.map(o => ({ id: o._id.toString(), date: o.createdAt, description: `${o.purpose || 'Event'} order`, type: "revenue", category: "event", amount: o.totalAmount ?? 0 })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
};
