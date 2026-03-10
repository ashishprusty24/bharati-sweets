const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");

router.get("/list", async (req, res) => {
  try {
    const expenses = await expenseController.getExpenses();
    res.json(expenses);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.post("/create", async (req, res) => {
  try {
    const newExpense = await expenseController.createExpense(req.body);
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.put("/:id/update", async (req, res) => {
  try {
    const updatedExpense = await expenseController.updateExpense(req.params.id, req.body);
    res.json(updatedExpense);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.delete("/:id/delete", async (req, res) => {
  try {
    const result = await expenseController.deleteExpense(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
