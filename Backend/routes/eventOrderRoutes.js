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
    const order = await eventOrderController.updateStatus(req.params.id, req.body.status);
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
