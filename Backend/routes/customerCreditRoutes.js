const express = require("express");
const router = express.Router();
const customerCreditController = require("../controllers/customerCreditController");

// GET all Bakki entries & summary
router.get("/list", async (req, res) => {
  try {
    const data = await customerCreditController.getAllBakkiEntries();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE standalone Bakki entry
router.post("/create", async (req, res) => {
  try {
    const newEntry = await customerCreditController.createBakkiEntry(req.body);
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// RECORD Bakki payment
router.post("/payment", async (req, res) => {
  try {
    const { id, source, amount, method, date } = req.body;
    const result = await customerCreditController.recordBakkiPayment(id, source, {
      amount,
      method,
      date,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// TOGGLE auto reminder setting
router.put("/toggle-reminder", async (req, res) => {
  try {
    const { id, source, enabled } = req.body;
    const result = await customerCreditController.toggleAutoReminder(id, source, enabled);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// SEND individual WhatsApp reminder
router.post("/send-reminder", async (req, res) => {
  try {
    const { id, source } = req.body;
    const result = await customerCreditController.sendBakkiReminder(id, source);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// TRIGGER weekly auto reminders (manual / cron endpoint)
router.post("/trigger-auto-reminders", async (req, res) => {
  try {
    const result = await customerCreditController.triggerWeeklyAutoReminders();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
