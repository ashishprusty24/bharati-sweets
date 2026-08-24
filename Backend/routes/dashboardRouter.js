const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard-controller");

router.get("/summary", async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const data = await dashboardController.getSummaryData(period, startDate, endDate);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/sales", async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const data = await dashboardController.getSalesData(period, startDate, endDate);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});


router.get("/expenses", async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const data = await dashboardController.getExpensesData(period, startDate, endDate);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/popular-products", async (req, res) => {
  try {
    const data = await dashboardController.getPopularProducts();
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/pending-orders", async (req, res) => {
  try {
    const data = await dashboardController.getPendingOrders();
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/upcoming-reminders", async (req, res) => {
  try {
    const data = await dashboardController.getUpcomingReminders();
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/financial-health", async (req, res) => {
  try {
    const data = await dashboardController.getFinancialHealthData();
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
