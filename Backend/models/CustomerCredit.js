const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  method: { type: String, default: "cash" },
});

const customerCreditSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    balance: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "" },
    dueDate: { type: Date },
    autoReminderEnabled: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },
    payments: [paymentSchema],
  },
  { timestamps: true }
);

customerCreditSchema.pre("save", function (next) {
  this.paidAmount = (this.payments || []).reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );
  this.balance = Math.max(0, (this.totalAmount || 0) - this.paidAmount);

  if (this.balance === 0) {
    this.status = "paid";
  } else if (this.paidAmount > 0) {
    this.status = "partial";
  } else {
    this.status = "pending";
  }

  next();
});

module.exports = mongoose.model("CustomerCredit", customerCreditSchema);
