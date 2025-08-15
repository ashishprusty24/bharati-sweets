// routes/expenseRoutes.js
const express = require("express");
const router = express.Router();
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

router.get("/list", async (req, res) => {
  try {
    const expenses = await getExpenses();
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE expense
router.post("/create", async (req, res) => {
  try {
    const expense = await createExpense(req.body);
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE expense
router.put("/:id/update", async (req, res) => {
  try {
    const updated = await updateExpense(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE expense
router.delete("/:id/delete", async (req, res) => {
  try {
    const deleted = await deleteExpense(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
