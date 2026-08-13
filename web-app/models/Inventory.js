import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String },
    kitchenSection: { type: String, default: "Uncategorized" },
    price: { type: Number },
    costPerUnit: { type: Number },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true, default: "kg" },
    minStock: { type: Number, default: 5 },
    minThreshold: { type: Number, default: 5 },
  },
  { timestamps: true }
);

export default mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);
