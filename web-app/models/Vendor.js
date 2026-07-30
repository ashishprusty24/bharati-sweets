import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contactPerson: { type: String, default: "" },
    phone: { type: String, required: true },
    category: { type: String, default: "General" },
    outstandingBalance: { type: Number, default: 0 },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
