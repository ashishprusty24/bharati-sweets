import mongoose from "mongoose";

const ledgerItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["income", "expense"], required: true },
  category: { type: String, default: "other" },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  paymentMode: { type: String, enum: ["cash", "bank"], default: "cash" },
});

const sweetProductionSchema = new mongoose.Schema({
  sweetName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, enum: ["kg", "ghan", "pcs", "litre"], default: "ghan" },
  actualSold: { type: Number, default: 0 },
  notes: { type: String, default: "" },
});

const dailyLedgerSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    festival: { type: String, default: "" },
    sweetProduction: [sweetProductionSchema],
    openingBalance: { type: Number, default: 0 },
    openingBankBalance: { type: Number, default: 0 },
    cashSales: { type: Number, default: 0 },
    digitalSales: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    otherIncome: { type: Number, default: 0 },
    cashToHome: { type: Number, default: 0 },
    digitalToHome: { type: Number, default: 0 },
    items: [ledgerItemSchema],
    closingBalance: { type: Number, default: 0 },
    closingBankBalance: { type: Number, default: 0 },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.DailyLedger || mongoose.model("DailyLedger", dailyLedgerSchema);
