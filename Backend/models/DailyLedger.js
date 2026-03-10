const mongoose = require("mongoose");

const ledgerItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["income", "expense"], required: true },
  category: { type: String, default: "other" }, // e.g., milk, gas, marketing
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" }
});

const dailyLedgerSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    openingBalance: { type: Number, default: 0 },
    cashSales: { type: Number, default: 0 },
    digitalSales: { type: Number, default: 0 }, // PhonePe, GPay
    totalExpenses: { type: Number, default: 0 },
    otherIncome: { type: Number, default: 0 },
    items: [ledgerItemSchema],
    closingBalance: { type: Number, default: 0 },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DailyLedger", dailyLedgerSchema);
