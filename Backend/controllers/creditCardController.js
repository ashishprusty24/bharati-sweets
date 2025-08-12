// controllers/creditCardController.js
const CreditCard = require("../models/CreditCard");

// Get all credit cards
exports.getAllCreditCards = async (req, res) => {
  try {
    const creditCards = await CreditCard.find();
    res.json(creditCards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new credit card
exports.createCreditCard = async (req, res) => {
  const creditCard = new CreditCard(req.body);

  try {
    const newCreditCard = await creditCard.save();
    res.status(201).json(newCreditCard);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update credit card
exports.updateCreditCard = async (req, res) => {
  try {
    const updatedCreditCard = await CreditCard.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedCreditCard);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete credit card
exports.deleteCreditCard = async (req, res) => {
  try {
    await CreditCard.findByIdAndDelete(req.params.id);
    res.json({ message: "Credit card deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
