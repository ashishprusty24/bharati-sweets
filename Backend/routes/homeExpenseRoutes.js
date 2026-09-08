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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/home-expenses/migrate-cc-to-expenses
// ONE-TIME migration: Syncs existing CreditCard transactions and CCLoan
// withdrawals to HomeExpense so they appear in the Expenses page.
// Only creates entries that don't already exist.
// Call this once via browser: http://localhost:5000/api/home-expenses/migrate-cc-to-expenses
// ─────────────────────────────────────────────────────────────────────────────
router.get("/migrate-cc-to-expenses", async (req, res) => {
  try {
    const CreditCard = require("../models/CreditCard");
    const CCLoan = require("../models/CCLoan");
    const HomeExpense = require("../models/HomeExpense");
    const dayjs = require("dayjs");

    let ccCreated = 0;
    let ccSkipped = 0;
    let loanCreated = 0;
    let loanSkipped = 0;
    const details = [];

    // ── 1. Migrate Credit Card transactions ──
    const cards = await CreditCard.find({});
    for (const card of cards) {
      for (const txn of card.transactions) {
        const txDate = txn.date ? new Date(txn.date) : new Date();
        const amount = Number(txn.amount) || 0;
        const desc = txn.description || "Credit Card Transaction";

        // Check if HomeExpense already exists for this CC transaction
        const startOfDay = dayjs(txDate).startOf("day").toDate();
        const endOfDay = dayjs(txDate).endOf("day").toDate();

        const existing = await HomeExpense.findOne({
          creditCardId: card._id,
          amount: amount,
          date: { $gte: startOfDay, $lte: endOfDay },
          $or: [
            { description: desc },
            { description: `CC: ${desc}` },
            { description: new RegExp(desc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          ],
        });

        if (existing) {
          ccSkipped++;
          continue;
        }

        // Also check by just amount + date + creditCardId (looser match)
        const looseMatch = await HomeExpense.findOne({
          creditCardId: card._id,
          amount: amount,
          date: { $gte: startOfDay, $lte: endOfDay },
        });

        if (looseMatch) {
          ccSkipped++;
          continue;
        }

        // Create the HomeExpense entry
        const formattedDesc = desc.startsWith("CC:") ? desc : `CC: ${desc}`;
        const category = txn.category === "vendor_payment" ? "supplier_payment" : (txn.category || "other");

        await HomeExpense.create({
          date: txDate,
          description: formattedDesc,
          amount: amount,
          category: category,
          paymentSource: "credit_card",
          creditCardId: card._id,
          sourceTag: "direct",
          notes: `Migrated from Credit Card: ${card.cardName} (${card.last4Digits})`,
        });

        ccCreated++;
        details.push({
          type: "credit_card",
          card: `${card.cardName} (${card.last4Digits})`,
          date: dayjs(txDate).format("DD MMM YYYY"),
          description: formattedDesc,
          amount: amount,
          category: category,
        });
      }
    }

    // ── 2. Migrate CC Loan withdrawals ──
    const loans = await CCLoan.find({});
    for (const loan of loans) {
      for (const wd of loan.withdrawals) {
        const txDate = wd.date ? new Date(wd.date) : new Date();
        const amount = Number(wd.amount) || 0;
        const desc = wd.description || "CC Loan Withdrawal";

        const startOfDay = dayjs(txDate).startOf("day").toDate();
        const endOfDay = dayjs(txDate).endOf("day").toDate();

        // Check if HomeExpense already exists
        const existing = await HomeExpense.findOne({
          ccLoanId: loan._id,
          amount: amount,
          date: { $gte: startOfDay, $lte: endOfDay },
        });

        if (existing) {
          loanSkipped++;
          continue;
        }

        const formattedDesc = desc.toLowerCase().startsWith("cc loan")
          ? desc
          : `CC Loan: ${desc}`;

        await HomeExpense.create({
          date: txDate,
          description: formattedDesc,
          amount: amount,
          category: "cc_loan",
          paymentSource: "cc_loan",
          ccLoanId: loan._id,
          sourceTag: "direct",
          notes: `Migrated from CC Loan: ${loan.accountName} (${loan.bankName})`,
        });

        loanCreated++;
        details.push({
          type: "cc_loan",
          account: `${loan.accountName} (${loan.bankName})`,
          date: dayjs(txDate).format("DD MMM YYYY"),
          description: formattedDesc,
          amount: amount,
        });
      }
    }

    res.json({
      success: true,
      message: `Migration complete! CC: ${ccCreated} created, ${ccSkipped} already existed. CC Loan: ${loanCreated} created, ${loanSkipped} already existed.`,
      creditCard: { created: ccCreated, skipped: ccSkipped },
      ccLoan: { created: loanCreated, skipped: loanSkipped },
      totalCreated: ccCreated + loanCreated,
      details,
    });
  } catch (err) {
    console.error("CC migration error:", err);
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
