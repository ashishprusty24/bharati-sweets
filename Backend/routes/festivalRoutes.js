const express = require("express");
const router = express.Router();
const festivalController = require("../controllers/festivalController");

// GET /api/festivals/list — return unique tagged festivals + presets
router.get("/list", async (req, res) => {
  try {
    const festivals = await festivalController.getFestivalList();
    res.json(festivals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/festivals/analytics?festival=Rakhi%20Purnima — return YoY sales & sweet production comparison
router.get("/analytics", async (req, res) => {
  try {
    const festivalName = req.query.festival || "";
    const analytics = await festivalController.getFestivalAnalytics(festivalName);
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
