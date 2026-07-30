const express = require("express");
const router = express.Router();
const creditCardController = require("../controllers/creditCardController");

// --- Card CRUD ---

// GET /api/credit-cards — list all cards
router.get("/", async (req, res) => {
  try {
    const cards = await creditCardController.getAllCards();
    res.json(cards);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// GET /api/credit-cards/summary — summary of all cards
router.get("/summary", async (req, res) => {
  try {
    const summary = await creditCardController.getCardSummary();
    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// GET /api/credit-cards/transactions — all transactions across cards
router.get("/transactions", async (req, res) => {
  try {
    const txns = await creditCardController.getAllTransactions(req.query);
    res.json(txns);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// GET /api/credit-cards/:id — single card details
router.get("/:id", async (req, res) => {
  try {
    const card = await creditCardController.getCardById(req.params.id);
    res.json(card);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// POST /api/credit-cards — create a new card
router.post("/", async (req, res) => {
  try {
    const newCard = await creditCardController.createCard(req.body);
    res.status(201).json(newCard);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// PUT /api/credit-cards/:id — update card details
router.put("/:id", async (req, res) => {
  try {
    const card = await creditCardController.updateCard(req.params.id, req.body);
    res.json(card);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// DELETE /api/credit-cards/:id — delete card
router.delete("/:id", async (req, res) => {
  try {
    const result = await creditCardController.deleteCard(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// --- Transaction endpoints ---

// POST /api/credit-cards/:id/transactions — add transaction to a card
router.post("/:id/transactions", async (req, res) => {
  try {
    const card = await creditCardController.addTransaction(req.params.id, req.body);
    res.status(201).json(card);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// DELETE /api/credit-cards/:id/transactions/:txnId — delete a transaction
router.delete("/:id/transactions/:txnId", async (req, res) => {
  try {
    const card = await creditCardController.deleteTransaction(req.params.id, req.params.txnId);
    res.json(card);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// --- Bill Payment endpoints ---

// POST /api/credit-cards/:id/bill-payments — record a bill payment
router.post("/:id/bill-payments", async (req, res) => {
  try {
    const card = await creditCardController.addBillPayment(req.params.id, req.body);
    res.status(201).json(card);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
