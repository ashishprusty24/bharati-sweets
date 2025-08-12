// models/Inventory.js
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  minStock: { type: Number, required: true },
  costPerUnit: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["in-stock", "low-stock", "out-of-stock"],
    default: "in-stock",
  },
});

module.exports = mongoose.model("Inventory", inventorySchema);
