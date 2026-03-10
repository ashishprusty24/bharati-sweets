const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard-controller");

router.get("/summary", async (req, res) => {
  try {
    const { period } = req.query;
    const data = await dashboardController.getSummaryData(period);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/sales", async (req, res) => {
  try {
    const { period } = req.query;
    const data = await dashboardController.getSalesData(period);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});


router.get("/expenses", async (req, res) => {
  try {
    const data = await dashboardController.getExpensesData();
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

module.exports = router;
