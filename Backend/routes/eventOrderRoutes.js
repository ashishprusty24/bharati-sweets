const express = require("express");
const router = express.Router();
const eventOrderController = require("../controllers/eventOrderController");

router.post("/create", async (req, res) => {
  try {
    const order = await eventOrderController.createEventOrder(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/list", async (req, res) => {
  try {
    const orders = await eventOrderController.getAllEventOrders();
    res.json(orders);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/preparation-report", async (req, res) => {
  try {
    const report = await eventOrderController.getPreparationReport(req.query.date);
    res.json(report);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── TEST WHATSAPP (must be before /:id) ──────────────────────
// GET /event-orders/test-whatsapp?phone=91XXXXXXXXXX
router.get("/test-whatsapp", async (req, res) => {
  try {
    const { sendWhatsApp } = require("../utils/whatsappService");
    const phone = req.query.phone;
    if (!phone) return res.status(400).json({ message: "Phone number required (?phone=91XXXXXXXXXX)" });
    
    const result = await sendWhatsApp(phone, "✅ Test message from Bharati Sweets WhatsApp API. If you received this, the Meta API integration is working correctly!");
    res.json({ 
      success: result, 
      phone,
      tokenPresent: !!process.env.WHATSAPP_API_TOKEN,
      phoneNumberIdPresent: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const order = await eventOrderController.getEventOrderById(req.params.id);
    res.json(order);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.post("/:id/payments", async (req, res) => {
  try {
    const order = await eventOrderController.addPayment(req.params.id, req.body);
    res.json(order);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const newStatus = req.body.status || req.body.orderStatus;
    const order = await eventOrderController.updateStatus(req.params.id, newStatus);
    res.json(order);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.put("/:id/update", async (req, res) => {
  try {
    const order = await eventOrderController.updateEventOrder(req.params.id, req.body);
    res.json(order);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.delete("/:id/delete", async (req, res) => {
  try {
    const result = await eventOrderController.deleteEventOrder(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
