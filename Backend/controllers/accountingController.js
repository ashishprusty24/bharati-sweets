const Expense = require("../models/Expense");
const RegularOrder = require("../models/RegularOrder");
const EventOrder = require("../models/EventOrder");

const getFinancialSummary = (startDate, endDate) => {
  return new Promise(async (resolve, reject) => {
    try {
      const [expenses, regularOrders, eventOrders] = await Promise.all([
        Expense.find({ date: { $gte: startDate, $lte: endDate } }),
        RegularOrder.find({ orderDate: { $gte: startDate, $lte: endDate } }),
        EventOrder.find({ createdAt: { $gte: startDate, $lte: endDate } }),
      ]);

      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const regularRevenue = regularOrders.reduce(
        (sum, o) => sum + (o.payment?.amount ?? o.items?.reduce((s, i) => s + (i.total || 0), 0) ?? 0),
        0
      );
      const eventRevenue = eventOrders.reduce(
        (sum, o) => sum + (o.totalAmount ?? o.payments?.reduce((s, p) => s + (p.amount || 0), 0) ?? 0),
        0
      );

      const totalRevenue = regularRevenue + eventRevenue;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;

      const expenseDistribution = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
        return acc;
      }, {});

      // Weekly trend
      const profitTrend = [];
      let current = new Date(startDate);
      while (current < endDate) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekExpenses = expenses.filter(e => e.date >= weekStart && e.date <= weekEnd).reduce((sum, e) => sum + (e.amount || 0), 0);
        const weekRegularRevenue = regularOrders.filter(o => o.orderDate >= weekStart && o.orderDate <= weekEnd).reduce((sum, o) => sum + (o.payment?.amount ?? o.items?.reduce((s, i) => s + (i.total || 0), 0) ?? 0), 0);
        const weekEventRevenue = eventOrders.filter(o => o.createdAt >= weekStart && o.createdAt <= weekEnd).reduce((sum, o) => sum + (o.totalAmount ?? o.payments?.reduce((s, p) => s + (p.amount || 0), 0) ?? 0), 0);

        profitTrend.push({ period: `Week ${profitTrend.length + 1}`, profit: weekRegularRevenue + weekEventRevenue - weekExpenses });
        current.setDate(current.getDate() + 7);
      }

      resolve({
        totalRevenue, totalExpenses, netProfit, profitMargin, expenseDistribution,
        revenueDistribution: { regular: regularRevenue, event: eventRevenue },
        profitTrend, assets: { cash: 125000, inventory: 68500, equipment: 215000 },
      });
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const getTransactions = (startDate, endDate) => {
  return new Promise(async (resolve, reject) => {
    try {
      const [expenses, regularOrders, eventOrders] = await Promise.all([
        Expense.find({ date: { $gte: startDate, $lte: endDate } }),
        RegularOrder.find({ orderDate: { $gte: startDate, $lte: endDate } }),
        EventOrder.find({ createdAt: { $gte: startDate, $lte: endDate } }),
      ]);

      const transactions = [
        ...expenses.map(e => ({ id: e._id, date: e.date, description: e.description, type: "expense", category: e.category, amount: e.amount })),
        ...regularOrders.map(o => ({ id: o._id, date: o.orderDate, description: `Order from ${o.customerName}`, type: "revenue", category: "regular", amount: o.payment?.amount ?? 0 })),
        ...eventOrders.map(o => ({ id: o._id, date: o.createdAt, description: `${o.purpose} order`, type: "revenue", category: "event", amount: o.totalAmount ?? 0 })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      resolve(transactions);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

module.exports = { getFinancialSummary, getTransactions };
