import mongoose from "mongoose";

const homeExpenseSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: {
      type: String,
      enum: [
        "home_intake",
        "staff_salary",
        "supplier_payment",
        "personal",
        "credit_card_bill",
        "other",
      ],
      required: true,
    },
    paymentSource: {
      type: String,
      enum: ["home_cash", "bank_account"],
      default: "home_cash",
    },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    creditCardId: { type: mongoose.Schema.Types.ObjectId, ref: "CreditCard" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.HomeExpense || mongoose.model("HomeExpense", homeExpenseSchema);
