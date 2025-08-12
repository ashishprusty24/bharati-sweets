// Accounting Controller
const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const RegularOrder = require("../models/RegularOrder");
const EventOrder = require("../models/EventOrder");

const getFinancialSummary = async (startDate, endDate) => {
  try {
    // Fetch expenses
    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate },
    });

    // Fetch regular orders
    const regularOrders = await RegularOrder.find({
      orderDate: { $gte: startDate, $lte: endDate },
    });

    // Fetch event orders
    const eventOrders = await EventOrder.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // ===== 1. Totals =====
    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );

    const regularRevenue = regularOrders.reduce(
      (sum, o) =>
        sum +
        (o.payment?.amount ??
          o.items?.reduce((s, i) => s + (i.total || 0), 0) ??
          0),
      0
    );

    const eventRevenue = eventOrders.reduce(
      (sum, o) =>
        sum +
        (o.totalAmount ??
          o.payments?.reduce((s, p) => s + (p.amount || 0), 0) ??
          0),
      0
    );

    const totalRevenue = regularRevenue + eventRevenue;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin =
      totalRevenue > 0
        ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2))
        : 0;

    // ===== 2. Expense distribution =====
    const expenseDistribution = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
      return acc;
    }, {});

    // ===== 3. Revenue distribution =====
    const revenueDistribution = {
      regular: regularRevenue,
      event: eventRevenue,
    };

    // ===== 4. Profit trend (Weekly) =====
    const profitTrend = [];
    let current = new Date(startDate);

    while (current < endDate) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekExpenses = expenses
        .filter((e) => e.date >= weekStart && e.date <= weekEnd)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const weekRegularRevenue = regularOrders
        .filter((o) => o.orderDate >= weekStart && o.orderDate <= weekEnd)
        .reduce(
          (sum, o) =>
            sum +
            (o.payment?.amount ??
              o.items?.reduce((s, i) => s + (i.total || 0), 0) ??
              0),
          0
        );

      const weekEventRevenue = eventOrders
        .filter((o) => o.createdAt >= weekStart && o.createdAt <= weekEnd)
        .reduce(
          (sum, o) =>
            sum +
            (o.totalAmount ??
              o.payments?.reduce((s, p) => s + (p.amount || 0), 0) ??
              0),
          0
        );

      const weekProfit = weekRegularRevenue + weekEventRevenue - weekExpenses;
      profitTrend.push({
        period: `Week ${profitTrend.length + 1}`,
        profit: weekProfit,
      });

      current.setDate(current.getDate() + 7);
    }

    // ===== 5. Assets (Dummy Example) =====
    // These values should ideally come from DB/Inventory system
    const assets = {
      cash: 125000, // Example static
      inventory: 68500, // Example static
      equipment: 215000, // Example static
    };

    // ===== Final return =====
    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      expenseDistribution,
      revenueDistribution,
      profitTrend,
      assets,
    };
  } catch (error) {
    throw error;
  }
};

// Updated getTransactions for reference
const getTransactions = async (startDate, endDate) => {
  try {
    // Fetch expenses
    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate },
    });

    // Fetch regular orders
    const regularOrders = await RegularOrder.find({
      orderDate: { $gte: startDate, $lte: endDate },
    });

    // Fetch event orders
    const eventOrders = await EventOrder.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Format transactions
    const transactions = [
      // Expenses
      ...expenses.map((exp) => ({
        id: exp._id.toString(),
        date: exp.date,
        description: exp.description,
        type: "expense",
        category: exp.category,
        amount: exp.amount,
      })),

      // Regular Orders
      ...regularOrders.map((order) => ({
        id: order._id.toString(),
        date: order.orderDate,
        description: `Order from ${order.customerName}`,
        type: "revenue",
        category: "regular",
        amount:
          order.payment?.amount ??
          order.items?.reduce((sum, i) => sum + (i.total || 0), 0) ??
          0,
      })),

      // Event Orders
      ...eventOrders.map((order) => ({
        id: order._id.toString(),
        date: order.createdAt,
        description: `${order.purpose} order`,
        type: "revenue",
        category: "event",
        amount:
          order.totalAmount ??
          order.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) ??
          0,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return transactions;
  } catch (error) {
    throw error;
  }
};

// router.get("/report", async (req, res) => {
//   try {
//     // Generate PDF or Excel report
//     // This would be more complex in a real implementation
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=financial-report.pdf"
//     );

//     // Generate PDF using a library like pdfkit
//     // ... PDF generation code ...
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// summary
// {
//   "totalRevenue": 185000,
//   "totalExpenses": 125000,
//   "netProfit": 60000,
//   "profitMargin": 32.43,
//   "expenseDistribution": {
//     "ingredients": 75000,
//     "packaging": 15000,
//     "utilities": 10000,
//     "salaries": 20000,
//     "marketing": 5000
//   },
//   "revenueDistribution": {
//     "regular": 85000,
//     "event": 100000
//   },
//   "profitTrend": [
//     {"period": "Week 1", "profit": 15000},
//     {"period": "Week 2", "profit": 18000},
//     {"period": "Week 3", "profit": 12000},
//     {"period": "Week 4", "profit": 15000}
//   ],
//   "assets": {
//     "cash": 125000,
//     "inventory": 68500,
//     "equipment": 215000
//   },
// }

//transaction

// [
//   {
//     "id": "txn1",
//     "date": "2023-07-15",
//     "description": "Milk purchase",
//     "type": "expense",
//     "category": "ingredients",
//     "amount": 12500
//   },
//   {
//     "id": "txn2",
//     "date": "2023-07-16",
//     "description": "Wedding order payment",
//     "type": "revenue",
//     "category": "event",
//     "amount": 42000
//   },
//   {
//     "id": "txn3",
//     "date": "2023-07-17",
//     "description": "Staff salaries",
//     "type": "expense",
//     "category": "salaries",
//     "amount": 28000
//   }
// ]

module.exports = { getFinancialSummary, getTransactions };
