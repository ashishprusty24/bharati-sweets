// dashboard.routes.js

const express = require("express");
const router = express.Router();
const {
  getSummaryData,
  getSalesData,
  getExpensesData,
  getPopularProducts,
  getPendingOrders,
} = require("../controllers/dashboard-controller");

// GET /api/dashboard/summary
router.get("/summary", async (req, res) => {
  try {
    const summaryData = await getSummaryData();
    res.json(summaryData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching summary data" });
  }
});

// GET /api/dashboard/sales
router.get("/sales", async (req, res) => {
  try {
    const salesData = await getSalesData();
    res.json(salesData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sales data" });
  }
});

// GET /api/dashboard/expenses
router.get("/expenses", async (req, res) => {
  try {
    const expensesData = await getExpensesData();
    res.json(expensesData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching expense data" });
  }
});

// GET /api/dashboard/popular-products
router.get("/popular-products", async (req, res) => {
  try {
    const popularProducts = await getPopularProducts();
    res.json(popularProducts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching popular products" });
  }
});

// GET /api/dashboard/pending-orders
router.get("/pending-orders", async (req, res) => {
  try {
    const pendingOrders = await getPendingOrders();
    res.json(pendingOrders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending orders" });
  }
});

module.exports = router;
