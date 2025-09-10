// dashboard.controller.js

const EventOrder = require("../models/EventOrder");
const RegularOrder = require("../models/RegularOrder");
const Expense = require("../models/Expense");
const Inventory = require("../models/Inventory");

/**
 * Retrieves and calculates all summary data for the dashboard.
 * @returns {Promise<object>} A promise that resolves with an object containing total sales, expenses, profit, pending orders, and low-stock items.
 */
const getSummaryData = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Calculate total sales (from both event and regular orders)
      const eventOrders = await EventOrder.find({ orderStatus: "delivered" });
      const regularOrders = await RegularOrder.find();

      const eventSales = eventOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );
      const regularSales = regularOrders.reduce(
        (sum, order) => sum + order.payment.amount,
        0
      );
      const totalSales = eventSales + regularSales;

      // Calculate total expenses
      const expenses = await Expense.find();
      const totalExpenses = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      // Calculate net profit
      const netProfit = totalSales - totalExpenses;

      // Count pending orders
      const pendingOrders = await EventOrder.countDocuments({
        orderStatus: "pending",
      });

      // Count low stock items
      const lowStockItems = await Inventory.countDocuments({
        status: "low-stock",
      });

      resolve({
        totalSales,
        totalExpenses,
        netProfit,
        pendingOrders,
        lowStockItems,
      });
    } catch (error) {
      console.log(error);

      reject(error);
    }
  });
};

/**
 * Retrieves sales data aggregated by day for the last 30 days.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of sales data objects.
 */
const getSalesData = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get sales data for last 30 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const eventOrders = await EventOrder.find({
        orderStatus: "delivered",
        deliveryDate: { $gte: startDate },
      });

      const regularOrders = await RegularOrder.find({
        orderDate: { $gte: startDate },
      });

      // Aggregate sales by day
      const salesByDay = {};

      eventOrders.forEach((order) => {
        const date = order.deliveryDate.toISOString().split("T")[0];
        salesByDay[date] = (salesByDay[date] || 0) + order.totalAmount;
      });

      regularOrders.forEach((order) => {
        const date = order.orderDate.toISOString().split("T")[0];
        salesByDay[date] = (salesByDay[date] || 0) + order.payment.amount;
      });

      // Format for chart
      const salesData = Object.entries(salesByDay)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      resolve(salesData);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Retrieves expenses aggregated by category.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of expense data objects.
 */
const getExpensesData = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const expenses = await Expense.aggregate([
        {
          $group: {
            _id: "$category",
            amount: { $sum: "$amount" },
          },
        },
        {
          $project: {
            category: "$_id",
            amount: 1,
            _id: 0,
          },
        },
      ]);

      resolve(expenses);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Retrieves the top 5 most popular products by quantity sold.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of product data objects.
 */
const getPopularProducts = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Aggregate products from event and regular orders
      const eventProducts = await EventOrder.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.itemId",
            name: { $first: "$items.name" },
            quantitySold: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
          },
        },
      ]);

      const regularProducts = await RegularOrder.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.itemId",
            name: { $first: "$items.name" },
            quantitySold: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
          },
        },
      ]);

      // Combine and sum results
      const allProducts = [...eventProducts, ...regularProducts];
      const productMap = new Map();

      allProducts.forEach((product) => {
        if (productMap.has(product._id.toString())) {
          const existing = productMap.get(product._id.toString());
          existing.quantitySold += product.quantitySold;
          existing.revenue += product.revenue;
        } else {
          productMap.set(product._id.toString(), {
            ...product,
            _id: product._id.toString(),
          });
        }
      });

      const products = Array.from(productMap.values())
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 5);

      // Add category information
      const inventoryItems = await Inventory.find({
        _id: { $in: products.map((p) => p._id) },
      });

      const productsWithCategory = products.map((product) => {
        const item = inventoryItems.find(
          (i) => i._id.toString() === product._id
        );
        return {
          ...product,
          category: item?.category || "Unknown",
          unit: item?.unit,
        };
      });

      resolve(productsWithCategory);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Retrieves the top 5 most recent pending orders.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of pending order documents.
 */
const getPendingOrders = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const orders = await EventOrder.find({ orderStatus: "pending" })
        .sort({ deliveryDate: 1 })
        .limit(5);

      resolve(orders);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  getSummaryData,
  getSalesData,
  getExpensesData,
  getPopularProducts,
  getPendingOrders,
};
