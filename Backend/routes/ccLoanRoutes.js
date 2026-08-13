const express = require("express");
const router = express.Router();
const ccLoanController = require("../controllers/ccLoanController");

// GET /api/cc-loans — list all accounts
router.get("/", async (req, res) => {
  try {
    const accounts = await ccLoanController.getAllAccounts();
    res.json(accounts);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// GET /api/cc-loans/summary — aggregated summary
router.get("/summary", async (req, res) => {
  try {
    const summary = await ccLoanController.getAccountSummary();
    res.json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// GET /api/cc-loans/:id — get specific account
router.get("/:id", async (req, res) => {
  try {
    const account = await ccLoanController.getAccountById(req.params.id);
    res.json(account);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// POST /api/cc-loans — create new account
router.post("/", async (req, res) => {
  try {
    const account = await ccLoanController.createAccount(req.body);
    res.status(201).json(account);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// PUT /api/cc-loans/:id — update account
router.put("/:id", async (req, res) => {
  try {
    const account = await ccLoanController.updateAccount(req.params.id, req.body);
    res.json(account);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// DELETE /api/cc-loans/:id — delete account
router.delete("/:id", async (req, res) => {
  try {
    const result = await ccLoanController.deleteAccount(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// POST /api/cc-loans/:id/withdrawals — add withdrawal
router.post("/:id/withdrawals", async (req, res) => {
  try {
    const account = await ccLoanController.addWithdrawal(req.params.id, req.body);
    res.status(201).json(account);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// DELETE /api/cc-loans/:id/withdrawals/:wId — delete withdrawal
router.delete("/:id/withdrawals/:wId", async (req, res) => {
  try {
    const account = await ccLoanController.deleteWithdrawal(req.params.id, req.params.wId);
    res.json(account);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// POST /api/cc-loans/:id/repayments — add repayment
router.post("/:id/repayments", async (req, res) => {
  try {
    const account = await ccLoanController.addRepayment(req.params.id, req.body);
    res.status(201).json(account);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
