import mongoose from "mongoose";

const eventOrderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
  name: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
});

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, enum: ["cash", "upi", "card", "bank_transfer"], default: "cash" },
  timestamp: { type: Date, default: Date.now },
  notes: { type: String, default: "" },
});

const eventOrderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    purpose: { type: String, required: true },
    eventDate: { type: Date, required: true },
    deliveryAddress: { type: String, default: "" },
    items: [eventOrderItemSchema],
    totalAmount: { type: Number, required: true },
    advancePaid: { type: Number, default: 0 },
    payments: [paymentSchema],
    status: { type: String, enum: ["pending", "confirmed", "in_preparation", "completed", "cancelled"], default: "pending" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.EventOrder || mongoose.model("EventOrder", eventOrderSchema);
