const express = require("express");
const router = express.Router();
const eventOrderController = require("../controllers/eventOrderController");

// Create new event order
router.post("/create", async (req, res) => {
  try {
    const newOrder = await eventOrderController.createEventOrder(req.body);
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Get all event orders
router.get("/list", async (req, res) => {
  try {
    const orders = await eventOrderController.getAllEventOrders();
    res.json(orders);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Get single event order by ID
router.get("/:id/list", async (req, res) => {
  try {
    const order = await eventOrderController.getEventOrderById(req.params.id);
    res.json(order);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Update event order details
router.put("/:id/update", async (req, res) => {
  try {
    const updatedOrder = await eventOrderController.updateEventOrder(
      req.params.id,
      req.body
    );
    res.json(updatedOrder);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Delete event order
router.delete("/:id/delete", async (req, res) => {
  try {
    const result = await eventOrderController.deleteEventOrder(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Add payment to event order
router.post("/:id/payments", async (req, res) => {
  try {
    const updatedOrder = await eventOrderController.addPayment(
      req.params.id,
      req.body
    );
    res.status(201).json(updatedOrder);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Update order status
router.patch("/:id/status", async (req, res) => {
  try {
    const updatedOrder = await eventOrderController.updateStatus(
      req.params.id,
      req.body.status
    );
    res.json(updatedOrder);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/preparation-report", async (req, res) => {
  try {
    const { date } = req.query;

    const report = await eventOrderController.getPreparationReport(date);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
