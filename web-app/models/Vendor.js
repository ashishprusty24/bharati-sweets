import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  quantity: { type: Number, default: 1 },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, default: "cash" },
});

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, default: "other" },
    contact: { type: String, default: "N/A" },
    contactPerson: { type: String, default: "" },
    phone: { type: String, default: "N/A" },
    category: { type: String, default: "General" },
    outstandingBalance: { type: Number, default: 0 },
    paymentDue: { type: Number, default: 0 },
    lastPaymentDate: { type: Date },
    address: { type: String, default: "N/A" },
    transactions: [transactionSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
