const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");

router.get("/list", async (req, res) => {
  try {
    const staff = await staffController.getAllStaff();
    res.json(staff);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.post("/create", async (req, res) => {
  try {
    const newStaff = await staffController.createStaff(req.body);
    res.status(201).json(newStaff);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
