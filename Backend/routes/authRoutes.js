const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/signup", async (req, res) => {
  try {
    const result = await authController.signUp(req.body);
    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const data = await authController.login(req.body);
    res.json({ success: true, message: "Login successful", ...data });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
