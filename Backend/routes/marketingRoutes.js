const express = require("express");
const router = express.Router();
const marketingController = require("../controllers/marketingController");

// Templates
router.get("/templates", marketingController.getTemplates);
router.post("/templates", marketingController.createTemplate);

// Stats
router.get("/stats", marketingController.getStats);

// Campaigns
router.get("/campaigns", marketingController.getCampaigns);
router.post("/campaigns", marketingController.createCampaign);

module.exports = router;
