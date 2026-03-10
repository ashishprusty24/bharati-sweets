const express = require("express");
const router = express.Router();
const ledgerController = require("../controllers/ledgerController");

router.get("/:date", async (req, res) => {
  try {
    const ledger = await ledgerController.getLedgerByDate(req.params.date);
    res.json(ledger);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.post("/:date", async (req, res) => {
  try {
    const ledger = await ledgerController.saveLedger(req.params.date, req.body);
    res.json(ledger);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
