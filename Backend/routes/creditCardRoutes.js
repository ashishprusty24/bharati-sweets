const express = require("express");
const router = express.Router();
const creditCardController = require("../controllers/creditCardController");

router.get("/", async (req, res) => {
  try {
    const cards = await creditCardController.getAllCards();
    res.json(cards);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const newCard = await creditCardController.createCard(req.body);
    res.status(201).json(newCard);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
