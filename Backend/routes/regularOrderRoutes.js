const express = require("express");
const router = express.Router();
const regularOrderController = require("../controllers/regularOrderController");

router.post("/create", async (req, res) => {
  try {
    const order = await regularOrderController.createRegularOrder(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/list", async (req, res) => {
  try {
    const orders = await regularOrderController.getAllRegularOrders();
    res.json(orders);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const order = await regularOrderController.getRegularOrderById(req.params.id);
    res.json(order);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.put("/:id/update", async (req, res) => {
  try {
    const order = await regularOrderController.updateRegularOrder(req.params.id, req.body);
    res.json(order);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.delete("/:id/delete", async (req, res) => {
  try {
    const result = await regularOrderController.deleteRegularOrder(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
