const express = require("express");
const router = express.Router();
const accountingController = require("../controllers/accountingController");

router.get("/summary", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await accountingController.getFinancialSummary(
      new Date(startDate || "2023-01-01"),
      new Date(endDate || new Date())
    );
    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const transactions = await accountingController.getTransactions(
      new Date(startDate || "2023-01-01"),
      new Date(endDate || new Date())
    );
    res.json(transactions);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
