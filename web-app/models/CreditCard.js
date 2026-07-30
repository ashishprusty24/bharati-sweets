import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: {
    type: String,
    enum: ["fuel", "shopping", "vendor_payment", "personal", "business", "other"],
    default: "other",
  },
  isSettled: { type: Boolean, default: false },
});

const billPaymentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  paidFrom: {
    type: String,
    enum: ["home_cash", "bank_account"],
    default: "home_cash",
  },
  notes: { type: String, default: "" },
});

const creditCardSchema = new mongoose.Schema(
  {
    cardName: { type: String, required: true },
    last4Digits: { type: String, required: true },
    cardType: {
      type: String,
      enum: ["visa", "mastercard", "rupay", "amex"],
      default: "visa",
    },
    creditLimit: { type: Number, default: 0 },
    transactions: [transactionSchema],
    billPayments: [billPaymentSchema],
  },
  { timestamps: true }
);

creditCardSchema.virtual("currentOutstanding").get(function () {
  return this.transactions
    .filter((t) => !t.isSettled)
    .reduce((sum, t) => sum + (t.amount || 0), 0);
});

creditCardSchema.set("toJSON", { virtuals: true });
creditCardSchema.set("toObject", { virtuals: true });

export default mongoose.models.CreditCard || mongoose.model("CreditCard", creditCardSchema);
