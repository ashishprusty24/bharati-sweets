const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");

router.get("/list", async (req, res) => {
  try {
    const inventory = await inventoryController.getAllInventory();
    res.json(inventory);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.post("/create", async (req, res) => {
  try {
    const newItem = await inventoryController.createInventoryItem(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.put("/:id/update", async (req, res) => {
  try {
    const updatedItem = await inventoryController.updateInventoryItem(req.params.id, req.body);
    res.json(updatedItem);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.delete("/:id/delete", async (req, res) => {
  try {
    const result = await inventoryController.deleteInventoryItem(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
