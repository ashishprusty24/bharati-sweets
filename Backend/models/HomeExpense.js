const mongoose = require("mongoose");

const homeExpenseSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: {
      type: String,
      required: true,
    },
    paymentSource: {
      type: String,
      enum: ["home_cash", "bank_account", "credit_card"],
      default: "home_cash",
    },
    sourceTag: {
      type: String,
      enum: ["daily_ledger", "expenses", "event_order", "direct"],
      default: "direct",
    },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    creditCardId: { type: mongoose.Schema.Types.ObjectId, ref: "CreditCard" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeExpense", homeExpenseSchema);
