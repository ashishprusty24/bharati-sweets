// models/Vendor.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  quantity: { type: Number, default: 1 },
  amount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    default: "cash",
  },
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CreditCard",
    default: null,
  },
});

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    default: "other",
  },
  contact: { type: String, default: "N/A" },
  address: { type: String, default: "N/A" },
  suppliedItems: [{ type: String }],
  dailySupply: { type: Number, default: 0 },
  monthlySupply: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  paymentDue: { type: Number, default: 0 },
  lastPaymentDate: { type: Date },
  transactions: [transactionSchema],
});

module.exports = mongoose.model("Vendor", vendorSchema);
