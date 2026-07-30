import mongoose from "mongoose";

const regularOrderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
  name: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
});

const regularOrderSchema = new mongoose.Schema(
  {
    customerName: { type: String, default: "Walk-in" },
    customerPhone: { type: String, default: "" },
    items: [regularOrderItemSchema],
    totalAmount: { type: Number, required: true },
    payment: {
      method: { type: String, enum: ["cash", "upi", "card"], default: "cash" },
      status: { type: String, enum: ["paid", "pending"], default: "paid" },
      amount: { type: Number, required: true },
    },
    orderDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.RegularOrder || mongoose.model("RegularOrder", regularOrderSchema);
