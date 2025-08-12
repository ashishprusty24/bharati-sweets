// models/Vendor.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  quantity: { type: Number, required: true },
  amount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ["cash", "phonepe", "gpay", "paytm", "card", "bank"],
    required: true,
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
    enum: ["milk", "chenna", "sugar", "ghee", "flour", "packaging", "other"],
    required: true,
  },
  contact: { type: String, required: true },
  address: { type: String, required: true },
  suppliedItems: [{ type: String }],
  dailySupply: { type: Number },
  monthlySupply: { type: Number },
  rate: { type: Number, required: true },
  paymentDue: { type: Number, default: 0 },
  lastPaymentDate: { type: Date },
  transactions: [transactionSchema],
});

module.exports = mongoose.model("Vendor", vendorSchema);
