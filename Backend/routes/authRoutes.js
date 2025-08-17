const express = require("express");
const { signUp, login } = require("../controllers/authController");
const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const result = await signUp(req.body);
    res.json(result);
  } catch (error) {
    console.error("Error in signup route:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (error) {
    console.error("Error in login route:", error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
