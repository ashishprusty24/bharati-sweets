const express = require("express");
const router = express.Router();
const homeExpenseController = require("../controllers/homeExpenseController");

// GET /api/home-expenses — list with optional filters
router.get("/", async (req, res) => {
  try {
    const expenses = await homeExpenseController.getHomeExpenses(req.query);
    res.json(expenses);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// GET /api/home-expenses/summary — monthly summary
router.get("/summary", async (req, res) => {
  try {
    const summary = await homeExpenseController.getHomeExpenseSummary(req.query);
    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// POST /api/home-expenses — create
router.post("/", async (req, res) => {
  try {
    const expense = await homeExpenseController.createHomeExpense(req.body);
    res.status(201).json(expense);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// PUT /api/home-expenses/:id — update
router.put("/:id", async (req, res) => {
  try {
    const expense = await homeExpenseController.updateHomeExpense(req.params.id, req.body);
    res.json(expense);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// DELETE /api/home-expenses/:id — delete
router.delete("/:id", async (req, res) => {
  try {
    const result = await homeExpenseController.deleteHomeExpense(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
