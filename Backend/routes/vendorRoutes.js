// routes/vendorRoutes.js
const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");

// Get all vendors
router.get("/list", async (req, res) => {
  try {
    const vendors = await vendorController.getAllVendors();
    res.json(vendors);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Create new vendor
router.post("/create", async (req, res) => {
  try {
    const newVendor = await vendorController.createVendor(req.body);
    res.status(201).json(newVendor);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Update vendor
router.put("/:id/update", async (req, res) => {
  try {
    const updatedVendor = await vendorController.updateVendor(
      req.params.id,
      req.body
    );
    res.json(updatedVendor);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Delete vendor
router.delete("/:id/delete", async (req, res) => {
  try {
    const result = await vendorController.deleteVendor(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Make payment to vendor
router.post("/:id/pay", async (req, res) => {
  try {
    const updatedVendor = await vendorController.makePayment(
      req.params.id,
      req.body
    );
    res.json(updatedVendor);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
