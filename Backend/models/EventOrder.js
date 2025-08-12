const mongoose = require("mongoose");

const eventOrderItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
});

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: {
    type: String,
    enum: ["cash", "phonepay", "gpay", "card"],
    required: true,
  },
  cardId: String,
  timestamp: { type: Date, default: Date.now },
});

const eventOrderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    purpose: { type: String, required: true },
    address: { type: String, required: true },
    deliveryDate: { type: Date, required: true },
    deliveryTime: { type: String, required: true }, // "AM" or "PM"
    items: [eventOrderItemSchema],
    payments: [paymentSchema],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Pre-save hook to calculate paid amount
eventOrderSchema.pre("save", function (next) {
  this.paidAmount = this.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = "paid";
  } else if (this.paidAmount > 0) {
    this.paymentStatus = "partial";
  } else {
    this.paymentStatus = "pending";
  }

  next();
});

module.exports = mongoose.model("EventOrder", eventOrderSchema);
