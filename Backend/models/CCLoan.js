const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: "" },
  isRepaid: { type: Boolean, default: false },
});

const repaymentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  notes: { type: String, default: "" },
});

const ccLoanSchema = new mongoose.Schema(
  {
    accountName: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    sanctionedLimit: { type: Number, default: 2500000 },
    sanctionDate: { type: Date, default: Date.now },
    withdrawals: [withdrawalSchema],
    repayments: [repaymentSchema],
  },
  { timestamps: true }
);

// Virtual: current utilized = total withdrawn - total repaid
ccLoanSchema.virtual("currentUtilized").get(function () {
  const totalWithdrawn = (this.withdrawals || []).reduce(
    (sum, w) => sum + (w.amount || 0),
    0
  );
  const totalRepaid = (this.repayments || []).reduce(
    (sum, r) => sum + (r.amount || 0),
    0
  );
  return Math.max(totalWithdrawn - totalRepaid, 0);
});

// Virtual: available limit
ccLoanSchema.virtual("availableLimit").get(function () {
  return Math.max((this.sanctionedLimit || 0) - (this.currentUtilized || 0), 0);
});

// Ensure virtuals appear in JSON
ccLoanSchema.set("toJSON", { virtuals: true });
ccLoanSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("CCLoan", ccLoanSchema);
