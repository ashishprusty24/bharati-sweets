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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/home-expenses/cleanup-ledger-sync
// ONE-TIME migration: scans all DailyLedger items and marks any matching
// HomeExpense records as sourceTag: "daily_ledger" so they are hidden from
// the Home Expenses page.
// Call this once via browser: http://localhost:5000/api/home-expenses/cleanup-ledger-sync
// ─────────────────────────────────────────────────────────────────────────────
router.get("/cleanup-ledger-sync", async (req, res) => {
  try {
    const DailyLedger = require("../models/DailyLedger");
    const HomeExpense = require("../models/HomeExpense");
    const dayjs = require("dayjs");

    const ledgers = await DailyLedger.find({});
    let markedCount = 0;
    let alreadyTaggedCount = 0;
    const details = [];

    for (const ledger of ledgers) {
      const targetDate = dayjs(ledger.date).startOf("day").toDate();
      const endOfDay = dayjs(ledger.date).endOf("day").toDate();
      const items = ledger.items || [];

      for (const item of items) {
        if (!item.description || !item.amount) continue;

        const escapedName = item.description.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // Find HomeExpense records on the same date with matching description & amount
        const matchingExpenses = await HomeExpense.find({
          date: { $gte: targetDate, $lte: endOfDay },
          description: new RegExp("^" + escapedName + "$", "i"),
          amount: Number(item.amount),
        });

        for (const exp of matchingExpenses) {
          if (exp.sourceTag === "daily_ledger") {
            alreadyTaggedCount++;
          } else {
            await HomeExpense.findByIdAndUpdate(exp._id, {
              sourceTag: "daily_ledger",
              ledgerItemId: exp.ledgerItemId || String(item._id),
            });
            markedCount++;
            details.push({
              date: dayjs(ledger.date).format("DD MMM YYYY"),
              description: exp.description,
              amount: exp.amount,
              previousTag: exp.sourceTag || "direct",
            });
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Cleanup complete. ${markedCount} records marked as daily_ledger. ${alreadyTaggedCount} were already tagged.`,
      markedCount,
      alreadyTaggedCount,
      details,
    });
  } catch (err) {
    console.error("Cleanup error:", err);
    res.status(500).json({ success: false, message: err.message });
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
